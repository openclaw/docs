---
read_when:
    - Slack'i kurma veya Slack soket, HTTP ya da aktarma modu sorunlarını giderme
summary: Slack kurulumu ve çalışma zamanı davranışı (Socket Mode, HTTP Request URL'leri ve aktarma modu)
title: Slack
x-i18n:
    generated_at: "2026-07-16T16:41:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b0b3c4ddcd4ea46448bf4fcba4713a92cd487a3ab69077f6b808fbcc65608c7f
    source_path: channels/slack.md
    workflow: 16
---

Slack desteği, Slack uygulama entegrasyonları aracılığıyla DM'leri ve kanalları kapsar. Varsayılan aktarım Socket Mode'dur; HTTP Request URL'leri de desteklenir. Aktarma modu, Slack girişinin güvenilir bir yönlendirici tarafından yönetildiği yönetilen dağıtımlar içindir.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Slack DM'leri varsayılan olarak eşleştirme modunu kullanır.
  </Card>
  <Card title="Eğik çizgi komutları" icon="terminal" href="/tr/tools/slash-commands">
    Yerel komut davranışı ve komut kataloğu.
  </Card>
  <Card title="Kanal sorunlarını giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım çalışma planları.
  </Card>
</CardGroup>

## Aktarım seçme

Socket Mode ve HTTP Request URL'leri; mesajlaşma, eğik çizgi komutları, App Home ve etkileşim özellikleri açısından eşdeğerdir. Özelliklere göre değil, dağıtım yapısına göre seçim yapın.

| Konu                         | Socket Mode (varsayılan)                                                                                                                             | HTTP Request URL'leri                                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Herkese açık Gateway URL'si  | Gerekli değil                                                                                                                                        | Gerekli (DNS, TLS, ters proxy veya tünel)                                                                      |
| Giden ağ                     | `wss-primary.slack.com` adresine giden WSS erişilebilir olmalıdır                                                                                          | Giden WS yoktur; yalnızca gelen HTTPS                                                                          |
| Gerekli token'lar            | Bot token'ı + `connections:write` içeren App-Level Token                                                                                              | Bot token'ı + Signing Secret                                                                                   |
| Geliştirme dizüstü bilgisayarı / güvenlik duvarı arkası | Olduğu gibi çalışır                                                                                                                   | Herkese açık bir tünel (ngrok, Cloudflare Tunnel, Tailscale Funnel) veya hazırlık Gateway'i gerekir             |
| Yatay ölçeklendirme          | Ana bilgisayar başına, uygulama başına bir Socket Mode oturumu; birden çok Gateway ayrı Slack uygulamaları gerektirir                                 | Durumsuz POST işleyicisi; birden çok Gateway replikası, yük dengeleyici arkasında tek bir uygulamayı paylaşabilir |
| Tek Gateway'de birden çok hesap | Desteklenir; her hesap kendi WS bağlantısını açar                                                                                                  | Desteklenir; kayıtların çakışmaması için her hesabın benzersiz bir `webhookPath` değerine (varsayılan `/slack/events`) ihtiyacı vardır |
| Eğik çizgi komutu aktarımı   | WS bağlantısı üzerinden teslim edilir; `slash_commands[].url` yok sayılır                                                                                | Slack, `slash_commands[].url` adresine POST gönderir; komutun yönlendirilmesi için bu alan zorunludur               |
| İstek imzalama               | Kullanılmaz (kimlik doğrulama App-Level Token ile yapılır)                                                                                           | Slack her isteği imzalar; OpenClaw, `signingSecret` ile doğrular                                             |
| Bağlantı kesintisinden kurtarma | Slack SDK otomatik yeniden bağlantısı etkindir; OpenClaw ayrıca başarısız Socket Mode oturumlarını sınırlı geri çekilmeyle yeniden başlatır. Pong zaman aşımı aktarım ayarı geçerlidir. | Kesilecek kalıcı bağlantı yoktur; yeniden denemeler Slack tarafından istek başına yapılır                       |

<Note>
  Giden yönde `*.slack.com` adresine erişebilen ancak gelen HTTPS bağlantılarını kabul edemeyen tek Gateway'li ana bilgisayarlar, geliştirme dizüstü bilgisayarları ve şirket içi ağlar için **Socket Mode'u seçin**.

Bir yük dengeleyicinin arkasında birden çok Gateway replikası çalıştırırken, giden WSS engellenmiş ancak gelen HTTPS'ye izin verilmişse veya Slack Webhook'larını zaten bir ters proxy'de sonlandırıyorsanız **HTTP Request URL'lerini seçin**.
</Note>

<Warning>
  Slack, tek bir uygulama için birden çok Socket Mode bağlantısını sürdürebilir ve her yükü herhangi bir bağlantıya teslim edebilir. Bu nedenle, bir Slack uygulamasını paylaşan ayrı OpenClaw Gateway'lerinin eşdeğer yönlendirme ve yetkilendirme yapılandırmasına sahip olması gerekir. Aksi takdirde Gateway başına ayrı bir Slack uygulaması, tek bir aktarma girişi veya yük dengeleyici arkasında HTTP Request URL'leri kullanın. Bkz. [Socket Mode'u kullanma](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections).
</Warning>

### Aktarma modu

Aktarma modu, Slack girişini OpenClaw Gateway'den ayırır. Güvenilir bir yönlendirici tek Slack Socket Mode bağlantısını yönetir, hedef Gateway'i seçer ve kimliği doğrulanmış bir websocket üzerinden türü belirlenmiş bir olay iletir. Gateway, giden Slack Web API çağrıları için kendi bot token'ını kullanmaya devam eder.

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

Aktarma URL'si localhost'u hedeflemediği sürece `wss://` kullanmalıdır. Taşıyıcı token'ını ve yönlendirici rota tablosunu Slack yetkilendirme sınırının bir parçası olarak değerlendirin: yönlendirilen olaylar, normal Slack mesaj işleyicisine yetkilendirilmiş etkinleştirmeler olarak girer. Yönlendiricinin sağladığı websocket `hello` çerçevesindeki `slack_identity`, varsayılan giden kullanıcı adını ve simgeyi ayarlayabilir; çağıran tarafından açıkça sağlanan kimlik yine önceliklidir. Aktarma bağlantısı, Socket Mode ile aynı sınırlı geri çekilme zamanlamasıyla yeniden bağlanır ve bağlantı her kesildiğinde yönlendiricinin sağladığı kimliği temizler.

### Enterprise Grid kuruluş genelindeki kurulumlar

Tek bir Slack hesabı, Enterprise Grid kuruluş genelindeki bir kurulumun kapsadığı her çalışma alanından mesaj alabilir. Doğrudan Socket Mode veya HTTP Request URL'lerini seçin; aktarma modu kurumsal hesaplar için desteklenmez. Aşağıdaki her iki en az ayrıcalıklı bildirim de yalnızca V1 `message` ve `app_mention` olay yolunu, anlık yanıtları ve dinleyici tarafından yönetilen durum tepkilerini etkinleştirir.

#### Socket Mode

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw için Slack bağlayıcısı"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

Bir Enterprise Grid Org Admin veya Org Owner'ın uygulamayı onaylamasını, kuruluş düzeyinde kurmasını ve kurulumun kapsayacağı çalışma alanlarını seçmesini sağlayın. OpenClaw'ı başlatmadan önce uygulamanın amaçlanan her çalışma alanında kullanılabilir olduğunu doğrulayın. Socket Mode için `connections:write` içeren uygulama düzeyinde bir token oluşturun, ardından kuruluş kurulumundaki bot token'ını kopyalayın. Kuruluşta kurulu bot token'ını kullanan hesabı yapılandırın:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      enterpriseOrgInstall: true,
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

#### HTTP Request URL'leri

Gateway'in herkese açık bir HTTPS uç noktası olduğunda ve Socket Mode bağlantısı açmadığında HTTP modunu kullanın. Örnek URL'yi Gateway'in herkese açık `webhookPath` URL'siyle (varsayılan `/slack/events`) değiştirin:

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw için Slack bağlayıcısı"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

Bir Enterprise Grid Org Admin veya Org Owner'ın uygulamayı onaylamasını, kuruluş düzeyinde kurmasını ve kurulumun kapsayacağı çalışma alanlarını seçmesini sağlayın. Slack, Request URL'yi doğruladıktan sonra kuruluş kurulumunun bot token'ını ve uygulamanın **Basic Information -> App Credentials -> Signing Secret** değerini kopyalayın. Kurumsal hesabı aynı Request URL yolu ile yapılandırın:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      enterpriseOrgInstall: true,
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: {
        source: "env",
        provider: "default",
        id: "SLACK_SIGNING_SECRET",
      },
      webhookPath: "/slack/events",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

OpenClaw başlatılırken `enterpriseOrgInstall` değerini Slack `auth.test` ile doğrular. İşaret olmadan kuruluşta kurulmuş bir token veya işaretle birlikte bir çalışma alanı token'ı, başlatmanın başarısız olmasına neden olur. Kurulum izni veren çalışma alanları açısından Slack doğruluk kaynağı olmaya devam eder; ardından OpenClaw, yapılandırılmış kanal, kullanıcı, DM ve bahsetme politikalarını teslim edilen her olaya uygular. Enterprise V1, kuruluş kurulumları döngü önleme için çalışma alanına göre nitelendirilmiş kararlı bir bot kimliği sağlamadığından, `allowBots` değerinden bağımsız olarak bot tarafından oluşturulan tüm `message` ve `app_mention` olaylarını yönlendirmeden önce reddeder.

Enterprise desteği kasıtlı olarak doğrudan Socket Mode veya HTTP `message` ve `app_mention` olayları ve bunların anlık yanıtlarıyla sınırlandırılmıştır. Aktarma modu, eğik çizgi komutları, etkileşimler, App Home, tepki olayı dinleyicileri, sabitlemeler, Slack eylem araçları, Slack'e özgü onaylar, bağlamalar, kuyruğa alınmış veya zamanlanmış teslim ve proaktif gönderimler kurumsal bir hesapta kullanılamaz. Giden alındı bildirimi, yazma ve durum tepkileri dinleyici tarafından yönetilen Slack istemcisi üzerinden desteklenir ve `reactions:write` gerektirir; gelen tepki bildirimleri ve tepki eylemi araçları kullanılamaz.

Anında yanıtlar; parçalar, medya, meta veriler, kimlik geri dönüşü, bağlantı önizlemeleri ve alındı bilgileri için standart Slack teslim davranışını yeniden kullanır, ancak yalnızca doğrulanmış, dinleyiciye ait istemci etkin olay işleme turunda kaldığı sürece. Bellek içi gönderme kuyruğu ve ileti dizisine katılım kayıtları, söz konusu olayın çalışma alanına göre bölümlenir; istemcinin kendisi hiçbir zaman serileştirilmez veya kalıcı hâle getirilmez.

Kanal ilkesi anahtarları ve `dm.groupChannels` girdileri, ham kararlı Slack kanal kimliklerini veya
`channel:<id>` biçimini kullanmalıdır. OpenClaw, çalışma zamanı eşleştirmesi için her iki biçimi de ham kanal kimliğine normalleştirir; `slack:`, `group:` ve `mpim:` ön ekleri başlatmanın başarısız olmasına neden olur.
Kullanıcı ilkesi girdileri kararlı Slack kullanıcı kimliklerini kullanmalıdır; adlar, kısa adlar, görünen adlar ve e-posta adresleri başlatmanın başarısız olmasına neden olur. Kimlikler, Slack'in standart büyük harfli ön ekini ve gövdesini kullanmalıdır (örneğin `C0123456789` veya `U0123456789`); küçük harfli ve kısa benzerleri başlatmanın başarısız olmasına neden olur. Kurumsal hesaplar
`dangerouslyAllowNameMatching` seçeneğini etkinleştiremez. Kurumsal hesaplar genel
`mentionPatterns.mode` değerini ayarlayabilir, ancak yalın Slack kanal kimlikleri çalışma alanıyla nitelenmediğinden ve çalışma alanları arasında yeniden kullanılabildiğinden `mentionPatterns.allowIn` ve
`mentionPatterns.denyIn` başlatmanın başarısız olmasına neden olur. Çalışma alanı kurulumları mevcut kapsamlı bahsetme kalıbı davranışını korur. Kabul edilen her çalışma alanı, Slack kimlikleri çakışsa bile ayrı yönlendirme, oturum, transkript, yinelenenleri ayıklama, geçmiş ve önbellek kimliği alır. `message` akışı içinde sıradan kullanıcı mesajları ve kullanıcı tarafından oluşturulan `file_share` olayları desteklenir; diğer mesaj alt türleri yetkilendirme veya sistem olayı işlemesinden önce reddedilir.

Kurumsal DM'ler ya devre dışı bırakılmalı (`dm.enabled=false` veya
`dmPolicy="disabled"`) ya da `dmPolicy="open"` ve değişmez `"*"` değerini içeren geçerli bir hesap `allowFrom` değeriyle açıkça açılmalıdır. Boş bir izin listesi veya `"*"` olmadan kullanıcıya özgü kimlikler başlatmanın başarısız olmasına neden olur. Slack kullanıcı kimlikleri bu yetkilendirme depolarında çalışma alanıyla nitelenmediğinden eşleştirme ve kullanıcı başına DM izin listeleri reddedilir. Kanal ve gönderen ilkesi kanal mesajlarına uygulanmaya devam eder.

## Kurulum

```bash
openclaw plugins install @openclaw/slack
```

`plugins install`, Plugin'i kaydeder ve etkinleştirir. Aşağıdaki Slack uygulamasını ve kanal ayarlarını yapılandırana kadar hiçbir işlem yapmaz. Genel Plugin kurulum kuralları için [Plugin'ler](/tr/tools/plugin) bölümüne bakın.

