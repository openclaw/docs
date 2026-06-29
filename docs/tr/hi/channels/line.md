---
read_when:
    - OpenClaw'ı LINE'a bağlamak istiyorsunuz
    - LINE Webhook + kimlik bilgileri kurulumuna ihtiyacınız var
    - LINE'a özgü mesaj seçenekleri istiyorsunuz
summary: LINE Messaging API Plugin kurulumu, yapılandırması ve kullanımı
title: LINE
x-i18n:
    generated_at: "2026-06-28T22:33:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d54b6740c3403d8fb2e815d969d891973d88c2e2ff43e9de7642c1c81d36e090
    source_path: hi/channels/line.md
    workflow: 16
---

LINE, LINE Messaging API aracılığıyla OpenClaw’a bağlanır. Plugin, Gateway üzerinde Webhook
alıcısı olarak çalışır ve kimlik doğrulama için channel access token + channel secret kullanır.

Durum: İndirilebilir Plugin. Doğrudan mesajlar, grup sohbetleri, medya, konumlar, Flex
mesajları, şablon mesajları ve hızlı yanıtlar desteklenir. Tepkiler ve başlıklar
desteklenmez.

## Kurulum

Channel’ı yapılandırmadan önce LINE’ı kurun:

```bash
openclaw plugins install @openclaw/line
```

Yerel checkout (git repo’sundan çalıştırırken):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Kurulum Ayarları

1. Bir LINE Developers account oluşturun ve Console’u açın:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Bir Provider oluşturun (veya seçin) ve **Messaging API** channel ekleyin.
3. Channel settings içinden **Channel access token** ve **Channel secret** değerlerini kopyalayın.
4. Messaging API settings içinde **Use webhook** seçeneğini etkinleştirin.
5. Webhook URL’sini Gateway endpoint’inize ayarlayın (HTTPS gereklidir):

```
https://gateway-host/line/webhook
```

Gateway, LINE’ın Webhook verification (GET) isteğine yanıt verir ve signature ile payload validation’dan hemen sonra signed
inbound events (POST) kabul eder; agent
processing eşzamansız olarak devam eder.
Custom path gerekiyorsa `channels.line.webhookPath` veya
`channels.line.accounts.<id>.webhookPath` ayarlayın ve URL’yi buna göre güncelleyin.

Güvenlik notu:

- LINE signature verification body-dependent’tır (raw body üzerinde HMAC), bu nedenle OpenClaw verification’dan önce strict pre-auth body limits ve timeout uygular.
- OpenClaw, verified raw request bytes üzerinden Webhook events işler. signature-integrity güvenliği için upstream middleware-transformed `req.body` değerleri yok sayılır.

## Yapılandırma

En düşük config:

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

`tokenFile` ve `secretFile` regular files değerlerine işaret etmelidir. Symlinks reddedilir.

Birden fazla account:

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

Doğrudan mesajlar varsayılan olarak pairing kullanır. Bilinmeyen senders bir pairing code alır ve onların
messages onaylanana kadar yok sayılır.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlists ve policies:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: DM’ler için allowlisted LINE user IDs; `dmPolicy: "open"` için `["*"]` gereklidir
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: groups için allowlisted LINE user IDs
- Grup başına overrides: `channels.line.groups.<groupId>.allowFrom`
- Static sender access groups, `allowFrom`, `groupAllowFrom` ve grup başına `allowFrom` içinden `accessGroup:<name>` ile referans alınabilir.
- Runtime notu: `channels.line` tamamen eksikse runtime, group checks için `groupPolicy="allowlist"` değerine fallback yapar (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

LINE IDs case-sensitive’tır. Geçerli IDs şöyle görünür:

- User: `U` + 32 hex chars
- Group: `C` + 32 hex chars
- Room: `R` + 32 hex chars

## Mesaj davranışı

- Text 5000 characters sınırında chunks halinde bölünür.
- Markdown formatting kaldırılır; code blocks ve tables mümkün olduğunda Flex
  cards’a dönüştürülür.
- Streaming responses buffered olur; agent çalışırken LINE’a loading
  animation ile birlikte tam chunks gönderilir.
- Media downloads `channels.line.mediaMaxMb` (default 10) ile sınırlıdır.
- Inbound media agent’a iletilmeden önce `~/.openclaw/media/inbound/` altında kaydedilir;
  bu, diğer bundled channel
  plugins tarafından kullanılan shared media store ile eşleşir.

## Channel data (zengin mesajlar)

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

LINE Plugin, Flex message presets için `/card` command de ship eder:

```
/card info "Welcome" "Thanks for joining!"
```

## ACP desteği

LINE, ACP (Agent Communication Protocol) conversation bindings desteği sunar:

- `/acp spawn <agent> --bind here`, child thread oluşturmadan current LINE chat’i ACP session’a bind eder.
- Yapılandırılmış ACP bindings ve active conversation-bound ACP sessions, LINE üzerinde diğer conversation channels gibi çalışır.

Ayrıntılar için [ACP agents](/tr/tools/acp-agents) bölümüne bakın.

## Giden medya

LINE Plugin, agent message tool aracılığıyla images, videos ve audio files göndermeyi destekler. Media, uygun preview ve tracking handling ile LINE-specific delivery path üzerinden gönderilir:

- **Images**: automatic preview generation ile LINE image messages olarak gönderilir.
- **Videos**: explicit preview ve content-type handling ile gönderilir.
- **Audio**: LINE audio messages olarak gönderilir.

Outbound media URLs public HTTPS URLs olmalıdır. OpenClaw, URL’yi LINE’a teslim etmeden önce target hostname’i validate eder ve loopback, link-local ve private-network targets değerlerini reddeder.

Generic media sends, LINE-specific path kullanılabilir olmadığında existing image-only route’a fallback yapar.

## Sorun giderme

- **Webhook verification fails:** Webhook URL’sinin HTTPS olduğundan ve
  `channelSecret` değerinin LINE console ile eşleştiğinden emin olun.
- **No inbound events:** Webhook path’in `channels.line.webhookPath` ile eşleştiğini
  ve Gateway’in LINE tarafından reachable olduğunu doğrulayın.
- **Media download errors:** Media default limit’i aşıyorsa `channels.line.mediaMaxMb` değerini artırın.

## İlgili

- [Channels Genel Bakış](/tr/channels) — desteklenen tüm channels
- [Pairing](/tr/channels/pairing) — DM authentication ve pairing flow
- [Groups](/tr/channels/groups) — group chat behavior ve mention gating
- [Channel Routing](/tr/channels/channel-routing) — messages için session routing
- [Security](/tr/gateway/security) — access model ve hardening
