---
read_when:
    - OpenClaw için Twitch sohbet entegrasyonunu ayarlama
sidebarTitle: Twitch
summary: Twitch sohbet botu yapılandırması ve kurulumu
title: Twitch
x-i18n:
    generated_at: "2026-04-30T09:09:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 897079687a243c9c2ce2be63167e59f4413bbd89735fb79f03928547023bd787
    source_path: channels/twitch.md
    workflow: 16
---

Twitch sohbet desteği, IRC bağlantısı üzerinden sağlanır. OpenClaw, kanallarda mesaj almak ve göndermek için bir Twitch kullanıcısı (bot hesabı) olarak bağlanır.

## Paketle birlikte gelen Plugin

<Note>
Twitch, mevcut OpenClaw sürümlerinde paketle birlikte gelen bir Plugin olarak sunulur; bu nedenle normal paketlenmiş derlemeler ayrı bir kurulum gerektirmez.
</Note>

Twitch'i hariç tutan eski bir derleme veya özel kurulum kullanıyorsanız, yayımlandığında güncel bir npm paketini kurun:

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="Local checkout">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

npm, OpenClaw tarafından sahip olunan paketi kullanımdan kaldırılmış olarak bildirirse, daha yeni bir npm paketi yayımlanana kadar güncel paketlenmiş bir OpenClaw derlemesi veya yerel checkout yolunu kullanın.

Ayrıntılar: [Plugin'ler](/tr/tools/plugin)

## Hızlı kurulum (başlangıç)

<Steps>
  <Step title="Ensure plugin is available">
    Güncel paketlenmiş OpenClaw sürümleri bunu zaten içerir. Eski/özel kurulumlar, yukarıdaki komutlarla bunu elle ekleyebilir.
  </Step>
  <Step title="Create a Twitch bot account">
    Bot için ayrılmış bir Twitch hesabı oluşturun (veya mevcut bir hesabı kullanın).
  </Step>
  <Step title="Generate credentials">
    [Twitch Token Generator](https://twitchtokengenerator.com/) kullanın:

    - **Bot Token** seçin
    - `chat:read` ve `chat:write` kapsamlarının seçili olduğunu doğrulayın
    - **Client ID** ve **Access Token** değerlerini kopyalayın

  </Step>
  <Step title="Find your Twitch user ID">
    Bir kullanıcı adını Twitch kullanıcı kimliğine dönüştürmek için [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) kullanın.
  </Step>
  <Step title="Configure the token">
    - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (yalnızca varsayılan hesap)
    - Veya config: `channels.twitch.accessToken`

    İkisi de ayarlanmışsa config önceliklidir (env fallback yalnızca varsayılan hesap içindir).

  </Step>
  <Step title="Start the gateway">
    Gateway'i yapılandırılmış kanalla başlatın.
  </Step>
</Steps>

<Warning>
Yetkisiz kullanıcıların botu tetiklemesini önlemek için erişim denetimi (`allowFrom` veya `allowedRoles`) ekleyin. `requireMention` varsayılan olarak `true` değerindedir.
</Warning>

Minimal config:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Bot's Twitch account
      accessToken: "oauth:abc123...", // OAuth Access Token (or use OPENCLAW_TWITCH_ACCESS_TOKEN env var)
      clientId: "xyz789...", // Client ID from Token Generator
      channel: "vevisk", // Which Twitch channel's chat to join (required)
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only - get it from https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## Nedir

- Gateway tarafından sahip olunan bir Twitch kanalı.
- Belirleyici yönlendirme: yanıtlar her zaman Twitch'e geri gider.
- Her hesap, yalıtılmış bir oturum anahtarına eşlenir: `agent:<agentId>:twitch:<accountName>`.
- `username` botun hesabıdır (kimlik doğrulayan kullanıcı), `channel` ise katılınacak sohbet odasıdır.

## Kurulum (ayrıntılı)

### Kimlik bilgilerini oluşturma

[Twitch Token Generator](https://twitchtokengenerator.com/) kullanın:

- **Bot Token** seçin
- `chat:read` ve `chat:write` kapsamlarının seçili olduğunu doğrulayın
- **Client ID** ve **Access Token** değerlerini kopyalayın

<Note>
Elle uygulama kaydı gerekmez. Token'ların süresi birkaç saat sonra dolar.
</Note>

### Botu yapılandırma

<Tabs>
  <Tab title="Env var (default account only)">
    ```bash
    OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
    ```
  </Tab>
  <Tab title="Config">
    ```json5
    {
      channels: {
        twitch: {
          enabled: true,
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
      },
    }
    ```
  </Tab>
</Tabs>

Hem env hem de config ayarlanmışsa config önceliklidir.

### Erişim denetimi (önerilir)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only
    },
  },
}
```

Kesin bir izin listesi için `allowFrom` tercih edin. Rol tabanlı erişim istiyorsanız bunun yerine `allowedRoles` kullanın.

**Kullanılabilir roller:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Note>
**Neden kullanıcı kimlikleri?** Kullanıcı adları değişebilir ve bu, başkasının kimliğine bürünmeye olanak tanır. Kullanıcı kimlikleri kalıcıdır.

Twitch kullanıcı kimliğinizi bulun: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Twitch kullanıcı adınızı kimliğe dönüştürün)
</Note>

## Token yenileme (isteğe bağlı)

[Twitch Token Generator](https://twitchtokengenerator.com/) tarafından oluşturulan token'lar otomatik olarak yenilenemez; süresi dolduğunda yeniden oluşturun.

Otomatik token yenileme için [Twitch Developer Console](https://dev.twitch.tv/console) üzerinden kendi Twitch uygulamanızı oluşturun ve config'e ekleyin:

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

Bot, token'ları süreleri dolmadan önce otomatik olarak yeniler ve yenileme olaylarını günlüğe kaydeder.

## Çoklu hesap desteği

Hesap başına token'larla `channels.twitch.accounts` kullanın. Paylaşılan kalıp için [Yapılandırma](/tr/gateway/configuration) bölümüne bakın.

Örnek (iki kanalda tek bot hesabı):

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

<Note>
Her hesabın kendi token'ı gerekir (kanal başına bir token).
</Note>

## Erişim denetimi

<Tabs>
  <Tab title="User ID allowlist (most secure)">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowFrom: ["123456789", "987654321"],
            },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Role-based">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowedRoles: ["moderator", "vip"],
            },
          },
        },
      },
    }
    ```

    `allowFrom` kesin bir izin listesidir. Ayarlandığında yalnızca bu kullanıcı kimliklerine izin verilir. Rol tabanlı erişim istiyorsanız `allowFrom` değerini ayarlamayın ve bunun yerine `allowedRoles` yapılandırın.

  </Tab>
  <Tab title="Disable @mention requirement">
    Varsayılan olarak `requireMention`, `true` değerindedir. Bunu devre dışı bırakmak ve tüm mesajlara yanıt vermek için:

    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              requireMention: false,
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Sorun giderme