## Hızlı kurulum

Bu bölümdeki manifestler, çalışma alanı kapsamlı bir kurulum oluşturur. Enterprise Grid kuruluş kurulumu için bunun yerine özel [kuruluş genelindeki manifesti ve iş akışını](#enterprise-grid-org-wide-installs) kullanın.

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
    "description": "OpenClaw için Slack bağlayıcısı"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw, Slack asistan ileti dizilerini OpenClaw ajanlarına bağlar.",
      "suggested_prompts": [
        { "title": "Neler yapabilirsiniz?", "message": "Bana hangi konularda yardımcı olabilirsiniz?" },
        {
          "title": "Bu kanalı özetleyin",
          "message": "Bu kanaldaki son etkinlikleri özetleyin."
        },
        { "title": "Yanıt taslağı hazırlayın", "message": "Bir yanıt taslağı hazırlamama yardımcı olun." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "OpenClaw'a mesaj gönderin",
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
    "description": "OpenClaw için Slack bağlayıcısı"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw, Slack asistan ileti dizilerini OpenClaw ajanlarına bağlar.",
      "suggested_prompts": [
        { "title": "Neler yapabilirsiniz?", "message": "Bana hangi konularda yardımcı olabilirsiniz?" },
        {
          "title": "Bu kanalı özetleyin",
          "message": "Bu kanaldaki son etkinlikleri özetleyin."
        },
        { "title": "Yanıt taslağı hazırlayın", "message": "Bir yanıt taslağı hazırlamama yardımcı olun." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "OpenClaw'a mesaj gönderin",
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
          **Önerilen**, Slack Plugin'inin tam özellik kümesiyle eşleşir: App Home, eğik çizgi komutları, dosyalar, tepkiler, sabitlenen öğeler, grup DM'leri ve emoji/kullanıcı grubu okumaları. Çalışma alanı ilkesi kapsamları kısıtladığında **Minimal** seçeneğini belirleyin — DM'leri, kanal/grup geçmişini, bahsetmeleri ve eğik çizgi komutlarını kapsar; ancak dosyaları, tepkileri, sabitlenen öğeleri, grup DM'sini (`mpim:*`), `emoji:read` ve `usergroups:read` özelliklerini kapsam dışı bırakır. Her kapsamın gerekçesi ve ek eğik çizgi komutları gibi eklenebilir seçenekler için [Manifest ve kapsam denetim listesi](#manifest-and-scope-checklist) bölümüne bakın.
        </Note>

        Slack uygulamayı oluşturduktan sonra:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: `connections:write` ekleyin, kaydedin ve Uygulama Düzeyi Token'ını kopyalayın.
        - **Install App -> Install to Workspace**: Bot Kullanıcısı OAuth Token'ını kopyalayın.

      </Step>

      <Step title="OpenClaw'ı yapılandırın">

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

        Ortam değişkeni geri dönüşü (yalnızca varsayılan hesap):

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
```

      </Step>

      <Step title="Gateway'i başlatın">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP İstek URL'leri">
    <Steps>
      <Step title="Yeni bir Slack uygulaması oluşturun">
        [api.slack.com/apps](https://api.slack.com/apps/new) adresini açın → **Create New App** → **From a manifest** → çalışma alanınızı seçin → aşağıdaki manifestlerden birini yapıştırın → `https://gateway-host.example.com/slack/events` değerini herkese açık Gateway URL'nizle değiştirin → **Next** → **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw için Slack bağlayıcısı"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw, Slack asistan ileti dizilerini OpenClaw ajanlarına bağlar.",
      "suggested_prompts": [
        { "title": "Neler yapabilirsiniz?", "message": "Bana hangi konularda yardımcı olabilirsiniz?" },
        {
          "title": "Bu kanalı özetleyin",
          "message": "Bu kanaldaki son etkinlikleri özetleyin."
        },
        { "title": "Yanıt taslağı hazırlayın", "message": "Bir yanıt taslağı hazırlamama yardımcı olun." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "OpenClaw'a mesaj gönderin",
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
    "description": "OpenClaw için Slack bağlayıcısı"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw, Slack asistan ileti dizilerini OpenClaw ajanlarına bağlar.",
      "suggested_prompts": [
        { "title": "Neler yapabilirsiniz?", "message": "Bana hangi konularda yardımcı olabilirsiniz?" },
        {
          "title": "Bu kanalı özetle",
          "message": "Bu kanaldaki son etkinlikleri özetle."
        },
        { "title": "Yanıt taslağı hazırla", "message": "Bir yanıt taslağı hazırlamama yardım et." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "OpenClaw'a mesaj gönder",
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
          **Önerilen**, Slack plugininin tüm özellik kümesiyle eşleşir; **Minimal**, kısıtlayıcı çalışma alanları için dosyaları, tepkileri, sabitlemeleri, grup DM'lerini (`mpim:*`), `emoji:read` ve `usergroups:read` öğelerini kaldırır. Her kapsamın gerekçesi için [Manifest ve kapsam denetim listesi](#manifest-and-scope-checklist) bölümüne bakın.
        </Note>

        <Info>
          Üç URL alanının (`slash_commands[].url`, `event_subscriptions.request_url` ve `interactivity.request_url` / `message_menu_options_url`) tümü aynı OpenClaw uç noktasını gösterir. Slack'in manifest şeması bunların ayrı ayrı adlandırılmasını gerektirir ancak OpenClaw, yük türüne göre yönlendirme yaptığından tek bir `webhookPath` (varsayılan `/slack/events`) yeterlidir. `slash_commands[].url` içermeyen eğik çizgi komutları, HTTP modunda hiçbir işlem yapmadan sessizce sonlanır.
        </Info>

        Slack uygulamayı oluşturduktan sonra:

        - **Basic Information → App Credentials**: istek doğrulaması için **Signing Secret** değerini kopyalayın.
        - **Install App -> Install to Workspace**: Bot User OAuth Token değerini kopyalayın.

      </Step>

      <Step title="OpenClaw'ı yapılandırın">

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
        Birden fazla hesap kullanan HTTP için benzersiz webhook yolları kullanın

        Kayıtların çakışmaması için her hesaba farklı bir `webhookPath` (varsayılan `/slack/events`) verin.
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

## Socket Mode aktarım ayarları

OpenClaw, Socket Mode için Slack SDK istemcisinin pong zaman aşımını varsayılan olarak 15 saniyeye ayarlar. Aktarım ayarlarını yalnızca çalışma alanına veya ana makineye özgü ayarlama gerektiğinde geçersiz kılın:

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

Bunu yalnızca Slack websocket pong/sunucu ping zaman aşımlarını günlüğe kaydeden veya olay döngüsünde bilinen tıkanmaların bulunduğu ana makinelerde çalışan Socket Mode çalışma alanları için kullanın. `clientPingTimeout`, SDK bir istemci pingi gönderdikten sonraki pong bekleme süresidir; `serverPingTimeout`, Slack sunucu pinglerini bekleme süresidir. Uygulama mesajları ve olayları aktarım canlılığı sinyalleri değil, uygulama durumu olmaya devam eder.

Notlar:

- `socketMode`, HTTP Request URL modunda yok sayılır.
- Temel `channels.slack.socketMode` ayarları, geçersiz kılınmadıkları sürece tüm Slack hesaplarına uygulanır. Hesap başına geçersiz kılmalar `channels.slack.accounts.<accountId>.socketMode` kullanır; bu bir nesne geçersiz kılması olduğundan, söz konusu hesap için istediğiniz tüm soket ayarlama alanlarını ekleyin.
- Yalnızca `clientPingTimeout` için bir OpenClaw varsayılanı (`15000`) vardır. `serverPingTimeout` ve `pingPongLoggingEnabled`, yalnızca yapılandırıldıklarında Slack SDK'ya aktarılır.
- Socket Mode yeniden başlatma geri çekilme süresi yaklaşık 2 saniyeden başlar ve yaklaşık 30 saniyeyle sınırlandırılır. Kurtarılabilir başlatma, başlatmayı bekleme ve bağlantı kesilmesi hataları, kanal durana kadar yeniden denenir. Geçersiz kimlik doğrulaması, iptal edilmiş tokenlar veya eksik kapsamlar gibi kalıcı hesap ve kimlik bilgisi hataları, sonsuza kadar yeniden denenmek yerine hızla başarısız olur.

## Manifest ve kapsam denetim listesi

Temel Slack uygulama manifesti, Socket Mode ve HTTP Request URL'leri için aynıdır. Yalnızca `settings` bloğu (ve eğik çizgi komutunun `url` değeri) farklıdır.

Temel manifest (varsayılan Socket Mode):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw için Slack bağlayıcısı"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw, Slack asistan ileti dizilerini OpenClaw ajanlarına bağlar.",
      "suggested_prompts": [
        { "title": "Neler yapabilirsiniz?", "message": "Bana hangi konularda yardımcı olabilirsiniz?" },
        {
          "title": "Bu kanalı özetle",
          "message": "Bu kanaldaki son etkinlikleri özetle."
        },
        { "title": "Yanıt taslağı hazırla", "message": "Bir yanıt taslağı hazırlamama yardım et." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "OpenClaw'a mesaj gönder",
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

**HTTP Request URLs modu** için `settings` öğesini HTTP değişkeniyle değiştirin ve her eğik çizgi komutuna `url` ekleyin. Herkese açık URL gereklidir:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "OpenClaw'a mesaj gönder",
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

Yukarıdaki varsayılanları genişleten farklı özellikleri kullanıma sunun.

Varsayılan manifest, Slack App Home **Home** sekmesini etkinleştirir ve `app_home_opened` olayına abone olur. Bir çalışma alanı üyesi Home sekmesini açtığında OpenClaw, `views.publish` içeren güvenli bir varsayılan Home görünümü yayımlar; hiçbir görüşme yükü veya özel yapılandırma dahil edilmez. Tek eğik çizgi komutu modu etkinleştirildiğinde komut ipucu `channels.slack.slashCommand.name` kullanır; yerel komutları kullanan veya eğik çizgi komutu kullanmayan kurulumlarda bu ipucu atlanır. **Messages** sekmesi Slack DM'leri için etkin kalır. Manifest ayrıca `features.assistant_view`, `assistant:write`, `assistant_thread_started` ve `assistant_thread_context_changed` ile Slack asistan ileti dizilerini etkinleştirir; asistan ileti dizileri kendi OpenClaw ileti dizisi oturumlarına yönlendirilir ve Slack tarafından sağlanan ileti dizisi bağlamını ajanın kullanımına açık tutar.

<AccordionGroup>
  <Accordion title="İsteğe bağlı yerel eğik çizgi komutları">

    Tek bir yapılandırılmış komut yerine bazı ayrıntılara dikkat edilerek birden fazla [yerel eğik çizgi komutu](#commands-and-slash-behavior) kullanılabilir:

    - `/status` komutu ayrılmış olduğundan `/status` yerine `/agentstatus` kullanın.
    - Bir Slack uygulamasına aynı anda en fazla 25 eğik çizgi komutu kaydedilebilir (Slack platform sınırı).

    Mevcut `features.slash_commands` bölümünüzü [kullanılabilir komutların](/tr/tools/slash-commands#command-list) bir alt kümesiyle değiştirin:

    <Tabs>
      <Tab title="Socket Mode (varsayılan)">

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Yeni bir oturum başlat",
      "usage_hint": "[model]"
    },
    {
      "command": "/reset",
      "description": "Geçerli oturumu sıfırla"
    },
    {
      "command": "/compact",
      "description": "Oturum bağlamını sıkıştır",
      "usage_hint": "[instructions]"
    },
    {
      "command": "/stop",
      "description": "Geçerli çalıştırmayı durdur"
    },
    {
      "command": "/session",
      "description": "İş parçacığı bağlama süresinin dolmasını yönet",
      "usage_hint": "boşta <duration|off> veya azami yaş <duration|off>"
    },
    {
      "command": "/think",
      "description": "Düşünme düzeyini ayarla",
      "usage_hint": "<level>"
    },
    {
      "command": "/verbose",
      "description": "Ayrıntılı çıktıyı aç veya kapat",
      "usage_hint": "on|off|full"
    },
    {
      "command": "/fast",
      "description": "Hızlı modu göster veya ayarla",
      "usage_hint": "[status|on|off]"
    },
    {
      "command": "/reasoning",
      "description": "Akıl yürütme görünürlüğünü aç veya kapat",
      "usage_hint": "[on|off|stream]"
    },
    {
      "command": "/elevated",
      "description": "Yükseltilmiş modu aç veya kapat",
      "usage_hint": "[on|off|ask|full]"
    },
    {
      "command": "/exec",
      "description": "Çalıştırma varsayılanlarını göster veya ayarla",
      "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
    },
    {
      "command": "/approve",
      "description": "Bekleyen onay isteklerini onayla veya reddet",
      "usage_hint": "<id> <decision>"
    },
    {
      "command": "/model",
      "description": "Modeli göster veya ayarla",
      "usage_hint": "[name|#|status]"
    },
    {
      "command": "/models",
      "description": "Sağlayıcıları/modelleri listele",
      "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
    },
    {
      "command": "/help",
      "description": "Kısa yardım özetini göster"
    },
    {
      "command": "/commands",
      "description": "Oluşturulan komut kataloğunu göster"
    },
    {
      "command": "/tools",
      "description": "Geçerli aracının şu anda neleri kullanabileceğini göster",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "Kullanılabildiğinde sağlayıcı kullanımı/kotası dâhil çalışma zamanı durumunu göster"
    },
    {
      "command": "/tasks",
      "description": "Geçerli oturumun etkin/yakın zamandaki arka plan görevlerini listele"
    },
    {
      "command": "/context",
      "description": "Bağlamın nasıl oluşturulduğunu açıkla",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "Gönderen kimliğinizi göster"
    },
    {
      "command": "/skill",
      "description": "Bir skill'i adına göre çalıştır",
      "usage_hint": "<name> [input]"
    },
    {
      "command": "/btw",
      "description": "Oturum bağlamını değiştirmeden bir yan soru sor",
      "usage_hint": "<question>"
    },
    {
      "command": "/side",
      "description": "Oturum bağlamını değiştirmeden bir yan soru sor",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "Kullanım alt bilgisini denetle veya maliyet özetini göster",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="HTTP İstek URL'leri">
        Yukarıdaki Socket Mode ile aynı `slash_commands` listesini kullanın ve her girdiye `"url": "https://gateway-host.example.com/slack/events"` ekleyin. Örnek:

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Yeni bir oturum başlat",
      "usage_hint": "[model]",
      "url": "https://gateway-host.example.com/slack/events"
    },
    {
      "command": "/help",
      "description": "Kısa yardım özetini göster",
      "url": "https://gateway-host.example.com/slack/events"
    }
  ]
}
```

        Bu `url` değerini listedeki her komutta yineleyin.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="İsteğe bağlı yazarlık kapsamları (yazma işlemleri)">
    Giden iletilerin varsayılan Slack uygulama kimliği yerine etkin aracı kimliğini (özel kullanıcı adı ve simge) kullanmasını istiyorsanız `chat:write.customize` bot kapsamını ekleyin.

    Bir emoji simgesi kullanıyorsanız Slack, `:emoji_name:` söz dizimini bekler.

  </Accordion>
  <Accordion title="İsteğe bağlı kullanıcı belirteci kapsamları (okuma işlemleri)">
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

## Belirteç modeli

- Socket Mode için `botToken` + `appToken` gereklidir.
- HTTP modu, `botToken` + `signingSecret` gerektirir.
- Aktarma modu; `botToken` ile birlikte `relay.url`, `relay.authToken` ve `relay.gatewayId` gerektirir; uygulama belirteci veya imzalama gizli anahtarı kullanmaz.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken` ve `userToken`, düz metin
  dizelerini veya SecretRef nesnelerini kabul eder.
- Yapılandırma belirteçleri, ortam geri dönüşünü geçersiz kılar.
- `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` ve `SLACK_USER_TOKEN` ortam geri dönüşlerinin her biri yalnızca varsayılan hesaba uygulanır.
- `userToken`, varsayılan olarak salt okunur davranışı (`userTokenReadOnly: true`) kullanır.

Durum anlık görüntüsü davranışı:

- Slack hesap incelemesi, kimlik bilgisi başına `*Source` ve `*Status`
  alanlarını (`botToken`, `appToken`, `signingSecret`, `userToken`) izler.
- Durum `available`, `configured_unavailable` veya `missing` olur.
- `configured_unavailable`, hesabın SecretRef
  veya satır içi olmayan başka bir gizli kaynak aracılığıyla yapılandırıldığı, ancak geçerli komut/çalışma zamanı yolunun
  gerçek değeri çözümleyemediği anlamına gelir.
- HTTP modunda `signingSecretStatus` dâhil edilir; Socket Mode'da
  gerekli çift `botTokenStatus` + `appTokenStatus` olur.

<Tip>
Eylemler/dizin okumaları için yapılandırıldığında kullanıcı belirteci tercih edilebilir. Yazma işlemleri için bot belirteci tercih edilmeye devam eder; kullanıcı belirteciyle yazmaya yalnızca `userTokenReadOnly: false` olduğunda ve bot belirteci kullanılamadığında izin verilir.
</Tip>

## Eylemler ve geçitler

Slack eylemleri `channels.slack.actions.*` tarafından denetlenir.

Geçerli Slack araçlarındaki kullanılabilir eylem grupları:

| Grup       | Varsayılan |
| ---------- | ---------- |
| messages   | etkin      |
| reactions  | etkin      |
| pins       | etkin      |
| memberInfo | etkin      |
| emojiList  | etkin      |

Geçerli Slack ileti eylemleri arasında `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` ve `emoji-list` bulunur. `download-file`, gelen dosya yer tutucularında gösterilen Slack dosya kimliklerini kabul eder ve görüntüler için görüntü önizlemelerini, diğer dosya türleri içinse yerel dosya meta verilerini döndürür.

## Erişim denetimi ve yönlendirme

<Tabs>
  <Tab title="DM politikası">
    `channels.slack.dmPolicy`, DM erişimini denetler. `channels.slack.allowFrom`, standart DM izin listesidir.

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`channels.slack.allowFrom` değerinin `"*"` içermesini gerektirir)
    - `disabled`

    DM bayrakları:

    - `dm.enabled` (varsayılan olarak true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (eski)
    - `dm.groupEnabled` (grup DM'leri varsayılan olarak false)
    - `dm.groupChannels` (isteğe bağlı MPIM izin listesi)

    Çoklu hesap önceliği:

    - `channels.slack.accounts.default.allowFrom` yalnızca `default` hesabına uygulanır.
    - Adlandırılmış hesaplar, kendi `allowFrom` değerleri ayarlanmamışsa `channels.slack.allowFrom` değerini devralır.
    - Adlandırılmış hesaplar `channels.slack.accounts.default.allowFrom` değerini devralmaz.

    Eski `channels.slack.dm.policy` ve `channels.slack.dm.allowFrom` uyumluluk amacıyla hâlâ okunur. `openclaw doctor --fix`, erişimi değiştirmeden yapabildiğinde bunları `dmPolicy` ve `allowFrom` değerlerine taşır.

    DM'lerde eşleştirme `openclaw pairing approve slack <code>` kullanır.

  </Tab>

  <Tab title="Kanal politikası">
    `channels.slack.groupPolicy`, kanal işlemeyi denetler:

    - `open`
    - `allowlist`
    - `disabled`

    Kanal izin listesi `channels.slack.channels` altında bulunur ve yapılandırma anahtarları olarak **kararlı Slack kanal kimliklerini kullanmalıdır** (örneğin `C12345678`).

    Çalışma zamanı notu: `channels.slack` tamamen eksikse (yalnızca ortamla kurulum), çalışma zamanı `groupPolicy="allowlist"` değerine geri döner ve (`channels.defaults.groupPolicy` ayarlanmış olsa bile) bir uyarı kaydeder.

    Ad/kimlik çözümleme:

    - kanal izin listesi girdileri ve DM izin listesi girdileri, belirteç erişimi izin verdiğinde başlangıçta çözümlenir
    - çözümlenmemiş kanal adı girdileri yapılandırıldıkları şekilde tutulur ancak varsayılan olarak yönlendirmede yok sayılır
    - gelen yetkilendirmesi ve kanal yönlendirmesi varsayılan olarak kimlik önceliklidir; doğrudan kullanıcı adı/kısa ad eşleşmesi `channels.slack.dangerouslyAllowNameMatching: true` gerektirir

    <Warning>
    Ada dayalı anahtarlar (`#channel-name` veya `channel-name`), `groupPolicy: "allowlist"` altında **eşleşmez**. Kanal araması varsayılan olarak kimlik önceliklidir; bu nedenle ada dayalı bir anahtar hiçbir zaman başarıyla yönlendirilmez ve o kanaldaki tüm iletiler sessizce engellenir. Bu durum, yönlendirme için kanal anahtarının gerekli olmadığı ve ada dayalı bir anahtarın çalışıyor gibi göründüğü `groupPolicy: "open"` seçeneğinden farklıdır.

    Anahtar olarak her zaman Slack kanal kimliğini kullanın. Bunu bulmak için: Slack'te kanala sağ tıklayın → **Copy link** — kimlik (`C...`) URL'nin sonunda görünür.

    Doğru:

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { enabled: true, requireMention: true },
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
            "#eng-my-channel": { enabled: true, requireMention: true },
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
    - bot kullanıcısı söz konusu kullanıcı grubunun üyesiyse Slack kullanıcı grubu bahsetmesi (`<!subteam^S...>`); `usergroups:read` gerektirir
    - bahsetme düzenli ifade kalıpları (`agents.list[].groupChat.mentionPatterns`, geri dönüş `messages.groupChat.mentionPatterns`)
    - örtük bota yanıt iş parçacığı davranışı (`thread.requireExplicitMention`, `true` olduğunda devre dışı bırakılır)

    Kanal başına denetimler (`channels.slack.channels.<id>`; adlar yalnızca başlangıç çözümlemesi veya `dangerouslyAllowNameMatching` aracılığıyla):

    - `requireMention`
    - `ignoreOtherMentions`
    - `replyToMode` (`off|first|all|batched`; bu kanal için hesap/sohbet türü yanıt modunu geçersiz kılar)
    - `users` (izin listesi)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` anahtar biçimi: `channel:`, `id:`, `e164:`, `username:`, `name:` veya `"*"` joker karakteri
      (önek içermeyen eski anahtarlar hâlâ yalnızca `id:` ile eşlenir)

    `ignoreOtherMentions` (varsayılan `false`), başka bir kullanıcıdan veya kullanıcı grubundan bahseden ancak bu bottan bahsetmeyen kanal mesajlarını bırakır. DM'ler ve grup DM'leri (MPIM'ler) bundan etkilenmez. Filtre, `auth.test` kaynağından çözümlenmiş bir bot kullanıcı kimliği gerektirir; bu kimlik kullanılamıyorsa (örneğin yalnızca kullanıcı belirteci kullanan bir kimlik), geçit açık kalacak şekilde başarısız olur ve mesajlar değiştirilmeden geçer.

    `allowBots`, kanallar ve özel kanallar için ihtiyatlı davranır: bot tarafından oluşturulan oda mesajları yalnızca gönderen bot o odanın `users` izin listesinde açıkça yer alıyorsa veya `channels.slack.allowFrom` içindeki en az bir açık Slack sahip kimliği o anda odanın üyesiyse kabul edilir. Joker karakterler ve görünen ad biçimindeki sahip girdileri, sahip bulunma koşulunu karşılamaz. Sahip bulunma denetimi Slack `conversations.members` kullanır; uygulamanın oda türü için uygun okuma kapsamına sahip olduğundan emin olun (genel kanallar için `channels:read`, özel kanallar için `groups:read`). Üye araması başarısız olursa OpenClaw, bot tarafından oluşturulan oda mesajını bırakır.

    Kabul edilen, bot tarafından oluşturulmuş Slack mesajları ortak [bot döngüsü korumasını](/tr/channels/bot-loop-protection) kullanır. Varsayılan bütçe için `channels.defaults.botLoopProtection` yapılandırmasını ayarlayın; ardından bir çalışma alanı veya kanal farklı bir sınır gerektirdiğinde `channels.slack.botLoopProtection` ya da `channels.slack.channels.<id>.botLoopProtection` ile geçersiz kılın.

  </Tab>
</Tabs>

## İş parçacıkları, oturumlar ve yanıt etiketleri

- DM'ler `direct`, kanallar `channel`, MPIM'ler ise `group` olarak yönlendirilir.
- Slack yönlendirme bağlamaları, ham eş kimliklerinin yanı sıra `channel:C12345678`, `user:U12345678` ve `<@U12345678>` gibi Slack hedef biçimlerini kabul eder.
- Varsayılan `session.dmScope=main` ile Slack DM'leri ana ajan oturumunda birleştirilir.
- Kanal oturumları: `agent:<agentId>:slack:channel:<channelId>`.
- Sıradan üst düzey kanal mesajları, `replyToMode` değeri `off` olmasa bile kanal başına oturumda kalır.
- Slack iş parçacığı yanıtları, giden yanıt iş parçacığı oluşturma `replyToMode="off"` ile devre dışı bırakılmış olsa bile oturum son ekleri (`:thread:<threadTs>`) için üst Slack `thread_ts` değerini kullanır.
- OpenClaw, uygun bir üst düzey kanal kökünün görünür bir Slack iş parçacığı başlatması beklendiğinde bu kökü `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` içine yerleştirir; böylece kök ve sonraki iş parçacığı yanıtları tek bir OpenClaw oturumunu paylaşır. Bu, `app_mention` olayları, açık bot veya yapılandırılmış bahsetme kalıbı eşleşmeleri ve `off` olmayan `replyToMode` değerine sahip `requireMention: false` kanalları için geçerlidir.
- `channels.slack.thread.historyScope` varsayılan olarak `thread`; `thread.inheritParent` ise varsayılan olarak `false` değerini kullanır.
- `channels.slack.thread.initialHistoryLimit`, yeni bir iş parçacığı oturumu başladığında mevcut iş parçacığı mesajlarından kaçının getirileceğini denetler (varsayılan `20`; devre dışı bırakmak için `0` olarak ayarlayın).
- `channels.slack.thread.requireExplicitMention` (varsayılan `false`): `true` olduğunda örtük iş parçacığı bahsetmelerini engeller; böylece bot, iş parçacığına daha önce katılmış olsa bile iş parçacıkları içinde yalnızca açık `@bot` bahsetmelerine yanıt verir. Bu ayar olmadan, botun katıldığı bir iş parçacığındaki yanıtlar `requireMention` geçidini atlar.

Yanıt iş parçacığı denetimleri:

- `channels.slack.channels.<id>.replyToMode`: Slack kanal/özel kanal mesajları için kanal başına geçersiz kılma
- `channels.slack.replyToMode`: `off|first|all|batched` (varsayılan `off`)
- `channels.slack.replyToModeByChatType`: `direct|group|channel` başına
- doğrudan sohbetler için eski yedek: `channels.slack.dm.replyToMode`

Manuel yanıt etiketleri desteklenir:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

`message` aracından açık Slack iş parçacığı yanıtları göndermek için `replyBroadcast: true` değerini `action: "send"` ve `threadId` ya da `replyTo` ile ayarlayarak Slack'ten iş parçacığı yanıtını üst kanalda da yayımlamasını isteyin. Bu, Slack'in `chat.postMessage` `reply_broadcast` bayrağına eşlenir ve medya yüklemelerinde değil, yalnızca metin veya Block Kit gönderimlerinde desteklenir.

Bir `message` araç çağrısı bir Slack iş parçacığı içinde çalışıp aynı kanalı hedeflediğinde OpenClaw normalde geçerli hesap, sohbet türü veya kanal başına `replyToMode` ayarına göre mevcut Slack iş parçacığını devralır. Otomatik yanıtlar ve aynı kanaldaki `send` ya da `upload-file` çağrıları aynı kanal başına geçersiz kılmayı kullanır. Bunun yerine yeni bir üst kanal mesajını zorlamak için `action: "send"` veya `action: "upload-file"` üzerinde `topLevel: true` ayarlayın. `threadId: null` da aynı üst düzey vazgeçme seçeneği olarak kabul edilir.

<Note>
`replyToMode="off"`, açık `[[reply_to_*]]` etiketleri dâhil olmak üzere giden Slack yanıtlarında iş parçacığı oluşturmayı devre dışı bırakır. Gelen Slack iş parçacığı oturumlarını düzleştirmez: Slack iş parçacığı içinde zaten gönderilmiş mesajlar yine `:thread:<threadTs>` oturumuna yönlendirilir. Bu, açık etiketlerin `"off"` modunda da geçerli olduğu Telegram'dan farklıdır. Slack iş parçacıkları mesajları kanaldan gizlerken Telegram yanıtları satır içinde görünür kalır.
</Note>

## Onay tepkileri

`ackReaction`, OpenClaw gelen bir mesajı işlerken bir onay emojisi gönderir. `ackReactionScope`, bu emojinin gerçekte _ne zaman_ gönderileceğini belirler.

Varsayılan olarak, Slack'in yerel asistan iş parçacığı durumu dönüşümlü yükleme mesajlarıyla ilerlemeyi gösterirken onay sabit kalır. Bunun yerine sıraya alındı/düşünüyor/araç/tamamlandı/hata tepki yaşam döngüsünü etkinleştirmek için `messages.statusReactions.enabled: true` ayarlayın.

### Emoji (`ackReaction`)

Çözümleme sırası:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- ajan kimliği emojisi yedeği (`agents.list[].identity.emoji`; yoksa `"eyes"` / 👀)

Notlar:

- Slack kısa kodlar bekler (örneğin `"eyes"`).
- Slack hesabı için veya genel olarak tepkiyi devre dışı bırakmak üzere `""` kullanın.

### Kapsam (`messages.ackReactionScope`)

Slack sağlayıcısı kapsamı `messages.ackReactionScope` üzerinden okur (varsayılan `"group-mentions"`). Şu anda Slack hesabı veya Slack kanalı düzeyinde geçersiz kılma yoktur; değer Gateway genelinde geçerlidir.

Değerler:

- `"all"`: ortam oda olayları dâhil olmak üzere DM'lerde ve gruplarda tepki ver.
- `"direct"`: yalnızca DM'lerde tepki ver.
- `"group-all"`: ortam oda olayları hariç her grup mesajına tepki ver (DM yok).
- `"group-mentions"` (varsayılan): gruplarda yalnızca bottan bahsedildiğinde (veya katılımı etkinleştirmiş grup bahsedilebilirlerinde) tepki ver. **DM'ler hariç tutulur.**
- `"off"` / `"none"`: hiçbir zaman tepki verme.

<Note>
Varsayılan kapsam (`"group-mentions"`), doğrudan mesajlarda veya ortam oda olaylarında onay tepkilerini tetiklemez. Yapılandırılmış `ackReaction` değerini (örneğin `"eyes"`) gelen Slack DM'lerinde ve sessiz oda olaylarında görmek için `messages.ackReactionScope` değerini `"all"` olarak ayarlayın. `messages.ackReactionScope`, Slack sağlayıcısı başlatılırken okunur; bu nedenle değişikliğin etkili olması için Gateway'in yeniden başlatılması gerekir.
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // DM'lerde ve gruplarda tepki ver
  },
}
```

## Metin akışı

`channels.slack.streaming`, canlı önizleme davranışını denetler:

- `off`: canlı önizleme akışını devre dışı bırak.
- `partial` (varsayılan): önizleme metnini en son kısmi çıktıyla değiştir.
- `block`: parçalı önizleme güncellemelerini sona ekle.
- `progress`: oluşturma sırasında ilerleme durumu metnini göster, ardından son metni gönder.
- `streaming.preview.toolProgress`: taslak önizleme etkinken araç/ilerleme güncellemelerini aynı düzenlenen önizleme mesajına yönlendir (varsayılan: `true`). Ayrı araç/ilerleme mesajlarını korumak için `false` ayarlayın.
- `streaming.preview.commandText` / `streaming.progress.commandText`: ham komut/yürütme metnini gizlerken kısa araç ilerleme satırlarını korumak için `status` olarak ayarlayın (varsayılan: `raw`).

Kısa ilerleme satırlarını korurken ham komut/yürütme metnini gizleyin:

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

`channels.slack.streaming.nativeTransport`, `channels.slack.streaming.mode` değeri `partial` olduğunda Slack'in yerel metin akışını denetler (varsayılan: `true`).

Slack'in yerel ilerleme görev kartları, ilerleme modu için isteğe bağlıdır. Çalışma sürerken Slack'e özgü bir plan/görev kartı göndermek ve tamamlandığında aynı görev kartını güncellemek için `channels.slack.streaming.progress.nativeTaskCards` değerini `channels.slack.streaming.mode="progress"` ile birlikte `true` olarak ayarlayın. Bu bayrak olmadan ilerleme modu, taşınabilir taslak önizleme davranışını korur.

- Yerel metin akışının ve Slack asistan iş parçacığı durumunun görünmesi için bir yanıt iş parçacığının mevcut olması gerekir. İş parçacığı seçimi yine `replyToMode` ayarını izler.
- Kanal, grup sohbeti ve üst düzey DM kökleri, yerel akış kullanılamadığında veya bir yanıt iş parçacığı bulunmadığında normal taslak önizlemeyi kullanmaya devam edebilir.
- Üst düzey Slack DM'leri varsayılan olarak iş parçacığı dışında kalır; bu nedenle Slack'in iş parçacığı tarzındaki yerel akış/durum önizlemesini göstermez. OpenClaw bunun yerine DM içinde bir taslak önizleme gönderir ve düzenler.
- Medya ve metin dışı yükler normal teslimata geri döner.
- Medya/hata sonuçları bekleyen önizleme düzenlemelerini iptal eder; uygun metin/blok sonuçları yalnızca önizlemeyi yerinde düzenleyebildiklerinde tamamlanır.
- Akış yanıtın ortasında başarısız olursa OpenClaw kalan yükler için normal teslimata geri döner.

Slack'in yerel metin akışı yerine taslak önizleme kullanın:

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

Slack'in yerel ilerleme görev kartlarını etkinleştirin:

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

- `channels.slack.streamMode` (`replace | status_final | append`), `channels.slack.streaming.mode` için eski bir diğer addır.
- Boole `channels.slack.streaming`, `channels.slack.streaming.mode` ve `channels.slack.streaming.nativeTransport` için eski bir diğer addır.
- Üst düzey `channels.slack.chunkMode` ve `channels.slack.nativeStreaming`, `channels.slack.streaming.chunkMode` ve `channels.slack.streaming.nativeTransport` için eski diğer adlardır.
- Eski diğer adlar çalışma zamanında okunmaz; kalıcı Slack akış yapılandırmasını kurallı anahtarlara yeniden yazmak için `openclaw doctor --fix` çalıştırın.

## Yazıyor tepkisi yedeği

`typingReaction`, OpenClaw bir yanıtı işlerken gelen Slack mesajına geçici bir tepki ekler ve çalıştırma tamamlandığında bunu kaldırır. Bu özellik en çok, varsayılan bir "yazıyor..." durum göstergesi kullanan iş parçacığı yanıtlarının dışında yararlıdır.

Çözümleme sırası:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Notlar:

- Slack kısa kodlar bekler (örneğin `"hourglass_flowing_sand"`).
- Tepki en iyi çaba esasına göre uygulanır ve yanıt veya hata yolu tamamlandıktan sonra otomatik olarak temizlenmeye çalışılır.

## Sesli giriş

Bugün Slack'te OpenClaw ile konuşmak için OpenClaw uygulamasına bir Slack ses klibi gönderin. Slackbot'un dikte mikrofonu, uygulama API'si değil, Slack'e ait ayrı bir özelliktir.

- **[Slackbot sesli diktesi](https://slack.com/help/articles/202026038-How-to-use-Slackbot)**, kullanıcının özel Slackbot konuşmasında bulunur. Slack, kaydı bir Slackbot istemine dönüştürür ancak Events API aracılığıyla üçüncü taraf Slack uygulamalarına bir ses dosyası, dikte olayı, istem veya giriş kaynağı işaretçisi göndermez. OpenClaw Slack plugin'i bunu etkinleştiremez veya alamaz.
- **[Slack ses klipleri](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)**, bir OpenClaw DM'sinde, kanalında veya ileti dizisinde yayınlanabilen, Slack'te depolanan dosyalardır. OpenClaw, erişilebilir bir klibi bot belirteciyle indirir, Slack'in klip MIME meta verilerini normalleştirir ve paylaşılan [ses transkripsiyon işlem hattından](/tr/nodes/audio) geçirir. Önerilen uygulama manifesti, gerekli `files:read` kapsamını içerir.

Ses klipleri ile Slackbot diktesinin gizlilik anlamları farklıdır: klipler Slack'in dosya saklama politikasına tabidir ve OpenClaw bunları transkripsiyon için indirir; Slack ise dikte sesinin depolanmadığını belirtir.

`requireMention: true` bulunan bir kanalda, altyazısız bir ses klibi, yapılandırılmış bir bahsetme kalıbının seslendirilmesiyle kapıyı geçebilir (`agents.list[].groupChat.mentionPatterns`, bulunamazsa `messages.groupChat.mentionPatterns` kullanılır). OpenClaw, klibi indirmeden veya yazıya dökmeden önce göndereni yetkilendirir ve ardından yalnızca transkript eşleşirse klibi kabul eder. Başarısız veya eşleşmeyen tahmine dayalı bir transkript, indirilen kliple birlikte atılır; kanal geçmişinde saklanmaz. Yerel Slack `@bot` kimliği konuşmadan çıkarılamaz; bu nedenle seslendirilen ad kalıbı yapılandırın veya yazılı bir bahsetme ekleyin. Transkript yankılama etkinse yankı yalnızca kabulden sonra gönderilir.

## Medya, parçalara ayırma ve teslimat

<AccordionGroup>
  <Accordion title="Gelen ekler">
    Slack dosya ekleri, Slack tarafından barındırılan özel URL'lerden (belirteçle kimliği doğrulanmış istek akışı) indirilir ve getirme işlemi başarılı olduğunda ve boyut sınırları izin verdiğinde medya deposuna yazılır. Dosya yer tutucuları, aracıların özgün dosyayı `download-file` ile alabilmesi için Slack `fileId` değerini içerir.

    İndirmelerde sınırlı boşta kalma ve toplam zaman aşımları kullanılır. Slack dosyasını alma işlemi takılırsa veya başarısız olursa OpenClaw mesajı işlemeye devam eder ve dosya yer tutucusuna geri döner.

    Çalışma zamanı gelen veri boyutu üst sınırı, `channels.slack.mediaMaxMb` tarafından geçersiz kılınmadığı sürece varsayılan olarak `20MB` değeridir.

  </Accordion>

  <Accordion title="Giden metin ve dosyalar">
    - metin parçaları `channels.slack.textChunkLimit` kullanır (varsayılan `8000`, Slack'in kendi mesaj uzunluğu sınırıyla kısıtlanır)
    - `channels.slack.streaming.chunkMode="newline"` önce paragraflara göre bölmeyi etkinleştirir
    - dosya gönderimleri Slack yükleme API'lerini kullanır ve ileti dizisi yanıtlarını (`thread_ts`) içerebilir
    - uzun dosya açıklamaları, Slack açısından güvenli ilk metin parçasını yükleme yorumu olarak kullanır ve kalan parçaları takip mesajları olarak gönderir
    - giden medya üst sınırı, yapılandırıldığında `channels.slack.mediaMaxMb` değerini izler; aksi takdirde kanal gönderimleri medya işlem hattındaki MIME türü varsayılanlarını kullanır

  </Accordion>

  <Accordion title="Teslimat hedefleri">
    Tercih edilen açık hedefler:

    - DM'ler için `user:<id>`
    - kanallar için `channel:<id>`

    Yalnızca metin/blok içeren Slack DM'leri doğrudan kullanıcı kimliklerine gönderilebilir; dosya yüklemeleri ve ileti dizili gönderimler ise bu yollar somut bir konuşma kimliği gerektirdiğinden önce Slack konuşma API'leri aracılığıyla DM'yi açar.

  </Accordion>
</AccordionGroup>

## Komutlar ve eğik çizgi davranışı

Eğik çizgi komutları Slack'te tek bir yapılandırılmış komut veya birden fazla yerel komut olarak görünür. Komut varsayılanlarını değiştirmek için `channels.slack.slashCommand` yapılandırın:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Yerel komutlar, Slack uygulamanızda [ek manifest ayarları](#additional-manifest-settings) gerektirir ve bunun yerine genel yapılandırmalardaki `channels.slack.commands.native: true` veya `commands.native: true` ile etkinleştirilir.

- Yerel komut otomatik modu Slack için **kapalıdır**; dolayısıyla `commands.native: "auto"`, Slack yerel komutlarını etkinleştirmez.

```txt
/help
```

Yerel bağımsız değişken menüleri, öncelik sırasına göre aşağıdakilerden biri olarak oluşturulur:

- yeterince kısa 3-5 seçenek: taşma ("...") menüsü
- 100'den fazla seçenek ve zaman uyumsuz seçenek filtreleme kullanılabilir: harici seçim
- 1-2 seçenek veya kodlanmış değeri bir seçim için fazla uzun olan herhangi bir seçenek: düğme blokları
- diğer durumlarda (6-100 seçenek veya zaman uyumsuz filtreleme olmadan 100'den fazla seçenek): menü başına 100 seçenek olacak şekilde parçalanmış statik seçim menüsü

```txt
/think
```

Eğik çizgi oturumları `agent:<agentId>:slack:slash:<userId>` gibi yalıtılmış anahtarlar kullanır ve komut yürütmelerini yine de `CommandTargetSessionKey` kullanarak hedef konuşma oturumuna yönlendirir.

## Yerel grafikler

Slack'in herkese açık [`data_visualization` Block Kit bloğu](https://docs.slack.dev/reference/block-kit/blocks/data-visualization-block/)
mesajlarda çizgi, çubuk, alan ve pasta grafiklerini oluşturur. OpenClaw, taşınabilir
`presentation` `chart` bloğunu bu yerel biçime eşler; normal
`chat:write` mesaj erişiminin ötesinde ek OAuth kapsamı,
dosya yüklemesi, görüntü oluşturucu veya Slack yapılandırması gerekmez.

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "bar",
      "title": "Üç aylık gelir",
      "categories": ["1. Çeyrek", "2. Çeyrek"],
      "series": [{ "name": "Gelir", "values": [120, 145] }],
      "xLabel": "Çeyrek"
    }
  ]
}
```

Slack'in sınırları yerel oluşturmadan önce uygulanır:

- başlık ve isteğe bağlı eksen etiketleri: 50 karakter
- pasta: 1-12 pozitif dilim
- çizgi/çubuk/alan: benzersiz adlandırılmış 1-12 seri ve 1-20 paylaşılan kategori
- dilim, kategori ve seri etiketleri: 20 karakter
- her seri, her kategori için bir sonlu değer içermelidir; pasta dışı değerler
  negatif olabilir

Her yerel grafik ayrıca ekran okuyucular, bildirimler, oturum yansıtma ve bloğu
oluşturamayan istemciler için üst düzey bir metin gösterimi taşır. Diğer OpenClaw
kanallarına yapılan standart sunum gönderimleri, yerel grafik desteği bildirmedikleri
sürece aynı belirlenimci grafik verilerini metin olarak alır. Slack aşamalı dağıtım
sırasında grafiği `invalid_blocks` ile reddederse OpenClaw, reddedilen yerel veri
bloklarını kaldırır, varsa eş düzey denetimleri korur ve eksiksiz grafik gösterimini
görünür metin olarak gönderir.

Slack şu anda mesaj başına en fazla iki `data_visualization` bloğunu kabul eder. Bir
sunum ikiden fazla geçerli grafik içerdiğinde OpenClaw bunların sırasını korur ve
her mesajda en fazla iki grafik olacak şekilde takip mesajlarında yerel oluşturmayı
sürdürür.

Slack'in [geliştirici lansmanı](https://docs.slack.dev/changelog/2026/06/16/block-kit-data-visualization-block/)
bloğu uygulamalara yönelik bir Block Kit özelliği olarak belgeler ve ücretli
plan kısıtlaması yayınlamaz. Business+/Enterprise uygunluk ifadesi, uygulamanın
önceden yapılandırılmış bir Block Kit grafiği göndermesinden ayrı olan Slackbot'ın
otomatik yapay zekâ grafik oluşturma özelliği için geçerlidir. Grafikler yalnızca
mesaj bloklarıdır; App Home, modal veya Canvas içeriği değildir.

## Yerel tablolar

Slack'in mevcut [`data_table` Block Kit bloğu](https://docs.slack.dev/reference/block-kit/blocks/data-table-block/)
mesajlarda yapılandırılmış satır ve sütunları oluşturur. OpenClaw, açık bir
taşınabilir `presentation` `table` bloğunu `data_table` ile eşler; Slack'in
eski [`table` bloğunu](https://docs.slack.dev/reference/block-kit/blocks/table-block/) kullanmaz.
Normal `chat:write` mesaj erişiminin ötesinde ek OAuth kapsamı veya Slack
yapılandırması gerekmez.

```json
{
  "blocks": [
    {
      "type": "table",
      "caption": "Açık işlem hattı",
      "headers": ["Hesap", "Aşama", "ARR"],
      "rows": [
        ["Acme", "Kazanıldı", 125000],
        ["Globex", "İnceleme", 82000]
      ],
      "rowHeaderColumnIndex": 0
    }
  ]
}
```

OpenClaw, başlık ve dize hücrelerini Slack `raw_text` hücrelerine eşler. Sayısal hücreler,
yerel sıralama ve filtreleme için sonlu sayısal değer korunarak `raw_number` ile eşlenir.
`rowHeaderColumnIndex`, mevcut olduğunda sıfır tabanlı bu sütunu Slack satır
başlıkları olarak işaretler.

Slack'in yayınlanmış `data_table` sınırları yerel oluşturmadan önce uygulanır:

- 1-20 sütun
- başlık satırına ek olarak 1-100 veri satırı
- her satırda aynı sayıda hücre
- tek bir mesajdaki tüm tablo hücrelerinde toplam en fazla 10.000 karakter

Mesaj toplam karakter sınırı içinde kaldığı sürece birden fazla geçerli tablo
bloğu yerel olarak oluşturulabilir. Yerel kapsam içinde oluşturulamayan bir tablo,
satır veya hücre kaybetmek yerine eksiksiz belirlenimci metne dönüşür. Bu metin
tek bir Slack mesajını aşarsa gönderimler ve eğik çizgi yanıtları sıralı metin
parçaları kullanır. Tablo düzenlemeleri, mevcut bir mesajdaki satırları sessizce
kırpmak yerine açık bir boyut hatasıyla başarısız olur.

Taşınabilir sunumdan üretilen her yerel tablo ayrıca ekran okuyucular, bildirimler,
oturum yansıtma ve bloğu oluşturamayan istemciler için üst düzey bir metin gösterimi
taşır. Ham grafik ve tablo değerleri geri dönüş gösteriminde değişmez kalır; böylece
`<@U123>` gibi hücre verileri Slack bahsetmesine dönüşmez.
Slack, yerel grafik veya tablo bloklarını `invalid_blocks` ile reddederse OpenClaw,
tüm yerel veri bloklarını tek bir sınırlı kurtarma adımında kaldırır, düğmeler ve
seçimler gibi geçerli eş düzey blokları korur ve Slack biçimlendirmesi devre dışı
bırakılmış olarak eksiksiz görünür grafik ve tablo metni gönderir. Eğik çizgi
komutu teslimatı, komut genelinde Slack'in beş çağrılık `response_url` bütçesini
izler. Her yanıt grubundan önce kalan çağrılara uyan eksiksiz bir plan seçer veya
bu grubu göndermeden önce başarısız olur.

Yalnızca açık `presentation` tablo blokları yerel tablolara yükseltilir.
Markdown dikey çizgi tabloları yazıldıkları biçimde metin olarak kalır; OpenClaw
tablo yapısını veya hücre türlerini tahmin etmez. Mevcut güvenilir Slack'e özgü
üreticiler ham blokları `channelData.slack.blocks` üzerinden geçirmeye devam edebilir;
OpenClaw geçerli ham `data_table` hücrelerinden geri dönüş metni türetirken
hatalı biçimlendirilmiş özel bloklar açıklamalarına veya genel Block Kit geri dönüşüne
indirgenebilir. Taşınabilir aracı, CLI ve plugin çıktısı `presentation` kullanmalıdır.

## Etkileşimli yanıtlar

Slack, aracılar tarafından oluşturulan etkileşimli yanıt denetimlerini görüntüleyebilir ancak bu özellik varsayılan olarak devre dışıdır.
Yeni aracı, CLI ve plugin çıktısı için paylaşılan
`presentation` düğmelerini veya seçim bloklarını tercih edin. Bunlar aynı Slack
etkileşim yolunu kullanır ve diğer kanallarda da daha basit bir gösterime indirgenir.

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

Etkinleştirildiğinde aracılar kullanımdan kaldırılmış, yalnızca Slack'e özgü yanıt yönergelerini yine de gönderebilir:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Bu yönergeler Slack Block Kit'e derlenir ve tıklamaları veya seçimleri mevcut Slack
etkileşim olayı yolu üzerinden geri yönlendirir. Bunları eski istemler ve Slack'e
özgü kaçış yolları için koruyun; yeni taşınabilir denetimler için paylaşılan sunumu
kullanın.

Yönerge derleyici API'leri de yeni üretici kodu için kullanımdan kaldırılmıştır:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

Slack'te oluşturulan yeni denetimler için `presentation` yüklerini ve
`buildSlackPresentationBlocks(...)` kullanın.

Notlar:

- Bu, Slack'e özgü eski kullanıcı arayüzüdür. Diğer kanallar Slack Block
  Kit direktiflerini kendi düğme sistemlerine dönüştürmez.
- Etkileşimli geri çağırma değerleri, ham aracı tarafından oluşturulan değerler değil, OpenClaw tarafından oluşturulan opak belirteçlerdir.
- Oluşturulan etkileşimli bloklar Slack Block Kit sınırlarını aşacaksa OpenClaw, geçersiz bir blok yükü göndermek yerine özgün metin yanıtına geri döner.

### Plugin tarafından yönetilen modal gönderimleri

Etkileşimli bir işleyici kaydeden Slack pluginleri, OpenClaw yükü aracıya
gösterilen sistem olayı için sıkıştırmadan önce modal `view_submission` ve
`view_closed` yaşam döngüsü olaylarını da alabilir. Bir Slack modalı
açarken şu yönlendirme kalıplarından birini kullanın:

- `callback_id` değerini `openclaw:<namespace>:<payload>` olarak ayarlayın.
- Ya da mevcut bir `callback_id` değerini koruyun ve `pluginInteractiveData:
"<namespace>:<payload>"` değerini modalın `private_metadata` alanına koyun.

İşleyici, `ctx.interaction.kind` değerini `view_submission` veya
`view_closed` olarak, normalleştirilmiş `inputs` değerini ve Slack'ten
gelen tam ham `stateValues` nesnesini alır. Yalnızca geri çağırma kimliğine dayalı
yönlendirme, plugin işleyicisini çağırmak için yeterlidir; modalın aracıya gösterilen
bir sistem olayı da üretmesi gerekiyorsa mevcut modal `private_metadata`
kullanıcı/oturum yönlendirme alanlarını ekleyin. Aracı, sıkıştırılmış ve hassas
bilgileri çıkarılmış bir `Slack interaction: ...` sistem olayı alır. İşleyici
`systemEvent.summary`, `systemEvent.reference` veya `systemEvent.data` döndürürse
bu alanlar, aracının form yükünün tamamını görmeden plugin tarafından yönetilen
depolamaya başvurabilmesi için sıkıştırılmış olaya eklenir.

## Slack'te yerel onaylar

Slack, Web kullanıcı arayüzüne veya terminale geri dönmek yerine etkileşimli düğmeler ve etkileşimlerle yerel bir onay istemcisi olarak işlev görebilir.

- Çalıştırma ve plugin onayları, Slack'e özgü Block Kit istemleri olarak görüntülenebilir.
- `channels.slack.execApprovals.*`, yerel çalıştırma onayı istemcisini etkinleştirme ve DM/kanal yönlendirme yapılandırması olmaya devam eder.
- Çalıştırma onayı DM'leri `channels.slack.execApprovals.approvers` veya `commands.ownerAllowFrom` kullanır.
- Slack, kaynak oturum için yerel onay istemcisi olarak etkinleştirildiğinde veya `approvals.plugin` kaynak Slack oturumuna ya da bir Slack hedefine yönlendirildiğinde plugin onayları Slack'e özgü düğmeleri kullanır.
- Plugin onayı DM'leri; `channels.slack.allowFrom` içindeki Slack plugin onaylayıcılarını, adlandırılmış hesaba ait `allowFrom` değerini veya hesabın varsayılan rotasını kullanır.
- Onaylayıcı yetkilendirmesi yine uygulanır: yalnızca çalıştırma onaylayıcıları, aynı zamanda plugin onaylayıcısı olmadıkça plugin isteklerini onaylayamaz.

Bu, diğer kanallarla aynı paylaşılan onay düğmesi yüzeyini kullanır. Slack uygulama ayarlarınızda `interactivity` etkinleştirildiğinde onay istemleri doğrudan konuşmada Block Kit düğmeleri olarak görüntülenir.
Bu düğmeler mevcut olduğunda birincil onay kullanıcı deneyimini oluştururlar; OpenClaw
yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya tek yolun manuel onay
olduğunu belirttiğinde manuel bir `/approve` komutu eklemelidir.

Yapılandırma yolu:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (isteğe bağlıdır; mümkün olduğunda `commands.ownerAllowFrom` değerine geri döner)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
- `agentFilter`, `sessionFilter`

`enabled` ayarlanmamışsa veya `"auto"` ise ve en az bir
çalıştırma onaylayıcısı çözümleniyorsa Slack, yerel çalıştırma onaylarını otomatik olarak etkinleştirir.
Slack plugin onaylayıcıları çözümlendiğinde ve istek yerel istemci filtreleriyle eşleştiğinde Slack,
bu yerel istemci yolu üzerinden yerel plugin onaylarını da işleyebilir. Slack'i yerel onay istemcisi
olarak açıkça devre dışı bırakmak için `enabled: false` değerini ayarlayın. Onaylayıcılar
çözümlendiğinde yerel onayları zorla etkinleştirmek için `enabled: true` değerini ayarlayın.
Slack çalıştırma onaylarını devre dışı bırakmak, `approvals.plugin` üzerinden etkinleştirilen yerel
Slack plugin onayı teslimini devre dışı bırakmaz; plugin onayı teslimi bunun yerine Slack plugin
onaylayıcılarını kullanır.

Açık bir Slack çalıştırma onayı yapılandırması olmadığındaki varsayılan davranış:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Açık Slack'e özgü yapılandırma yalnızca onaylayıcıları geçersiz kılmak, filtre eklemek veya
kaynak sohbete teslimi etkinleştirmek istediğinizde gereklidir:

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

Paylaşılan `approvals.exec` iletimi ayrıdır. Yalnızca çalıştırma onayı istemlerinin başka
sohbetlere veya açık bant dışı hedeflere de yönlendirilmesi gerektiğinde kullanın. Paylaşılan
`approvals.plugin` iletimi de ayrıdır; Slack'e özgü teslim, bu geri dönüşü yalnızca Slack plugin
onayı isteğini yerel olarak işleyebildiğinde engeller.

Aynı sohbette `/approve`, komutları zaten destekleyen Slack kanallarında ve DM'lerde de çalışır. Tam onay iletimi modeli için [Çalıştırma onayları](/tr/tools/exec-approvals) bölümüne bakın.

## Olaylar ve işletim davranışı

- İleti düzenlemeleri/silmeleri sistem olaylarına eşlenir.
- İleti dizisi yayınları ("Also send to channel" ileti dizisi yanıtları) normal kullanıcı iletileri olarak işlenir.
- Tepki ekleme/kaldırma olayları sistem olaylarına eşlenir.
- Üye katılma/ayrılma, kanal oluşturma/yeniden adlandırma ve sabitleme ekleme/kaldırma olayları sistem olaylarına eşlenir.
- İsteğe bağlı iletişim durumu yoklaması, gözlemlenen bir insan katılımcının `away` durumundan `active` durumuna geçişini katılımcının en son etkin olan uygun Slack oturumuna eşleyebilir. Varsayılan olarak kapalıdır.
- `configWrites` etkinleştirildiğinde `channel_id_changed` kanal yapılandırma anahtarlarını taşıyabilir.
- Kanal konusu/amacı meta verileri güvenilmeyen bağlam olarak değerlendirilir ve yönlendirme bağlamına eklenebilir.
- İleti dizisi başlatıcısı ve ilk ileti dizisi geçmişi bağlamını başlangıçta doldurma işlemleri, uygulanabildiğinde yapılandırılmış gönderici izin listelerine göre filtrelenir.
- Blok eylemleri, kısayollar ve modal etkileşimleri, zengin yük alanlarına sahip yapılandırılmış `Slack interaction: ...` sistem olayları yayınlar:
  - blok eylemleri: seçilen değerler, etiketler, seçici değerleri ve `workflow_*` meta verileri
  - genel kısayollar: geri çağırma ve aktör meta verileri; aktörün doğrudan oturumuna yönlendirilir
  - ileti kısayolları: geri çağırma, aktör, kanal, ileti dizisi ve seçilen ileti bağlamı
  - yönlendirilmiş kanal meta verileri ve form girdileri içeren modal `view_submission` ve `view_closed` olayları

Slack uygulama yapılandırmanızda genel veya ileti kısayolları tanımlayın ve boş olmayan herhangi bir geri çağırma kimliği kullanın. OpenClaw eşleşen kısayol yüklerini onaylar, diğer Slack etkileşimleriyle aynı DM/kanal gönderici politikasını uygular ve temizlenmiş olayı yönlendirilen aracı oturumu için kuyruğa alır. Tetikleyici kimlikleri ve yanıt URL'leri aracı bağlamından çıkarılır.

### İletişim durumu olayları

Slack, iletişim durumu değişikliklerini Events API veya Socket Mode üzerinden göndermez. OpenClaw bunun yerine, iletileri normal Slack erişim ve yönlendirme denetimlerinden geçen insan katılımcılar için [`users.getPresence`](https://docs.slack.dev/reference/methods/users.getPresence/) yoklaması yapabilir.

```json5
{
  channels: {
    slack: {
      presenceEvents: { mode: "auto" },
      channels: {
        C0123456789: { presenceEvents: { mode: "on" } },
        C0987654321: { presenceEvents: { mode: "off" } },
      },
    },
  },
}
```

- `off` (varsayılan): iletişim durumu zamanlayıcısı veya Slack API çağrısı yoktur.
- `auto`: son 24 saat içinde etkin olan ve en fazla 8 gözlemlenen insan katılımcıya sahip DM'leri, MPIM'leri ve Slack ileti dizilerini izler. Üst düzey kanal oturumları hariç tutulur.
- `on`: aynı konuşmaları katılımcı sınırı olmadan izler ve üst düzey kanal oturumlarını dahil eder. Bir kanalı zorla dahil etmek veya hariç tutmak için kanal başına geçersiz kılma kullanın.

OpenClaw, Slack hesabı başına dakikada en fazla 45 benzersiz kullanıcıyı yoklar, aracıyı uyandırmadan ilk sonucu başlangıç değeri olarak kullanır ve yalnızca gözlemlenen bir `away` durumundan `active` durumuna geçişte uyandırır. İlgili kişi birden fazla ileti dizisine katılsa bile Slack hesabı ve kullanıcı başına kalıcı bir 8 saatlik bekleme süresi uygulanır. Olay yalnızca o kişinin en son etkin uygun konuşmasına yönlendirilir ve aracıya kısa bir selamlama gönderip göndermemeye karar vermeden önce belleğe/wiki'ye ve bilinen saat dilimi bağlamına başvurmasını söyler. Aracı sessiz kalabilir.

Bot belirteci, önerilen manifestte zaten bulunan `users:read` iznine ihtiyaç duyar. İletişim durumu olayları Enterprise Grid kuruluş genelindeki kurulumlarda kullanılamaz.

## Yapılandırma referansı

Birincil referans: [Yapılandırma referansı - Slack](/tr/gateway/config-channels#slack).

<Accordion title="Önemli Slack alanları">

- mod/kimlik doğrulama: `mode`, `enterpriseOrgInstall`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM erişimi: `dm.enabled`, `dmPolicy`, `allowFrom` (eski: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- uyumluluk geçişi: `dangerouslyAllowNameMatching` (acil durum; gerekmedikçe kapalı tutun)
- kanal erişimi: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- ileti dizileri/geçmiş: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- iletişim durumuyla uyandırmalar: `presenceEvents.mode`, `channels.*.presenceEvents.mode` (`off|auto|on`; varsayılan `off`)
- teslim: `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- önizlemeler: `unfurlLinks` (varsayılan: `false`), `chat.postMessage` bağlantı/medya önizleme denetimi için `unfurlMedia`; bağlantı önizlemelerini yeniden etkinleştirmek için `unfurlLinks: true` değerini ayarlayın
- işletim/özellikler: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Sorun giderme

<AccordionGroup>
  <Accordion title="Kanallarda yanıt yok">
    Sırayla kontrol edin:

    - `groupPolicy`
    - kanal izin listesi (`channels.slack.channels`) — **anahtarlar kanal kimlikleri olmalıdır** (`C12345678`), adlar (`#channel-name`) değil. Kanal yönlendirmesi varsayılan olarak kimlik öncelikli olduğundan ad tabanlı anahtarlar `groupPolicy: "allowlist"` altında sessizce başarısız olur. Kimliği bulmak için: Slack'te kanala sağ tıklayın → **Copy link** — URL'nin sonundaki `C...` değeri kanal kimliğidir.
    - `requireMention`
    - kanal başına `users` izin listesi
    - `messages.groupChat.visibleReplies`: normal grup/kanal istekleri varsayılan olarak `"automatic"` değerini kullanır. `"message_tool"` seçeneğini etkinleştirdiyseniz ve günlükler `message(action=send)` çağrısı olmadan yardımcı metni gösteriyorsa model, görünür ileti aracı yolunu kaçırmıştır. Bu modda nihai metin gizli kalır; engellenen yük meta verileri için Gateway ayrıntılı günlüğünü inceleyin veya her normal yardımcı nihai yanıtının eski yol üzerinden gönderilmesini istiyorsanız değeri `"automatic"` olarak ayarlayın.
    - `messages.groupChat.unmentionedInbound`: `"room_event"` ise, izin verilen kanaldaki bahsedilmemiş konuşmalar ortam bağlamıdır ve aracı `message` aracını çağırmadıkça sessiz kalır. [Ortam odası olayları](/tr/channels/ambient-room-events) bölümüne bakın.

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

  <Accordion title="DM iletileri yok sayılıyor">
    Şunları kontrol edin:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (veya eski `channels.slack.dm.policy`)
    - eşleştirme onayları / izin listesi girdileri (`dmPolicy: "open"` hâlâ `channels.slack.allowFrom: ["*"]` gerektirir)
    - grup DM'leri MPIM işlemeyi kullanır; `channels.slack.dm.groupEnabled` seçeneğini etkinleştirin ve yapılandırılmışsa MPIM'i `channels.slack.dm.groupChannels` içine ekleyin
    - Slack Assistant DM olayları: `drop message_changed` ifadesinden bahseden ayrıntılı günlükler
      genellikle Slack'in ileti meta verilerinde kurtarılabilir bir insan göndereni
      bulunmayan, düzenlenmiş bir Assistant dizisi olayı gönderdiği anlamına gelir

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket modu bağlanmıyor">
    Slack uygulama ayarlarında bot ve uygulama token'larını ve Socket Mode'un etkinleştirildiğini doğrulayın.
    App-Level Token için `connections:write` gerekir ve Bot User OAuth Token
    bot token'ı, uygulama token'ıyla aynı Slack uygulamasına/çalışma alanına ait olmalıdır.

    `openclaw channels status --probe --json`, `botTokenStatus` veya
    `appTokenStatus: "configured_unavailable"` gösteriyorsa Slack hesabı
    yapılandırılmıştır ancak mevcut çalışma zamanı SecretRef destekli
    değeri çözümleyememiştir.

    `slack socket mode failed to start; retry ...` gibi günlükler kurtarılabilir
    başlatma hatalarıdır. Eksik kapsamlar, iptal edilmiş token'lar ve geçersiz kimlik doğrulama ise
    hemen başarısız olur. Bir `slack token mismatch ...` günlüğü, bot token'ı ile uygulama token'ının
    farklı Slack uygulamalarına ait göründüğü anlamına gelir; Slack uygulaması kimlik bilgilerini düzeltin.

  </Accordion>

  <Accordion title="HTTP modu olayları almıyor">
    Şunları doğrulayın:

    - imzalama sırrı
    - Webhook yolu
    - Slack Request URL'leri (Events + Interactivity + Slash Commands)
    - HTTP hesabı başına benzersiz `webhookPath`
    - genel URL'nin TLS'yi sonlandırdığı ve istekleri Gateway yoluna ilettiği
    - Slack uygulamasının `request_url` yolunun `channels.slack.webhookPath` ile tam olarak eşleştiği (varsayılan `/slack/events`)

    Hesap anlık görüntülerinde `signingSecretStatus: "configured_unavailable"` görünüyorsa
    HTTP hesabı yapılandırılmıştır ancak mevcut çalışma zamanı
    SecretRef destekli imzalama sırrını çözümleyememiştir.

    Tekrarlanan bir `slack: webhook path ... already registered` günlüğü, iki HTTP
    hesabının aynı `webhookPath` değerini kullandığı anlamına gelir; her hesaba farklı bir yol verin.

  </Accordion>

  <Accordion title="Yerel/eğik çizgi komutları çalışmıyor">
    Şunlardan hangisini amaçladığınızı doğrulayın:

    - Slack'te kayıtlı eşleşen eğik çizgi komutlarıyla yerel komut modu (`channels.slack.commands.native: true`)
    - veya tek eğik çizgi komutu modu (`channels.slack.slashCommand.enabled: true`)

    Slack, eğik çizgi komutlarını otomatik olarak oluşturmaz veya kaldırmaz. `commands.native: "auto"`, Slack yerel komutlarını etkinleştirmez; `true` kullanın ve Slack uygulamasında eşleşen komutları oluşturun. HTTP modunda her Slack eğik çizgi komutu Gateway URL'sini içermelidir. Socket Mode'da komut yükleri websocket üzerinden gelir ve Slack, `slash_commands[].url` değerini yok sayar.

    Ayrıca `commands.useAccessGroups`, DM yetkilendirmesini, kanal izin listelerini
    ve kanal başına `users` izin listelerini denetleyin. Slack, engellenen
    eğik çizgi komutu gönderenleri için şu geçici hataları döndürür:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## Ek medya referansı

Slack dosya indirmeleri başarılı olduğunda ve boyut sınırları izin verdiğinde Slack, indirilen medyayı ajan dönüşüne ekleyebilir. Ses kliplerinin metni yazıya dökülebilir, görüntü dosyaları medya anlama yolundan geçebilir veya doğrudan görsel destekli bir yanıt modeline iletilebilir ve diğer dosyalar indirilebilir dosya bağlamı olarak kullanılabilir kalır.

### Desteklenen medya türleri

| Medya türü                     | Kaynak               | Mevcut davranış                                                                  | Notlar                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Slack ses klipleri              | Slack dosya URL'si       | İndirilir ve paylaşılan ses transkripsiyonu üzerinden yönlendirilir                          | `files:read` ve çalışan bir `tools.media.audio` modeli veya CLI gerektirir      |
| JPEG / PNG / GIF / WebP görüntüleri | Slack dosya URL'si       | İndirilir ve görsel destekli işleme için dönüşe eklenir                   | Dosya başına sınır: `channels.slack.mediaMaxMb` (varsayılan 20 MB)                 |
| PDF dosyaları                      | Slack dosya URL'si       | İndirilir ve `download-file` veya `pdf` gibi araçlar için dosya bağlamı olarak sunulur | Slack gelen verileri PDF'leri otomatik olarak görüntüsel girişe dönüştürmez |
| Diğer dosyalar                    | Slack dosya URL'si       | Mümkün olduğunda indirilir ve dosya bağlamı olarak sunulur                              | İkili dosyalar görüntü girdisi olarak değerlendirilmez                               |
| Dizi yanıtları                 | Dizi başlangıcı dosyaları | Yanıtta doğrudan medya bulunmadığında kök ileti dosyaları bağlam olarak yüklenebilir  | Yalnızca dosya içeren başlangıçlarda ek yer tutucusu kullanılır                          |
| Çok dosyalı iletiler            | Birden fazla Slack dosyası | Her dosya bağımsız olarak değerlendirilir                                              | Slack işlemesi ileti başına sekiz dosyayla sınırlıdır                     |

### Gelen veri işlem hattı

Dosya ekleri içeren bir Slack iletisi geldiğinde:

1. OpenClaw, bot token'ını kullanarak dosyayı Slack'in özel URL'sinden indirir.
2. Başarılı olduğunda dosya medya deposuna yazılır.
3. İndirilen medya yolları ve içerik türleri gelen bağlama eklenir.
4. Ses klipleri paylaşılan transkripsiyon işlem hattına yönlendirilir; görüntü destekli model/araç yolları aynı bağlamdaki görüntü eklerini kullanabilir.
5. Diğer dosyalar, bunları işleyebilen araçlar için dosya meta verileri veya medya referansları olarak kullanılabilir kalır.

### Dizi kökü eklerinin devralınması

Bir ileti bir diziye geldiğinde (`thread_ts` üst öğesi olduğunda):

- Yanıtın kendisinde doğrudan medya yoksa ve dahil edilen kök iletide dosyalar varsa Slack, kök dosyaları dizi başlangıcı bağlamı olarak yükleyebilir.
- Kök dosyalar yalnızca yeni veya sıfırlanmış bir dizi oturumu başlatılırken yüklenir. Daha sonraki yalnızca metin içeren yanıtlar mevcut oturum bağlamını yeniden kullanır ve kök dosyaları yeni medya olarak yeniden eklemez.
- Doğrudan yanıt ekleri, kök ileti eklerine göre önceliklidir.
- Yalnızca dosyaları olan ve metni olmayan bir kök ileti, yedek yolun dosyalarını yine de içerebilmesi için bir ek yer tutucusuyla temsil edilir.

### Birden fazla eki işleme

Tek bir Slack iletisi birden fazla dosya eki içerdiğinde:

- Her ek, medya işlem hattında bağımsız olarak işlenir.
- İndirilen medya referansları ileti bağlamında birleştirilir.
- İşleme sırası, olay yükündeki Slack dosya sırasını izler.
- Bir ekin indirilmesindeki hata diğerlerini engellemez.

### Boyut, indirme ve model sınırları

- **Boyut sınırı**: Dosya başına varsayılan 20 MB. `channels.slack.mediaMaxMb` üzerinden yapılandırılabilir.
- **Ses transkripsiyonu sınırı**: İndirilen dosya bir transkripsiyon sağlayıcısına veya CLI'ye gönderildiğinde `tools.media.audio.maxBytes` de geçerlidir.
- **İndirme hataları**: Slack'in sunamadığı dosyalar, süresi dolmuş URL'ler, erişilemeyen dosyalar, boyut sınırını aşan dosyalar ve Slack kimlik doğrulama/oturum açma HTML yanıtları, desteklenmeyen biçimler olarak bildirilmek yerine atlanır.
- **Görsel modeli**: Görüntü analizi, görseli desteklediğinde etkin yanıt modelini veya `agents.defaults.imageModel` konumunda yapılandırılan görüntü modelini kullanır.

### Bilinen sınırlar

| Senaryo                                      | Mevcut davranış                                                                   | Geçici çözüm                                                                    |
| --------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Süresi dolmuş Slack dosya URL'si                        | Dosya atlanır; hata gösterilmez                                                       | Dosyayı Slack'e yeniden yükleyin                                                   |
| Ses transkripsiyonu kullanılamıyor               | Klip ekli kalır ancak transkript oluşturulmaz                                | `tools.media.audio` yapılandırın veya desteklenen bir yerel transkripsiyon CLI'si kurun  |
| Altyazısız klip bahsetme geçidini aşmıyor | Özel spekülatif transkripsiyondan sonra bırakılır; transkript ve indirme silinir | Sesli ad bahsetme kalıbı yapılandırın, yazılı bir bot bahsetmesi ekleyin veya DM kullanın |
| Görsel modeli yapılandırılmamış                   | Görüntü ekleri medya referansı olarak saklanır ancak görüntü olarak analiz edilmez       | `agents.defaults.imageModel` yapılandırın veya görsel destekli bir yanıt modeli kullanın    |
| Çok büyük görüntüler (varsayılan olarak > 20 MB)        | Boyut sınırı uyarınca atlanır                                                               | Slack izin veriyorsa `channels.slack.mediaMaxMb` değerini artırın                          |
| İletilen/paylaşılan ekler                  | Metin ve Slack tarafından barındırılan görüntü/dosya medyası en iyi çaba yaklaşımıyla işlenir                             | Doğrudan OpenClaw dizisinde yeniden paylaşın                                      |
| PDF ekleri                               | Dosya/medya bağlamı olarak saklanır, görüntüsel işleme üzerinden otomatik yönlendirilmez        | Dosya meta verileri için `download-file` veya PDF analizi için `pdf` aracını kullanın      |

### İlgili belgeler

- [Medya anlama işlem hattı](/tr/nodes/media-understanding)
- [Ses ve sesli notlar](/tr/nodes/audio)
- [PDF aracı](/tr/tools/pdf)

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
    Yapılandırma düzeni ve önceliği.
  </Card>
  <Card title="Eğik çizgi komutları" icon="terminal" href="/tr/tools/slash-commands">
    Komut kataloğu ve davranışı.
  </Card>
</CardGroup>
