---
read_when:
    - OpenClaw'ı LINE'a bağlamak istiyorsunuz
    - LINE Webhook + kimlik bilgileri kurulumuna ihtiyacınız var
    - LINE'a özgü mesaj seçenekleri istiyorsunuz
summary: LINE Messaging API Plugin kurulumu, yapılandırması ve kullanımı
title: LINE
x-i18n:
    generated_at: "2026-06-28T20:43:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d54b6740c3403d8fb2e815d969d891973d88c2e2ff43e9de7642c1c81d36e090
    source_path: hi/channels/line.md
    workflow: 16
---

LINE, LINE Messaging API aracılığıyla OpenClaw'a bağlanır. Plugin, Gateway üzerinde Webhook
alıcısı olarak çalışır ve kimlik doğrulama için channel access token + channel secret bilgilerinizi
kullanır.

Durum: İndirilebilir Plugin. direct messages, group chats, media, locations, Flex
messages, template messages ve quick replies desteklenir. Reactions ve threads
desteklenmez.

## Kurulum

channel yapılandırmadan önce LINE'ı kurun:

```bash
openclaw plugins install @openclaw/line
```

Yerel checkout (git repo'dan çalıştırırken):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Ayar

1. Bir LINE Developers account oluşturun ve Console'u açın:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Bir Provider oluşturun (veya seçin) ve **Messaging API** channel ekleyin.
3. channel settings içinden **Channel access token** ve **Channel secret** değerlerini kopyalayın.
4. Messaging API settings içinde **Use webhook** seçeneğini etkinleştirin.
5. Webhook URL'yi Gateway endpoint'inize ayarlayın (HTTPS gereklidir):

```
https://gateway-host/line/webhook
```

Gateway, LINE'ın Webhook verification (GET) isteğine yanıt verir ve signature ile payload validation sonrasında signed
inbound events (POST) isteklerini hemen kabul eder; agent
processing asenkron olarak devam eder.
Custom path gerekiyorsa `channels.line.webhookPath` veya
`channels.line.accounts.<id>.webhookPath` ayarlayın ve URL'yi buna göre güncelleyin.

Güvenlik notu:

- LINE signature verification body-dependent'tır (raw body üzerinde HMAC), bu yüzden OpenClaw verification öncesinde strict pre-auth body limits ve timeout uygular.
- OpenClaw, Webhook events'i verified raw request bytes üzerinden işler. signature-integrity güvenliği için upstream middleware tarafından dönüştürülmüş `req.body` values yok sayılır.

## Yapılandırma

Minimum config:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

Public DM config:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "open",
      allowFrom: ["*"],
    },
  },
}
```

Env vars (yalnızca default account):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Token/secret files:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` ve `secretFile`, regular files öğelerine işaret etmelidir. Symlinks reddedilir.

Birden çok accounts:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## Erişim denetimi

Direct messages varsayılan olarak pairing modundadır. Bilinmeyen senders bir pairing code alır ve onların
messages öğeleri onaylanana kadar yok sayılır.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlists ve policies:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: DM'ler için allowlisted LINE user IDs; `dmPolicy: "open"` için `["*"]` gereklidir
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: groups için allowlisted LINE user IDs
- Per-group overrides: `channels.line.groups.<groupId>.allowFrom`
- Static sender access groups, `allowFrom`, `groupAllowFrom` ve per-group `allowFrom` içinden `accessGroup:<name>` ile reference edilebilir.
- Runtime note: `channels.line` tamamen missing ise runtime, group checks için `groupPolicy="allowlist"` değerine fallback eder (`channels.defaults.groupPolicy` ayarlı olsa bile).

LINE IDs büyük/küçük harfe duyarlıdır. Valid IDs şöyle görünür:

- User: `U` + 32 hex chars
- Group: `C` + 32 hex chars
- Room: `R` + 32 hex chars

## Message behavior

- Text, 5000 characters sınırında chunks halinde bölünür.
- Markdown formatting kaldırılır; code blocks ve tables mümkün olduğunda Flex
  cards biçimine dönüştürülür.
- Streaming responses buffered olur; agent çalışırken LINE, loading
  animation ile tam chunks alır.
- Media downloads `channels.line.mediaMaxMb` (default 10) ile capped edilir.
- Inbound media, agent'a geçirilmeden önce `~/.openclaw/media/inbound/` altında save edilir;
  bu, diğer bundled channel
  plugins tarafından kullanılan shared media store ile eşleşir.

## Channel data (zengin messages)

quick replies, locations, Flex cards veya template
messages göndermek için `channelData.line` kullanın.

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

LINE Plugin, Flex message presets için `/card` command da ship eder:

```
/card info "Welcome" "Thanks for joining!"
```

## ACP desteği

LINE, ACP (Agent Communication Protocol) conversation bindings desteği sunar:

- `/acp spawn <agent> --bind here`, child thread oluşturmadan current LINE chat'i ACP session'a bind eder.
- Configured ACP bindings ve active conversation-bound ACP sessions, LINE üzerinde diğer conversation channels gibi çalışır.

Ayrıntılar için [ACP agents](/tr/tools/acp-agents) sayfasına bakın.

## Outbound media

LINE Plugin, agent message tool aracılığıyla images, videos ve audio files göndermeyi destekler. Media, appropriate preview ve tracking handling ile LINE-specific delivery path üzerinden gönderilir:

- **Images**: automatic preview generation ile LINE image messages olarak gönderilir.
- **Videos**: explicit preview ve content-type handling ile gönderilir.
- **Audio**: LINE audio messages olarak gönderilir.

Outbound media URLs public HTTPS URLs olmalıdır. OpenClaw, URL'yi LINE'a devretmeden önce target hostname değerini validate eder ve loopback, link-local ve private-network targets öğelerini reddeder.

Generic media sends, LINE-specific path mevcut olmadığında existing image-only route'a fallback eder.

## Sorun giderme

- **Webhook verification fails:** Webhook URL'nin HTTPS olduğundan ve
  `channelSecret` değerinin LINE console ile eşleştiğinden emin olun.
- **No inbound events:** Webhook path'in `channels.line.webhookPath` ile eşleştiğini
  ve Gateway'in LINE tarafından reachable olduğunu doğrulayın.
- **Media download errors:** media default limit'i aşıyorsa `channels.line.mediaMaxMb` değerini artırın.

## İlgili

- [Channels Overview](/tr/channels) — desteklenen tüm channels
- [Pairing](/tr/channels/pairing) — DM authentication ve pairing flow
- [Groups](/tr/channels/groups) — group chat behavior ve mention gating
- [Channel Routing](/tr/channels/channel-routing) — messages için session routing
- [Security](/tr/gateway/security) — access model ve hardening
