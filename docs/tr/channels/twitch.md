---
read_when:
    - OpenClaw için Twitch sohbet entegrasyonunu ayarlama
sidebarTitle: Twitch
summary: Twitch sohbet botu yapılandırması ve kurulumu
title: Twitch
x-i18n:
    generated_at: "2026-05-02T22:16:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0d5f16d1369e2783bec6e0c7b2d7bee8aae86f2a424b77b9adf14850de0f20b
    source_path: channels/twitch.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Twitch sohbet desteği, IRC bağlantısı üzerinden sağlanır. OpenClaw, kanallarda mesaj almak ve göndermek için bir Twitch kullanıcısı (bot hesabı) olarak bağlanır.

## Paketle birlikte gelen Plugin

<Note>
Twitch, mevcut OpenClaw sürümlerinde paketle birlikte gelen bir Plugin olarak sunulur; bu nedenle normal paketlenmiş derlemeler ayrı bir kurulum gerektirmez.
</Note>

Daha eski bir derlemedeyseniz veya Twitch'i hariç tutan özel bir kurulum kullanıyorsanız npm paketini doğrudan kurun:

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

Geçerli resmi yayın etiketini izlemek için yalın paketi kullanın. Tam sürümü yalnızca yeniden üretilebilir bir kurulum gerektiğinde sabitleyin.

