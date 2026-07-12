---
read_when:
    - OpenClaw için Twitch sohbet entegrasyonunu ayarlama
sidebarTitle: Twitch
summary: 'Twitch sohbet botu: kurulum, kimlik bilgileri, erişim denetimi, token yenileme'
title: Twitch
x-i18n:
    generated_at: "2026-07-12T12:06:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70890c0c6a648a06ad47c35016571a57c3e518296ef95311e75e32c81e60e2db
    source_path: channels/twitch.md
    workflow: 16
---

Twurple istemcisi aracılığıyla Twitch'in sohbet (IRC) arayüzü üzerinden Twitch sohbeti desteği. OpenClaw, bir Twitch bot hesabıyla oturum açar, yapılandırılmış her hesap için bir kanala katılır ve o kanalda yanıt verir.

## Kurulum

Twitch, resmi bir Plugin olarak sunulur; çekirdek kurulumun parçası değildir.

<Tabs>
  <Tab title="npm kayıt deposu">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="Yerel çalışma kopyası">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

`plugins install`, Plugin'i kaydeder ve etkinleştirir. `openclaw onboard` veya `openclaw channels add` sırasında Twitch'in seçilmesi, Plugin'i gerektiğinde kurar. Güncel sürümü takip etmek için yalnızca paket adını kullanın; tam sürümü yalnızca tekrarlanabilir kurulumlar için sabitleyin. OpenClaw 2026.4.10 veya daha yeni bir sürüm gerektirir.

