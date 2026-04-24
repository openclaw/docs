---
read_when:
    - OpenClaw'ı IRC kanallarına veya DM'lere bağlamak istiyorsunuz
    - IRC izin listelerini, grup ilkesini veya bahsetme geçitlemesini yapılandırıyorsunuz
summary: IRC Plugin kurulumu, erişim denetimleri ve sorun giderme
title: IRC
x-i18n:
    generated_at: "2026-04-24T08:58:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 76f316c0f026d0387a97dc5dcb6d8967f6e4841d94b95b36e42f6f6284882a69
    source_path: channels/irc.md
    workflow: 15
---

OpenClaw'ı klasik kanallarda (`#oda`) ve doğrudan mesajlarda kullanmak istediğinizde IRC kullanın.
IRC, paketle birlikte gelen bir Plugin olarak sunulur, ancak ana yapılandırmada `channels.irc` altında yapılandırılır.

## Hızlı başlangıç

1. `~/.openclaw/openclaw.json` içinde IRC yapılandırmasını etkinleştirin.
2. En azından şunları ayarlayın:

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

Bot koordinasyonu için özel bir IRC sunucusu tercih edin. Bilerek herkese açık bir IRC ağı kullanıyorsanız yaygın seçenekler arasında Libera.Chat, OFTC ve Snoonet bulunur. Bot veya swarm arka kanal trafiği için tahmin edilebilir herkese açık kanallardan kaçının.

3. Gateway'i başlatın/yeniden başlatın:

```bash
openclaw gateway run
```

## Güvenlik varsayılanları

- `channels.irc.dmPolicy` varsayılan olarak `"pairing"` değerini kullanır.
- `channels.irc.groupPolicy` varsayılan olarak `"allowlist"` değerini kullanır.
- `groupPolicy="allowlist"` olduğunda izin verilen kanalları tanımlamak için `channels.irc.groups` ayarlayın.
- Bilerek düz metin taşımayı kabul etmiyorsanız TLS kullanın (`channels.irc.tls=true`).

## Erişim denetimi

IRC kanalları için iki ayrı “geçit” vardır:

1. **Kanal erişimi** (`groupPolicy` + `groups`): botun bir kanaldan gelen mesajları hiç kabul edip etmeyeceği.
2. **Gönderen erişimi** (`groupAllowFrom` / kanal başına `groups["#channel"].allowFrom`): o kanal içinde botu kimin tetikleyebileceği.

Yapılandırma anahtarları:

- DM izin listesi (DM gönderen erişimi): `channels.irc.allowFrom`
- Grup gönderen izin listesi (kanal gönderen erişimi): `channels.irc.groupAllowFrom`
- Kanal başına denetimler (kanal + gönderen + bahsetme kuralları): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` yapılandırılmamış kanallara izin verir (**varsayılan olarak yine de bahsetme geçitlemesine tabidir**)

İzin listesi girdileri kararlı gönderen kimliklerini kullanmalıdır (`nick!user@host`).
Yalın nick eşleştirmesi değişkendir ve yalnızca `channels.irc.dangerouslyAllowNameMatching: true` olduğunda etkinleştirilir.

### Yaygın tuzak: `allowFrom` DM'ler içindir, kanallar için değil

Şu tür günlükler görürseniz:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...bu, gönderenin **grup/kanal** mesajları için izinli olmadığı anlamına gelir. Bunu şu yollardan biriyle düzeltin:

- `channels.irc.groupAllowFrom` ayarlayın (tüm kanallar için genel), veya
- kanal başına gönderen izin listeleri ayarlayın: `channels.irc.groups["#channel"].allowFrom`

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

Bir kanala izin verilmiş olsa bile (`groupPolicy` + `groups` ile) ve gönderen izinli olsa bile OpenClaw, grup bağlamlarında varsayılan olarak **bahsetme geçitlemesi** kullanır.

Bu, mesaj botla eşleşen bir bahsetme deseni içermiyorsa `drop channel … (missing-mention)` gibi günlükler görebileceğiniz anlamına gelir.

Botun bir IRC kanalında **bahsetme gerekmeksizin** yanıt vermesini istiyorsanız, o kanal için bahsetme geçitlemesini devre dışı bırakın:

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

## Güvenlik notu (herkese açık kanallar için önerilir)

Herkese açık bir kanalda `allowFrom: ["*"]` kullanırsanız, herkes botu istemle tetikleyebilir.
Riski azaltmak için o kanalın araçlarını kısıtlayın.

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

`"*"` için daha sıkı, kendi nick'iniz için daha gevşek bir ilke uygulamak üzere `toolsBySender` kullanın:

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

- `toolsBySender` anahtarları IRC gönderen kimlik değerleri için `id:` kullanmalıdır:
  daha güçlü eşleştirme için `id:eigen` veya `id:eigen!~eigen@174.127.248.171`.
- Eski öneksiz anahtarlar hâlâ kabul edilir ve yalnızca `id:` olarak eşleştirilir.
- İlk eşleşen gönderen ilkesi kazanır; `"*"` joker yedektir.

Grup erişimi ile bahsetme geçitlemesi (ve bunların nasıl etkileştiği) hakkında daha fazla bilgi için bkz.: [/channels/groups](/tr/channels/groups).

## NickServ

Bağlantıdan sonra NickServ ile kimlik doğrulamak için:

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

Bağlantıda isteğe bağlı tek seferlik kayıt:

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

Tekrarlanan REGISTER denemelerini önlemek için nick kaydedildikten sonra `register` değerini devre dışı bırakın.

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

`IRC_HOST`, bir çalışma alanı `.env` dosyasından ayarlanamaz; bkz. [Çalışma alanı `.env` dosyaları](/tr/gateway/security).

## Sorun giderme

- Bot bağlanıyor ancak kanallarda hiç yanıt vermiyorsa `channels.irc.groups` ayarını **ve** bahsetme geçitlemesinin mesajları düşürüp düşürmediğini (`missing-mention`) doğrulayın. Ping olmadan yanıt vermesini istiyorsanız kanal için `requireMention:false` ayarlayın.
- Giriş başarısız oluyorsa nick'in kullanılabilirliğini ve sunucu parolasını doğrulayın.
- Özel bir ağda TLS başarısız oluyorsa ana bilgisayar/port ve sertifika kurulumunu doğrulayın.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Pairing](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme geçitlemesi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