Ayrıntılar: [Plugin'ler](/tr/tools/plugin)

## Hızlı kurulum (başlangıç)

<Steps>
  <Step title="Ensure plugin is available">
    Mevcut paketlenmiş OpenClaw sürümleri zaten bunu içerir. Daha eski/özel kurulumlar yukarıdaki komutlarla bunu elle ekleyebilir.
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
    Bir kullanıcı adını Twitch kullanıcı kimliğine dönüştürmek için [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) adresini kullanın.
  </Step>
  <Step title="Configure the token">
    - Ortam: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (yalnızca varsayılan hesap)
    - Veya yapılandırma: `channels.twitch.accessToken`

    İkisi de ayarlanmışsa yapılandırma önceliklidir (ortam geri dönüşü yalnızca varsayılan hesap içindir).

  </Step>
  <Step title="Start the gateway">
    Gateway'i yapılandırılmış kanalla başlatın.
  </Step>
</Steps>

<Warning>
Yetkisiz kullanıcıların botu tetiklemesini önlemek için erişim denetimi (`allowFrom` veya `allowedRoles`) ekleyin. `requireMention` varsayılan olarak `true` değerindedir.
</Warning>

En küçük yapılandırma:

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

- Gateway tarafından sahiplenilen bir Twitch kanalıdır.
- Belirleyici yönlendirme: yanıtlar her zaman Twitch'e geri gider.
- Her hesap, yalıtılmış bir oturum anahtarına eşlenir: `agent:<agentId>:twitch:<accountName>`.
- `username`, botun hesabıdır (kimlik doğrulayan kişi); `channel`, katılınacak sohbet odasıdır.

## Kurulum (ayrıntılı)

### Kimlik bilgileri oluşturma

[Twitch Token Generator](https://twitchtokengenerator.com/) kullanın:

- **Bot Token** seçin
- `chat:read` ve `chat:write` kapsamlarının seçili olduğunu doğrulayın
- **Client ID** ve **Access Token** değerlerini kopyalayın

<Note>
Elle uygulama kaydı gerekmez. Token'lar birkaç saat sonra sona erer.
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

Hem ortam hem de yapılandırma ayarlanmışsa yapılandırma önceliklidir.

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
**Neden kullanıcı kimlikleri?** Kullanıcı adları değişebilir ve bu, kimliğe bürünmeye izin verebilir. Kullanıcı kimlikleri kalıcıdır.

Twitch kullanıcı kimliğinizi bulun: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Twitch kullanıcı adınızı kimliğe dönüştürün)
</Note>

## Token yenileme (isteğe bağlı)

[Twitch Token Generator](https://twitchtokengenerator.com/) tarafından oluşturulan token'lar otomatik olarak yenilenemez; süresi dolduğunda yeniden oluşturun.

Otomatik token yenileme için [Twitch Developer Console](https://dev.twitch.tv/console) üzerinde kendi Twitch uygulamanızı oluşturun ve yapılandırmaya ekleyin:

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

Bot, token'ları süresi dolmadan önce otomatik olarak yeniler ve yenileme olaylarını günlüğe kaydeder.

## Çoklu hesap desteği

Hesap başına token'larla `channels.twitch.accounts` kullanın. Paylaşılan desen için [Yapılandırma](/tr/gateway/configuration) bölümüne bakın.

Örnek (iki kanalda bir bot hesabı):

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
Her hesabın kendi token'ına ihtiyacı vardır (kanal başına bir token).
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
    Varsayılan olarak `requireMention`, `true` değerindedir. Devre dışı bırakmak ve tüm mesajlara yanıt vermek için:

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
    - **Erişim denetimini kontrol edin:** Kullanıcı kimliğinizin `allowFrom` içinde olduğundan emin olun veya test etmek için geçici olarak `allowFrom` değerini kaldırıp `allowedRoles: ["all"]` ayarlayın.
    - **Botun kanalda olduğunu kontrol edin:** Bot, `channel` içinde belirtilen kanala katılmalıdır.

  </Accordion>
  <Accordion title="Token issues">
    "Bağlanılamadı" veya kimlik doğrulama hataları:

    - `accessToken` değerinin OAuth erişim token'ı değeri olduğunu doğrulayın (genellikle `oauth:` ön ekiyle başlar)
    - Token'ın `chat:read` ve `chat:write` kapsamlarına sahip olduğunu kontrol edin
    - Token yenileme kullanıyorsanız `clientSecret` ve `refreshToken` değerlerinin ayarlandığını doğrulayın

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

## Yapılandırma

### Hesap yapılandırması

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
  Token sona erme süresi, saniye cinsinden.
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Token'ın alındığı zaman damgası.
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

- `channels.twitch.enabled` - Kanal başlangıcını etkinleştir/devre dışı bırak
- `channels.twitch.username` - Bot kullanıcı adı (basitleştirilmiş tek hesap yapılandırması)
- `channels.twitch.accessToken` - OAuth erişim token'ı (basitleştirilmiş tek hesap yapılandırması)
- `channels.twitch.clientId` - Twitch Client ID (basitleştirilmiş tek hesap yapılandırması)
- `channels.twitch.channel` - Katılınacak kanal (basitleştirilmiş tek hesap yapılandırması)
- `channels.twitch.accounts.<accountName>` - Çoklu hesap yapılandırması (yukarıdaki tüm hesap alanları)

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

Aracı `twitch` çağrısını şu eylemle yapabilir:

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

## Güvenlik ve operasyon

- **Token'ları parola gibi ele alın** — Token'ları asla git'e commit etmeyin.
- **Uzun süre çalışan botlar için otomatik token yenileme kullanın**.
- **Erişim denetimi için kullanıcı adları yerine kullanıcı kimliği izin listeleri kullanın**.
- **Token yenileme olayları ve bağlantı durumu için günlükleri izleyin**.
- **Token kapsamlarını en aza indirin** — Yalnızca `chat:read` ve `chat:write` isteyin.
- **Takılırsanız**: Oturuma başka hiçbir sürecin sahip olmadığını doğruladıktan sonra Gateway'i yeniden başlatın.

## Sınırlar

- Mesaj başına **500 karakter** (sözcük sınırlarında otomatik olarak parçalara bölünür).
- Markdown, parçalara bölmeden önce kaldırılır.
- Hız sınırlaması yoktur (Twitch'in yerleşik hız sınırlarını kullanır).

## İlgili

- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve mention geçidi
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