Önce tanılama komutlarını çalıştırın:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Bot does not respond to messages">
    - **Erişim denetimini kontrol edin:** Kullanıcı kimliğinizin `allowFrom` içinde olduğundan emin olun veya test etmek için `allowFrom` öğesini geçici olarak kaldırıp `allowedRoles: ["all"]` ayarlayın.
    - **Botun kanalda olduğunu kontrol edin:** Bot, `channel` içinde belirtilen kanala katılmalıdır.

  </Accordion>
  <Accordion title="Token issues">
    "Failed to connect" veya kimlik doğrulama hataları:

    - `accessToken` değerinin OAuth erişim token'ı değeri olduğunu doğrulayın (genellikle `oauth:` önekiyle başlar)
    - Token'ın `chat:read` ve `chat:write` kapsamlarına sahip olduğunu kontrol edin
    - Token yenileme kullanıyorsanız `clientSecret` ve `refreshToken` değerlerinin ayarlı olduğunu doğrulayın

  </Accordion>
  <Accordion title="Token refresh not working">
    Yenileme olayları için günlükleri kontrol edin:

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    "token refresh disabled (no refresh token)" görürseniz:

    - `clientSecret` sağlandığından emin olun
    - `refreshToken` sağlandığından emin olun

  </Accordion>
</AccordionGroup>

## Config

### Hesap config'i

<ParamField path="username" type="string">
  Bot kullanıcı adı.
</ParamField>
<ParamField path="accessToken" type="string">
  `chat:read` ve `chat:write` içeren OAuth erişim token'ı.
</ParamField>
<ParamField path="clientId" type="string">
  Twitch Client ID (Token Generator veya uygulamanızdan).
</ParamField>
<ParamField path="channel" type="string" required>
  Katılınacak kanal.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  Bu hesabı etkinleştir.
</ParamField>
<ParamField path="clientSecret" type="string">
  İsteğe bağlı: otomatik token yenileme için.
</ParamField>
<ParamField path="refreshToken" type="string">
  İsteğe bağlı: otomatik token yenileme için.
</ParamField>
<ParamField path="expiresIn" type="number">
  Saniye cinsinden token süre sonu.
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Token alınma zaman damgası.
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Kullanıcı kimliği izin listesi.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Rol tabanlı erişim denetimi.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  @mention gerektir.
</ParamField>

### Sağlayıcı seçenekleri

- `channels.twitch.enabled` - Kanal başlatmayı etkinleştir/devre dışı bırak
- `channels.twitch.username` - Bot kullanıcı adı (basitleştirilmiş tek hesap config'i)
- `channels.twitch.accessToken` - OAuth erişim token'ı (basitleştirilmiş tek hesap config'i)
- `channels.twitch.clientId` - Twitch Client ID (basitleştirilmiş tek hesap config'i)
- `channels.twitch.channel` - Katılınacak kanal (basitleştirilmiş tek hesap config'i)
- `channels.twitch.accounts.<accountName>` - Çoklu hesap config'i (yukarıdaki tüm hesap alanları)

Tam örnek:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Araç eylemleri

Ajan, şu eylemle `twitch` çağırabilir:

- `send` - Bir kanala mesaj gönder

Örnek:

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## Güvenlik ve operasyonlar

- **Token'lara parola gibi davranın** — Token'ları asla git'e commit etmeyin.
- Uzun süre çalışan botlar için **otomatik token yenileme kullanın**.
- Erişim denetimi için kullanıcı adları yerine **kullanıcı kimliği izin listeleri kullanın**.
- Token yenileme olayları ve bağlantı durumu için **günlükleri izleyin**.
- **Token kapsamlarını en aza indirin** — Yalnızca `chat:read` ve `chat:write` isteyin.
- **Takılırsanız**: Oturumun başka bir işleme ait olmadığını doğruladıktan sonra Gateway'i yeniden başlatın.

## Sınırlar

- Mesaj başına **500 karakter** (kelime sınırlarında otomatik olarak parçalara ayrılır).
- Markdown, parçalara ayırmadan önce kaldırılır.
- Hız sınırlaması yoktur (Twitch'in yerleşik hız sınırlarını kullanır).

## İlgili

- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirme
- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve mention kapısı
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulama ve eşleştirme akışı
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
