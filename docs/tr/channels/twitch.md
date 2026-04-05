---
read_when:
    - OpenClaw için Twitch sohbet entegrasyonu kurulurken
summary: Twitch sohbet botu yapılandırması ve kurulumu
title: Twitch
x-i18n:
    generated_at: "2026-04-05T13:47:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47af9fb6edb1f462c5919850ee9d05e500a1914ddd0d64a41608fbe960e77cd6
    source_path: channels/twitch.md
    workflow: 15
---

# Twitch

IRC bağlantısı üzerinden Twitch sohbet desteği. OpenClaw, kanallarda iletileri almak ve göndermek için bir Twitch kullanıcısı (bot hesabı) olarak bağlanır.

## Paketlenmiş eklenti

Twitch, mevcut OpenClaw sürümlerinde paketlenmiş bir eklenti olarak gelir, bu nedenle normal
paketlenmiş derlemelerde ayrı bir kurulum gerekmez.

Daha eski bir derlemeyi veya Twitch'i içermeyen özel bir kurulumu kullanıyorsanız, bunu
manuel olarak yükleyin:

CLI ile yükleyin (`npm` kayıt defteri):

```bash
openclaw plugins install @openclaw/twitch
```

Yerel checkout (bir git deposundan çalıştırırken):

```bash
openclaw plugins install ./path/to/local/twitch-plugin
```

Ayrıntılar: [Eklentiler](/tools/plugin)

## Hızlı kurulum (başlangıç)

1. Twitch eklentisinin kullanılabilir olduğundan emin olun.
   - Mevcut paketlenmiş OpenClaw sürümleri bunu zaten içerir.
   - Eski/özel kurulumlar bunu yukarıdaki komutlarla manuel olarak ekleyebilir.
2. Bot için özel bir Twitch hesabı oluşturun (veya mevcut bir hesabı kullanın).
3. Kimlik bilgilerini oluşturun: [Twitch Token Generator](https://twitchtokengenerator.com/)
   - **Bot Token** seçeneğini seçin
   - `chat:read` ve `chat:write` kapsamlarının seçili olduğunu doğrulayın
   - **Client ID** ve **Access Token** değerlerini kopyalayın
4. Twitch kullanıcı kimliğinizi bulun: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
5. Token'ı yapılandırın:
   - Ortam değişkeni: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (yalnızca varsayılan hesap)
   - Veya yapılandırma: `channels.twitch.accessToken`
   - Her ikisi de ayarlıysa yapılandırma önceliklidir (ortam değişkeni yedeği yalnızca varsayılan hesap içindir).
6. Gateway'i başlatın.

**⚠️ Önemli:** Yetkisiz kullanıcıların botu tetiklemesini önlemek için erişim denetimi (`allowFrom` veya `allowedRoles`) ekleyin. `requireMention` varsayılan olarak `true` değerindedir.

Minimum yapılandırma:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Botun Twitch hesabı
      accessToken: "oauth:abc123...", // OAuth Access Token (veya OPENCLAW_TWITCH_ACCESS_TOKEN ortam değişkenini kullanın)
      clientId: "xyz789...", // Token Generator'dan alınan Client ID
      channel: "vevisk", // Katılınacak Twitch kanalının sohbeti (gerekli)
      allowFrom: ["123456789"], // (önerilir) yalnızca sizin Twitch kullanıcı kimliğiniz - bunu https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/ adresinden alın
    },
  },
}
```

## Nedir

- Gateway'e ait bir Twitch kanalı.
- Deterministik yönlendirme: yanıtlar her zaman Twitch'e geri gider.
- Her hesap, yalıtılmış bir oturum anahtarına eşlenir: `agent:<agentId>:twitch:<accountName>`.
- `username`, botun hesabıdır (kimlik doğrulayan); `channel` ise katılınacak sohbet odasıdır.

## Kurulum (ayrıntılı)

### Kimlik bilgileri oluşturma

[Twitch Token Generator](https://twitchtokengenerator.com/) kullanın:

- **Bot Token** seçeneğini seçin
- `chat:read` ve `chat:write` kapsamlarının seçili olduğunu doğrulayın
- **Client ID** ve **Access Token** değerlerini kopyalayın

Elle uygulama kaydı gerekmez. Token'ların süresi birkaç saat sonra dolar.

### Botu yapılandırma

**Ortam değişkeni (yalnızca varsayılan hesap):**

```bash
OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
```

**Veya yapılandırma:**

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

Ortam değişkeni ve yapılandırma birlikte ayarlıysa yapılandırma önceliklidir.

### Erişim denetimi (önerilir)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (önerilir) yalnızca sizin Twitch kullanıcı kimliğiniz
    },
  },
}
```

Kesin bir allowlist için `allowFrom` tercih edin. Rol tabanlı erişim istiyorsanız bunun yerine `allowedRoles` kullanın.

**Kullanılabilir roller:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

**Neden kullanıcı kimlikleri?** Kullanıcı adları değişebilir ve bu da kimliğe bürünmeye izin verir. Kullanıcı kimlikleri kalıcıdır.

Twitch kullanıcı kimliğinizi burada bulun: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Twitch kullanıcı adınızı kimliğe dönüştürün)

