---
read_when:
    - OpenClaw için Twitch sohbet entegrasyonu kurulumu
summary: Twitch sohbet botu yapılandırması ve kurulumu
title: Twitch
x-i18n:
    generated_at: "2026-04-24T09:00:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82b9176deec21344a7cd22f8818277f94bc564d06c4422b149d0fc163ee92d5f
    source_path: channels/twitch.md
    workflow: 15
---

IRC bağlantısı üzerinden Twitch sohbet desteği. OpenClaw, kanallarda mesaj almak ve göndermek için bir Twitch kullanıcısı (bot hesabı) olarak bağlanır.

## Paketle gelen Plugin

Twitch, güncel OpenClaw sürümlerinde paketle gelen bir Plugin olarak gelir; bu nedenle normal
paketlenmiş yapılar ayrı bir kurulum gerektirmez.

Eski bir yapı veya Twitch'i hariç tutan özel bir kurulum kullanıyorsanız,
onu elle yükleyin:

CLI ile yükleme (npm kayıt defteri):

```bash
openclaw plugins install @openclaw/twitch
```

Yerel checkout (bir git deposundan çalışırken):

```bash
openclaw plugins install ./path/to/local/twitch-plugin
```

Ayrıntılar: [Plugins](/tr/tools/plugin)

## Hızlı kurulum (başlangıç)

1. Twitch Plugin'inin kullanılabilir olduğundan emin olun.
   - Güncel paketlenmiş OpenClaw sürümleri bunu zaten paket halinde içerir.
   - Eski/özel kurulumlar bunu yukarıdaki komutlarla elle ekleyebilir.
2. Bot için özel bir Twitch hesabı oluşturun (veya mevcut bir hesabı kullanın).
3. Kimlik bilgileri oluşturun: [Twitch Token Generator](https://twitchtokengenerator.com/)
   - **Bot Token** seçin
   - `chat:read` ve `chat:write` kapsamlarının seçili olduğunu doğrulayın
   - **Client ID** ve **Access Token** değerlerini kopyalayın
4. Twitch kullanıcı kimliğinizi bulun: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
5. Token'ı yapılandırın:
   - Ortam değişkeni: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (yalnızca varsayılan hesap)
   - Veya yapılandırma: `channels.twitch.accessToken`
   - İkisi de ayarlıysa yapılandırma önceliklidir (ortam değişkeni geri dönüşü yalnızca varsayılan hesap içindir).
6. Gateway'i başlatın.

**⚠️ Önemli:** Yetkisiz kullanıcıların botu tetiklemesini önlemek için erişim denetimi (`allowFrom` veya `allowedRoles`) ekleyin. `requireMention` varsayılan olarak `true` değerindedir.

Minimal yapılandırma:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Botun Twitch hesabı
      accessToken: "oauth:abc123...", // OAuth Access Token (veya OPENCLAW_TWITCH_ACCESS_TOKEN ortam değişkenini kullanın)
      clientId: "xyz789...", // Token Generator'dan Client ID
      channel: "vevisk", // Katılınacak Twitch kanal sohbeti (zorunlu)
      allowFrom: ["123456789"], // (önerilir) Yalnızca sizin Twitch kullanıcı kimliğiniz - bunu https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/ adresinden alın
    },
  },
}
```

## Nedir

- Gateway'in sahibi olduğu bir Twitch kanalı.
- Deterministik yönlendirme: yanıtlar her zaman Twitch'e geri gider.
- Her hesap, yalıtılmış bir `agent:<agentId>:twitch:<accountName>` oturum anahtarına eşlenir.
- `username`, botun hesabıdır (kimliği doğrulanan), `channel` ise katılınacak sohbet odasıdır.

## Kurulum (ayrıntılı)

### Kimlik bilgileri oluşturma

[https://twitchtokengenerator.com/](https://twitchtokengenerator.com/) üzerinden [Twitch Token Generator](https://twitchtokengenerator.com/) kullanın:

- **Bot Token** seçin
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

Hem ortam değişkeni hem de yapılandırma ayarlıysa yapılandırma önceliklidir.

### Erişim denetimi (önerilir)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (önerilir) Yalnızca sizin Twitch kullanıcı kimliğiniz
    },
  },
}
```

Kesin bir izin listesi için `allowFrom` tercih edin. Rol tabanlı erişim istiyorsanız bunun yerine `allowedRoles` kullanın.

**Kullanılabilir roller:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

**Neden kullanıcı kimlikleri?** Kullanıcı adları değişebilir ve kimliğe bürünmeye izin verebilir. Kullanıcı kimlikleri kalıcıdır.

Twitch kullanıcı kimliğinizi bulun: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Twitch kullanıcı adınızı kimliğe dönüştürün)