Ayrıntılar: [Plugin'ler](/tr/tools/plugin)

## Hızlı kurulum

<Steps>
  <Step title="Plugin'i kurun">
    Yukarıdaki [Kurulum](#install) bölümüne bakın.
  </Step>
  <Step title="Bir Twitch bot hesabı oluşturun">
    Bot için özel bir Twitch hesabı oluşturun (veya mevcut bir hesabı kullanın).
  </Step>
  <Step title="Kimlik bilgilerini oluşturun">
    [Twitch Token Generator](https://twitchtokengenerator.com/) aracını kullanın:

    - **Bot Token** seçeneğini seçin
    - `chat:read` ve `chat:write` kapsamlarının seçili olduğunu doğrulayın
    - **Client ID** ve **Access Token** değerlerini kopyalayın

  </Step>
  <Step title="Twitch kullanıcı kimliğinizi bulun">
    Bir kullanıcı adını Twitch kullanıcı kimliğine dönüştürmek için [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) aracını kullanın.
  </Step>
  <Step title="Belirteci yapılandırın">
    - Ortam değişkeni: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (yalnızca varsayılan hesap)
    - Veya yapılandırma: `channels.twitch.accessToken`

    Her ikisi de ayarlanırsa yapılandırma önceliklidir (ortam değişkeni yalnızca varsayılan hesap için yedek seçenektir).

  </Step>
  <Step title="Gateway'i başlatın">
    ```bash
    openclaw gateway run
    ```
  </Step>
</Steps>

<Warning>
Yetkisiz kullanıcıların botu tetiklemesini önlemek için erişim denetimi (`allowFrom` veya `allowedRoles`) ekleyin. `requireMention` varsayılan olarak `true` değerindedir.
</Warning>

Asgari yapılandırma:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Botun Twitch hesabı (kimlik doğrulaması yapar)
      accessToken: "oauth:abc123...", // OAuth erişim belirteci (veya OPENCLAW_TWITCH_ACCESS_TOKEN ortam değişkenini kullanın)
      clientId: "xyz789...", // Token Generator tarafından sağlanan istemci kimliği
      channel: "yourchannel", // Katılınacak Twitch kanalının sohbeti (zorunlu)
      allowFrom: ["123456789"], // (önerilir) Yalnızca Twitch kullanıcı kimliğiniz
    },
  },
}
```

## Nedir?

- Gateway'e ait bir Twitch kanalıdır.
- Belirlenimci yönlendirme: yanıtlar her zaman iletinin geldiği Twitch kanalına geri gönderilir.
- Katılınan her kanal, yalıtılmış bir grup oturumu anahtarıyla eşleşir: `agent:<agentId>:twitch:group:<channel>`.
- `username`, botun hesabıdır (kimlik doğrulaması yapan hesap); `channel` ise katılınacak sohbet odasıdır. Her hesap girdisi tam olarak bir kanala katılır.
- Belirteçler `oauth:` önekiyle veya bu önek olmadan çalışır; OpenClaw her iki biçimi de normalleştirir (kurulum sihirbazı `oauth:` biçimini bekler).

## Belirteç yenileme (isteğe bağlı)

[Twitch Token Generator](https://twitchtokengenerator.com/) tarafından oluşturulan belirteçler OpenClaw tarafından yenilenemez; süreleri dolduğunda yeniden oluşturun (birkaç saat geçerlidirler; uygulama kaydı gerekmez).

Otomatik yenileme için [Twitch Developer Console](https://dev.twitch.tv/console) üzerinden kendi uygulamanızı oluşturun ve şunları ekleyin:

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

Her ikisi de ayarlandığında Plugin, belirteçleri süreleri dolmadan yenileyen bir kimlik doğrulama sağlayıcısı kullanır ve her yenilemeyi günlüğe kaydeder. `refreshToken` olmadan `token refresh disabled (no refresh token)` iletisini günlüğe kaydeder; `clientSecret` olmadan statik (yenilenmeyen) belirtece geri döner.

## Çoklu hesap desteği

Her hesaba özgü kimlik bilgileriyle `channels.twitch.accounts` kullanın. Ortak kalıp için [Yapılandırma](/tr/gateway/configuration) bölümüne bakın.

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
          channel: "yourchannel",
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
Her hesap girdisinin kendi `accessToken` değeri gerekir (ortam değişkeni yalnızca varsayılan hesabı kapsar). Bir hesap tam olarak bir kanala katılır; dolayısıyla iki kanala katılmak iki hesap gerektirir. `channels.twitch.defaultAccount`, hangi hesabın varsayılan olacağını belirler.
</Note>

## Erişim denetimi

`allowFrom`, Twitch kullanıcı kimliklerinden oluşan katı bir izin listesidir. Ayarlandığında `allowedRoles` yok sayılır; bunun yerine rol tabanlı erişimi kullanmak için `allowFrom` değerini ayarlamayın.

**Kullanılabilir roller:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

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
  </Tab>
  <Tab title="@bahsetme gereksinimini devre dışı bırak">
    Varsayılan olarak `requireMention`, `true` değerindedir. İzin verilen tüm iletilere yanıt vermek için:

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

<Note>
**Neden kullanıcı kimlikleri?** Kullanıcı adları değişebilir ve bu durum kimliğe bürünmeye olanak tanır. Kullanıcı kimlikleri kalıcıdır.

Kendi kimliğinizi [kullanıcı adından kimliğe dönüştürücü](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) ile bulun.
</Note>

## Sorun giderme

Öncelikle tanılama komutlarını çalıştırın:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Bot iletilere yanıt vermiyor">
    - **Erişim denetimini kontrol edin:** Kullanıcı kimliğinizin `allowFrom` içinde olduğundan emin olun veya test etmek için `allowFrom` değerini geçici olarak kaldırıp `allowedRoles: ["all"]` ayarlayın.
    - **Bahsetme geçidini kontrol edin:** `requireMention: true` (varsayılan) olduğunda iletiler botun kullanıcı adından @bahsetmelidir.
    - **Botun kanalda olduğunu kontrol edin:** Bot yalnızca `channel` içinde adı belirtilen kanala katılır.

  </Accordion>
  <Accordion title="Belirteç sorunları">
    "Bağlantı kurulamadı" veya kimlik doğrulama hataları:

    - `accessToken` değerinin OAuth erişim belirteci olduğundan emin olun (`oauth:` öneki isteğe bağlıdır)
    - Belirtecin `chat:read` ve `chat:write` kapsamlarına sahip olduğunu kontrol edin
    - Belirteç yenilemeyi kullanıyorsanız `clientSecret` ve `refreshToken` değerlerinin ayarlandığını doğrulayın

  </Accordion>
  <Accordion title="Belirteç yenileme çalışmıyor">
    Yenileme olayları için günlükleri kontrol edin:

    ```text
    mybot için ortam belirteci kaynağı kullanılıyor
    123456 kullanıcısının erişim belirteci yenilendi (14400 sn içinde sona erecek)
    ```

    `token refresh disabled (no refresh token)` iletisini görürseniz:

    - `clientSecret` değerinin sağlandığından emin olun
    - `refreshToken` değerinin sağlandığından emin olun

  </Accordion>
</AccordionGroup>

## Yapılandırma

### Hesap yapılandırması

<ParamField path="username" type="string" required>
  Bot kullanıcı adı (kimlik doğrulaması yapan hesap).
</ParamField>
<ParamField path="accessToken" type="string" required>
  `chat:read` ve `chat:write` kapsamlarına sahip OAuth erişim belirteci (varsayılan hesap için yapılandırma veya ortam değişkeni).
</ParamField>
<ParamField path="clientId" type="string" required>
  Twitch istemci kimliği (Token Generator veya uygulamanız tarafından sağlanır). Şemada isteğe bağlıdır ancak bağlantı kurmak için zorunludur.
</ParamField>
<ParamField path="channel" type="string" required>
  Katılınacak kanal.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  Bu hesabı etkinleştirin.
</ParamField>
<ParamField path="clientSecret" type="string">
  İsteğe bağlı: otomatik belirteç yenileme için.
</ParamField>
<ParamField path="refreshToken" type="string">
  İsteğe bağlı: otomatik belirteç yenileme için.
</ParamField>
<ParamField path="expiresIn" type="number">
  Belirtecin saniye cinsinden sona erme süresi (yenileme takibi).
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Belirtecin alındığı zaman damgası (yenileme takibi).
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Kullanıcı kimliği izin listesi. Ayarlandığında roller yok sayılır.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Rol tabanlı erişim denetimi.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  Botu tetiklemek için @bahsetme gerektir.
</ParamField>
<ParamField path="responsePrefix" type="string">
  Bu hesap için giden yanıt öneki geçersiz kılma değeri.
</ParamField>

### Sağlayıcı seçenekleri

- `channels.twitch.enabled` - Kanal başlangıcını etkinleştirir/devre dışı bırakır
- `channels.twitch.username` / `accessToken` / `clientId` / `channel` - Basitleştirilmiş tek hesap yapılandırması (örtük `default` hesap; `accounts.default` değerinden önceliklidir)
- `channels.twitch.accounts.<accountName>` - Çoklu hesap yapılandırması (yukarıdaki tüm hesap alanları)
- `channels.twitch.defaultAccount` - Varsayılan olacak hesap adı
- `channels.twitch.markdown.tables` - Markdown tablo oluşturma modu (`off` | `bullets` | `code` | `block`)

Tam örnek:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "yourchannel",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      accounts: {
        second: {
          username: "mybot",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "your_channel",
          enabled: true,
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Araç eylemleri

Aracı, ileti aracının `send` eylemi üzerinden Twitch iletileri gönderebilir:

```json5
{
  channel: "twitch",
  action: "send",
  to: "#mychannel",
  message: "Merhaba Twitch!",
}
```

`to` isteğe bağlıdır ve varsayılan olarak hesabın yapılandırılmış `channel` değerini kullanır.

## Güvenlik ve işletim

- **Belirteçlere parola gibi davranın** - belirteçleri asla git'e kaydetmeyin.
- Uzun süre çalışan botlar için **otomatik belirteç yenilemeyi kullanın**.
- Erişim denetimi için kullanıcı adları yerine **kullanıcı kimliği izin listelerini kullanın**.
- Belirteç yenileme olayları ve bağlantı durumu için **günlükleri izleyin**.
- **Belirteç kapsamlarını asgari düzeyde tutun** - yalnızca `chat:read` ve `chat:write` kapsamlarını isteyin.
- **Takılırsanız**: oturumun başka bir sürece ait olmadığını doğruladıktan sonra Gateway'i yeniden başlatın.

## Sınırlar

- İleti başına **500 karakter**; daha uzun yanıtlar sözcük sınırlarından parçalara ayrılır.
- Gönderimden önce Markdown kaldırılır (Twitch sohbeti düz metindir; yeni satırlar boşluğa dönüştürülür).
- OpenClaw kendi hız sınırlamasını eklemez; Twitch hız sınırlarını Twurple sohbet istemcisi yönetir.

## İlgili konular

- [Kanal Yönlendirme](/tr/channels/channel-routing) — iletiler için oturum yönlendirmesi
- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme geçidi
- [Eşleştirme](/tr/channels/pairing) — doğrudan ileti kimlik doğrulaması ve eşleştirme akışı
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
