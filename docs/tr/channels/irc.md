---
read_when:
    - OpenClaw’ı IRC kanallarına veya DM’lere bağlamak istiyorsunuz
    - IRC izin listelerini, grup politikasını veya bahsetme denetimini yapılandırıyorsunuz
summary: IRC Plugin kurulumu, erişim denetimleri ve sorun giderme
title: IRC
x-i18n:
    generated_at: "2026-06-28T00:12:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7182796ff92f98bd1e6c24cbd456dd1037fa304e3fca4eee13f62eea8cd946f6
    source_path: channels/irc.md
    workflow: 16
---

Classic kanallarda (`#room`) ve doğrudan iletilerde OpenClaw kullanmak istediğinizde IRC kullanın.
Resmi IRC Plugin'ini yükleyin, ardından `channels.irc` altında yapılandırın.

## Hızlı başlangıç

1. Plugin'i yükleyin:

```bash
openclaw plugins install @openclaw/irc
```

2. `~/.openclaw/openclaw.json` içinde IRC yapılandırmasını etkinleştirin.
3. En azından şunları ayarlayın:

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.example.com",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

Bot koordinasyonu için özel bir IRC sunucusu tercih edin. Bilerek genel bir IRC ağı kullanıyorsanız yaygın seçenekler arasında Libera.Chat, OFTC ve Snoonet bulunur. Bot veya sürü arka kanal trafiği için tahmin edilebilir genel kanallardan kaçının.

4. Gateway'i başlatın/yeniden başlatın:

```bash
openclaw gateway run
```

## Güvenlik varsayılanları

- IRC, OpenClaw operatörü tarafından yönetilen ileri proxy yönlendirmesi dışında ham TCP/TLS soketleri kullanır. Tüm çıkış trafiğinin bu ileri proxy üzerinden geçmesini gerektiren dağıtımlarda, doğrudan IRC çıkışı açıkça onaylanmadıkça `channels.irc.enabled=false` ayarlayın.
- `channels.irc.dmPolicy` varsayılanı `"pairing"` değeridir.
- `channels.irc.groupPolicy` varsayılanı `"allowlist"` değeridir.
- `groupPolicy="allowlist"` ile izin verilen kanalları tanımlamak için `channels.irc.groups` ayarlayın.
- Düz metin aktarımı bilerek kabul etmiyorsanız TLS (`channels.irc.tls=true`) kullanın.

## Erişim denetimi

IRC kanalları için iki ayrı "geçit" vardır:

1. **Kanal erişimi** (`groupPolicy` + `groups`): botun bir kanaldan gelen iletileri hiç kabul edip etmeyeceği.
2. **Gönderen erişimi** (`groupAllowFrom` / kanal başına `groups["#channel"].allowFrom`): o kanalda botu tetiklemesine kimin izin verildiği.

Yapılandırma anahtarları:

- DM izin listesi (DM gönderen erişimi): `channels.irc.allowFrom`
- Grup gönderen izin listesi (kanal gönderen erişimi): `channels.irc.groupAllowFrom`
- Kanal başına denetimler (kanal + gönderen + bahsetme kuralları): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` yapılandırılmamış kanallara izin verir (**varsayılan olarak yine de bahsetme koşulludur**)

İzin listesi girdileri kararlı gönderen kimlikleri (`nick!user@host`) kullanmalıdır.
Yalın nick eşleştirmesi değiştirilebilir durumdadır ve yalnızca `channels.irc.dangerouslyAllowNameMatching: true` olduğunda etkinleştirilir.

### Yaygın tuzak: `allowFrom` kanallar için değil, DM'ler içindir

Şuna benzer günlükler görürseniz:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...bu, gönderenin **grup/kanal** iletileri için izinli olmadığı anlamına gelir. Şunlardan birini yaparak düzeltin:

- `channels.irc.groupAllowFrom` ayarlayın (tüm kanallar için global), veya
- kanal başına gönderen izin listelerini ayarlayın: `channels.irc.groups["#channel"].allowFrom`

Örnek (`#tuirc-dev` içindeki herkesin botla konuşmasına izin ver):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## Yanıt tetikleme (bahsetmeler)

Bir kanala izin verilmiş olsa (`groupPolicy` + `groups` aracılığıyla) ve gönderen izinli olsa bile OpenClaw grup bağlamlarında varsayılan olarak **bahsetme koşulu** uygular.

Bu, ileti botla eşleşen bir bahsetme kalıbı içermedikçe `drop channel … (missing-mention)` gibi günlükler görebileceğiniz anlamına gelir.

Botun bir IRC kanalında **bahsetme gerekmeksizin** yanıt vermesini sağlamak için o kanalda bahsetme koşulunu devre dışı bırakın:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

Ya da **tüm** IRC kanallarına izin vermek (kanal başına izin listesi olmadan) ve yine de bahsetme olmadan yanıt vermek için:

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## Güvenlik notu (genel kanallar için önerilir)

Genel bir kanalda `allowFrom: ["*"]` izni verirseniz herkes bota istem gönderebilir.
Riski azaltmak için o kanaldaki araçları kısıtlayın.

### Kanaldaki herkes için aynı araçlar

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### Gönderene göre farklı araçlar (sahip daha fazla yetki alır)

`"*"` için daha sıkı, nick'iniz için daha gevşek bir politika uygulamak üzere `toolsBySender` kullanın:

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

Notlar:

- `toolsBySender` anahtarları IRC gönderen kimliği değerleri için `id:` kullanmalıdır:
  daha güçlü eşleştirme için `id:eigen` veya `id:eigen!~eigen@174.127.248.171`.
- Eski ön eksiz anahtarlar hâlâ kabul edilir ve yalnızca `id:` olarak eşleştirilir.
- İlk eşleşen gönderen politikası kazanır; `"*"` joker yedektir.

Grup erişimi ile bahsetme koşulu (ve nasıl etkileştikleri) hakkında daha fazla bilgi için bkz.: [/channels/groups](/tr/channels/groups).

## NickServ

Bağlandıktan sonra NickServ ile kimlik doğrulamak için:

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

Bağlanırken isteğe bağlı tek seferlik kayıt:

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

Tekrarlanan REGISTER denemelerini önlemek için nick kaydedildikten sonra `register` ayarını devre dışı bırakın.

## Ortam değişkenleri

Varsayılan hesap şunları destekler:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (virgülle ayrılmış)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST` bir çalışma alanı `.env` dosyasından ayarlanamaz; bkz. [Çalışma alanı `.env` dosyaları](/tr/gateway/security).

## Sorun giderme

- Bot bağlanıyor ancak kanallarda hiç yanıt vermiyorsa `channels.irc.groups` ayarını **ve** bahsetme koşulunun iletileri düşürüp düşürmediğini (`missing-mention`) doğrulayın. Ping olmadan yanıt vermesini istiyorsanız kanal için `requireMention:false` ayarlayın.
- Oturum açma başarısız olursa nick kullanılabilirliğini ve sunucu parolasını doğrulayın.
- Özel bir ağda TLS başarısız olursa host/port ve sertifika kurulumunu doğrulayın.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme koşulu
- [Kanal Yönlendirme](/tr/channels/channel-routing) — iletiler için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sıkılaştırma