## Token yenileme (isteğe bağlı)

[Twitch Token Generator](https://twitchtokengenerator.com/) kaynaklı token'lar otomatik olarak yenilenemez — süre dolduğunda yeniden oluşturun.

Otomatik token yenileme için [Twitch Developer Console](https://dev.twitch.tv/console) adresinde kendi Twitch uygulamanızı oluşturun ve yapılandırmaya şunları ekleyin:

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

Bot, süre dolmadan önce token'ları otomatik olarak yeniler ve yenileme olaylarını günlüğe kaydeder.

## Çok hesap desteği

Hesap başına token'larla `channels.twitch.accounts` kullanın. Paylaşılan desen için [`gateway/configuration`](/tr/gateway/configuration) sayfasına bakın.

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

### Kullanıcı kimliğine göre izin listesi (en güvenli)

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

`allowFrom`, kesin bir izin listesidir. Ayarlandığında yalnızca bu kullanıcı kimliklerine izin verilir.
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

Varsayılan olarak `requireMention` değeri `true`'dur. Devre dışı bırakmak ve tüm mesajlara yanıt vermek için:

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

Önce tanı komutlarını çalıştırın:

```bash
openclaw doctor
openclaw channels status --probe
```

### Bot mesajlara yanıt vermiyor

**Erişim denetimini kontrol edin:** Kullanıcı kimliğinizin `allowFrom` içinde olduğundan emin olun veya test etmek için geçici olarak
`allowFrom` ayarını kaldırın ve `allowedRoles: ["all"]` ayarlayın.

**Botun kanalda olduğunu kontrol edin:** Bot, `channel` içinde belirtilen kanala katılmış olmalıdır.

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

Şunu görüyorsanız: "token refresh disabled (no refresh token)":

- `clientSecret` sağlandığından emin olun
- `refreshToken` sağlandığından emin olun

## Yapılandırma

**Hesap yapılandırması:**

- `username` - Bot kullanıcı adı
- `accessToken` - `chat:read` ve `chat:write` içeren OAuth erişim token'ı
- `clientId` - Twitch Client ID (Token Generator'dan veya uygulamanızdan)
- `channel` - Katılınacak kanal (zorunlu)
- `enabled` - Bu hesabı etkinleştir (varsayılan: `true`)
- `clientSecret` - İsteğe bağlı: otomatik token yenileme için
- `refreshToken` - İsteğe bağlı: otomatik token yenileme için
- `expiresIn` - Saniye cinsinden token geçerlilik süresi
- `obtainmentTimestamp` - Token alınma zaman damgası
- `allowFrom` - Kullanıcı kimliği izin listesi
- `allowedRoles` - Rol tabanlı erişim denetimi (`"moderator" | "owner" | "vip" | "subscriber" | "all"`)
- `requireMention` - @mention gerektir (varsayılan: `true`)

**Sağlayıcı seçenekleri:**

- `channels.twitch.enabled` - Kanal başlatmayı etkinleştir/devre dışı bırak
- `channels.twitch.username` - Bot kullanıcı adı (basitleştirilmiş tek hesaplı yapılandırma)
- `channels.twitch.accessToken` - OAuth erişim token'ı (basitleştirilmiş tek hesaplı yapılandırma)
- `channels.twitch.clientId` - Twitch Client ID (basitleştirilmiş tek hesaplı yapılandırma)
- `channels.twitch.channel` - Katılınacak kanal (basitleştirilmiş tek hesaplı yapılandırma)
- `channels.twitch.accounts.<accountName>` - Çok hesaplı yapılandırma (yukarıdaki tüm hesap alanları)

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

Aracı şu eylemle `twitch` çağırabilir:

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

- **Token'ları parola gibi değerlendirin** - Token'ları asla git'e commit etmeyin
- Uzun süre çalışan botlar için **otomatik token yenileme** kullanın
- Erişim denetimi için kullanıcı adı yerine **kullanıcı kimliği izin listeleri** kullanın
- Token yenileme olayları ve bağlantı durumu için **günlükleri izleyin**
- **Token kapsamlarını minimumda tutun** - Yalnızca `chat:read` ve `chat:write` isteyin
- **Takılırsanız**: Oturumun başka bir süreç tarafından kullanılmadığını doğruladıktan sonra gateway'i yeniden başlatın

## Sınırlar

- Mesaj başına **500 karakter** (kelime sınırlarında otomatik parçalara bölünür)
- Parçalama öncesinde Markdown kaldırılır
- Hız sınırlaması yoktur (Twitch'in yerleşik hız sınırları kullanılır)

## İlgili

- [Kanal Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme kapısı
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