## Token yenileme (isteğe bağlı)

[Twitch Token Generator](https://twitchtokengenerator.com/) üzerinden alınan token'lar otomatik olarak yenilenemez; süreleri dolduğunda yeniden oluşturun.

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

Bot, token'ları süre dolmadan önce otomatik olarak yeniler ve yenileme olaylarını günlüğe kaydeder.

## Çoklu hesap desteği

Hesap başına token'larla `channels.twitch.accounts` kullanın. Paylaşılan desen için [`gateway/configuration`](/gateway/configuration) sayfasına bakın.

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

**Not:** Her hesabın kendi token'ına ihtiyacı vardır (kanal başına bir token).

## Erişim denetimi

### Rol tabanlı kısıtlamalar

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

### Kullanıcı kimliğine göre allowlist (en güvenli)

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

### Rol tabanlı erişim (alternatif)

`allowFrom`, kesin bir allowlist'tir. Ayarlandığında yalnızca bu kullanıcı kimliklerine izin verilir.
Rol tabanlı erişim istiyorsanız `allowFrom` ayarını boş bırakın ve bunun yerine `allowedRoles` yapılandırın:

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

### @mention gereksinimini devre dışı bırakma

Varsayılan olarak `requireMention`, `true` değerindedir. Bunu devre dışı bırakmak ve tüm iletilere yanıt vermek için:

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

## Sorun giderme

Önce tanılama komutlarını çalıştırın:

```bash
openclaw doctor
openclaw channels status --probe
```

### Bot iletilere yanıt vermiyor

**Erişim denetimini kontrol edin:** Kullanıcı kimliğinizin `allowFrom` içinde olduğundan emin olun veya test için
`allowFrom` ayarını geçici olarak kaldırıp `allowedRoles: ["all"]` ayarlayın.

**Botun kanalda olduğunu kontrol edin:** Bot, `channel` içinde belirtilen kanala katılmalıdır.

### Token sorunları

**"Failed to connect" veya kimlik doğrulama hataları:**

- `accessToken` değerinin OAuth erişim token değeri olduğunu doğrulayın (genellikle `oauth:` önekiyle başlar)
- Token'ın `chat:read` ve `chat:write` kapsamlarına sahip olduğunu kontrol edin
- Token yenileme kullanıyorsanız `clientSecret` ve `refreshToken` değerlerinin ayarlı olduğunu doğrulayın

### Token yenileme çalışmıyor

**Yenileme olayları için günlükleri kontrol edin:**

```
Using env token source for mybot
Access token refreshed for user 123456 (expires in 14400s)
```

"token refresh disabled (no refresh token)" görüyorsanız:

- `clientSecret` sağlandığından emin olun
- `refreshToken` sağlandığından emin olun

## Yapılandırma

**Hesap yapılandırması:**

- `username` - Bot kullanıcı adı
- `accessToken` - `chat:read` ve `chat:write` kapsamlarına sahip OAuth erişim token'ı
- `clientId` - Twitch Client ID (Token Generator'dan veya kendi uygulamanızdan)
- `channel` - Katılınacak kanal (gerekli)
- `enabled` - Bu hesabı etkinleştir (varsayılan: `true`)
- `clientSecret` - İsteğe bağlı: otomatik token yenileme için
- `refreshToken` - İsteğe bağlı: otomatik token yenileme için
- `expiresIn` - Saniye cinsinden token süresi
- `obtainmentTimestamp` - Token alma zaman damgası
- `allowFrom` - Kullanıcı kimliği allowlist'i
- `allowedRoles` - Rol tabanlı erişim denetimi (`"moderator" | "owner" | "vip" | "subscriber" | "all"`)
- `requireMention` - @mention gerektir (varsayılan: `true`)

**Sağlayıcı seçenekleri:**

- `channels.twitch.enabled` - Kanal başlatmayı etkinleştir/devre dışı bırak
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

Aracı, şu eylemle `twitch` çağırabilir:

- `send` - Bir kanala ileti gönder

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

- **Token'lara parola gibi davranın** - Token'ları asla git'e commit etmeyin
- **Uzun süre çalışan botlar için otomatik token yenileme kullanın**
- **Erişim denetimi için kullanıcı adları yerine kullanıcı kimliği allowlist'leri kullanın**
- **Token yenileme olayları ve bağlantı durumu için günlükleri izleyin**
- **Token kapsamlarını minimumda tutun** - Yalnızca `chat:read` ve `chat:write` isteyin
- **Takılırsanız**: Başka hiçbir sürecin oturuma sahip olmadığını doğruladıktan sonra gateway'i yeniden başlatın

## Sınırlar

- İleti başına **500 karakter** (sözcük sınırlarında otomatik bölünür)
- Bölme işleminden önce Markdown kaldırılır
- Hız sınırlaması yoktur (Twitch'in yerleşik hız sınırlarını kullanır)

## İlgili

- [Channels Overview](/tr/channels) — desteklenen tüm kanallar
- [Pairing](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Groups](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme geçidi
- [Channel Routing](/tr/channels/channel-routing) — iletiler için oturum yönlendirmesi
- [Security](/gateway/security) — erişim modeli ve sağlamlaştırma
