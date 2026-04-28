---
read_when:
    - OpenClaw için Twitch sohbet entegrasyonunu kurma
sidebarTitle: Twitch
summary: Twitch sohbet botu yapılandırması ve kurulumu
title: Twitch
x-i18n:
    generated_at: "2026-04-26T11:24:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d5f4bbad04e04cccc82fc1e2b1057acae3bf7b7684a8e7a4b1f54101731974a
    source_path: channels/twitch.md
    workflow: 15
---

IRC bağlantısı üzerinden Twitch sohbet desteği. OpenClaw, kanallarda mesaj almak ve göndermek için bir Twitch kullanıcısı (bot hesabı) olarak bağlanır.

## Birlikte gelen Plugin

<Note>
Twitch, mevcut OpenClaw sürümlerinde birlikte gelen bir Plugin olarak sunulur; bu nedenle normal paketli derlemelerde ayrı bir kurulum gerekmez.
</Note>

Daha eski bir derleme veya Twitch'i içermeyen özel bir kurulum kullanıyorsanız, manuel olarak kurun:

<Tabs>
  <Tab title="npm kayıt defteri">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="Yerel checkout">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

Ayrıntılar: [Plugins](/tr/tools/plugin)

## Hızlı kurulum (başlangıç)

<Steps>
  <Step title="Plugin'in kullanılabilir olduğundan emin olun">
    Mevcut paketli OpenClaw sürümleri bunu zaten birlikte sunar. Daha eski/özel kurulumlar yukarıdaki komutlarla manuel olarak ekleyebilir.
  </Step>
  <Step title="Bir Twitch bot hesabı oluşturun">
    Bot için özel bir Twitch hesabı oluşturun (veya mevcut bir hesabı kullanın).
  </Step>
  <Step title="Kimlik bilgileri oluşturun">
    [Twitch Token Generator](https://twitchtokengenerator.com/) kullanın:

    - **Bot Token** seçin
    - `chat:read` ve `chat:write` kapsamlarının seçili olduğunu doğrulayın
    - **Client ID** ve **Access Token** değerlerini kopyalayın

  </Step>
  <Step title="Twitch kullanıcı kimliğinizi bulun">
    Bir kullanıcı adını Twitch kullanıcı kimliğine dönüştürmek için [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) kullanın.
  </Step>
  <Step title="Token'ı yapılandırın">
    - Ortam değişkeni: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (yalnızca varsayılan hesap)
    - Veya yapılandırma: `channels.twitch.accessToken`

    Her ikisi de ayarlıysa yapılandırma önceliklidir (ortam değişkeni yedeği yalnızca varsayılan hesap içindir).

  </Step>
  <Step title="Gateway'i başlatın">
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

- Gateway'in sahip olduğu bir Twitch kanalı.
- Deterministik yönlendirme: yanıtlar her zaman Twitch'e geri gider.
- Her hesap, yalıtılmış bir `agent:<agentId>:twitch:<accountName>` oturum anahtarına eşlenir.
- `username`, botun hesabıdır (kimlik doğrulayan taraf), `channel` ise katılınacak sohbet odasıdır.

## Kurulum (ayrıntılı)

### Kimlik bilgileri oluşturun

[Twitch Token Generator](https://twitchtokengenerator.com/) kullanın:

- **Bot Token** seçin
- `chat:read` ve `chat:write` kapsamlarının seçili olduğunu doğrulayın
- **Client ID** ve **Access Token** değerlerini kopyalayın

<Note>
Manuel uygulama kaydı gerekmez. Token'lar birkaç saat sonra sona erer.
</Note>

### Botu yapılandırın

<Tabs>
  <Tab title="Ortam değişkeni (yalnızca varsayılan hesap)">
    ```bash
    OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
    ```
  </Tab>
  <Tab title="Yapılandırma">
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

Hem ortam değişkeni hem de yapılandırma ayarlıysa yapılandırma önceliklidir.

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

Katı bir izin listesi için `allowFrom` tercih edin. Rol tabanlı erişim istiyorsanız bunun yerine `allowedRoles` kullanın.

**Kullanılabilir roller:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Note>
**Neden kullanıcı kimlikleri?** Kullanıcı adları değişebilir ve bu da kimliğe bürünmeye izin verebilir. Kullanıcı kimlikleri kalıcıdır.

Twitch kullanıcı kimliğinizi bulun: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Twitch kullanıcı adınızı kimliğe dönüştürün)
</Note>

## Token yenileme (isteğe bağlı)

[Twitch Token Generator](https://twitchtokengenerator.com/) üzerinden alınan Token'lar otomatik olarak yenilenemez; süreleri dolduğunda yeniden oluşturun.

Otomatik token yenileme için [Twitch Developer Console](https://dev.twitch.tv/console) üzerinden kendi Twitch uygulamanızı oluşturun ve yapılandırmaya şunları ekleyin:

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

Bot, token'ları süre dolmadan önce otomatik olarak yeniler ve yenileme olaylarını günlüğe kaydeder.

## Çoklu hesap desteği

Hesap başına token'larla `channels.twitch.accounts` kullanın. Paylaşılan desen için bkz. [Yapılandırma](/tr/gateway/configuration).

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
Her hesabın kendi token'ına ihtiyacı vardır (kanal başına bir token).
</Note>

## Erişim denetimi

<Tabs>
  <Tab title="Kullanıcı kimliği izin listesi (en güvenli)">
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
  <Tab title="Rol tabanlı">
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

    `allowFrom`, katı bir izin listesidir. Ayarlandığında yalnızca bu kullanıcı kimliklerine izin verilir. Rol tabanlı erişim istiyorsanız `allowFrom` değerini ayarlamayın ve bunun yerine `allowedRoles` yapılandırın.

  </Tab>
  <Tab title="@mention zorunluluğunu devre dışı bırak">
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
  <Accordion title="Bot mesajlara yanıt vermiyor">
    - **Erişim denetimini kontrol edin:** Kullanıcı kimliğinizin `allowFrom` içinde olduğundan emin olun veya test için geçici olarak `allowFrom` değerini kaldırıp `allowedRoles: ["all"]` ayarlayın.
    - **Botun kanalda olduğunu kontrol edin:** Bot, `channel` içinde belirtilen kanala katılmış olmalıdır.

  </Accordion>
  <Accordion title="Token sorunları">
    "Failed to connect" veya kimlik doğrulama hataları:

    - `accessToken` değerinin OAuth erişim token'ı değeri olduğunu doğrulayın (genellikle `oauth:` önekiyle başlar)
    - Token'ın `chat:read` ve `chat:write` kapsamlarına sahip olduğunu kontrol edin
    - Token yenileme kullanıyorsanız `clientSecret` ve `refreshToken` değerlerinin ayarlı olduğunu doğrulayın

  </Accordion>
  <Accordion title="Token yenileme çalışmıyor">
    Yenileme olayları için günlükleri kontrol edin:

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    "token refresh disabled (no refresh token)" görüyorsanız:

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
  `chat:read` ve `chat:write` kapsamlarına sahip OAuth erişim token'ı.
</ParamField>
<ParamField path="clientId" type="string">
  Twitch Client ID (Token Generator'dan veya kendi uygulamanızdan).
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
  Saniye cinsinden token süresi.
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
  @mention zorunlu olsun.
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
- Uzun süre çalışan botlar için **otomatik token yenileme** kullanın.
- Erişim denetimi için kullanıcı adları yerine **kullanıcı kimliği izin listeleri** kullanın.
- Token yenileme olayları ve bağlantı durumu için **günlükleri izleyin**.
- **Token kapsamlarını en düşük düzeyde tutun** — Yalnızca `chat:read` ve `chat:write` isteyin.
- **Takılırsanız**: Oturumun başka bir süreç tarafından kullanılmadığını doğruladıktan sonra Gateway'i yeniden başlatın.

## Sınırlar

- Mesaj başına **500 karakter** (kelime sınırlarında otomatik parçalara bölünür).
- Markdown, parçalama öncesinde kaldırılır.
- Hız sınırlaması yoktur (Twitch'in yerleşik hız sınırları kullanılır).

## İlgili

- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirme
- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme sınırlaması
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sıkılaştırma
