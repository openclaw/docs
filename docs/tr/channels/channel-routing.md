---
read_when:
    - Kanal yönlendirmesini veya gelen kutusu davranışını değiştirme
summary: Kanal başına yönlendirme kuralları (WhatsApp, Telegram, Discord, Slack) ve paylaşılan bağlam
title: Kanal yönlendirme
x-i18n:
    generated_at: "2026-05-02T08:46:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a752696e70d2c13d3ab1c9cedd41442e0d8aee6d78b3a069b53dd2b262174da
    source_path: channels/channel-routing.md
    workflow: 16
---

# Kanallar ve yönlendirme

OpenClaw yanıtları **mesajın geldiği kanala geri** yönlendirir. Model bir kanal seçmez; yönlendirme deterministiktir ve host yapılandırması tarafından kontrol edilir.

## Temel terimler

- **Kanal**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`, ayrıca Plugin kanalları. `webchat`, dahili WebChat UI kanalıdır ve yapılandırılabilir bir giden kanal değildir.
- **AccountId**: kanal başına hesap örneği (desteklendiğinde).
- İsteğe bağlı kanal varsayılan hesabı: `channels.<channel>.defaultAccount`, bir giden yol `accountId` belirtmediğinde hangi hesabın kullanılacağını seçer.
  - Çok hesaplı kurulumlarda, iki veya daha fazla hesap yapılandırıldığında açık bir varsayılan (`defaultAccount` veya `accounts.default`) ayarlayın. Bu olmazsa, geri dönüş yönlendirmesi ilk normalleştirilmiş hesap ID'sini seçebilir.
- **AgentId**: yalıtılmış bir çalışma alanı + oturum deposu (“beyin”).
- **SessionKey**: bağlamı depolamak ve eşzamanlılığı kontrol etmek için kullanılan kova anahtarı.

## Giden hedef önekleri

Açık giden hedefler, `telegram:123` veya `tg:123` gibi bir sağlayıcı öneki içerebilir. Core, bu öneki yalnızca seçili kanal `last` olduğunda veya başka şekilde çözümlenmediğinde ve yalnızca yüklü Plugin bu öneği duyurduğunda kanal seçimi ipucu olarak ele alır. Çağıran zaten açık bir kanal seçmişse, sağlayıcı öneki bu kanalla eşleşmelidir; `telegram:123` hedefine WhatsApp teslimi gibi kanallar arası kombinasyonlar, Plugin'e özgü hedef normalleştirmesinden önce başarısız olur.

`channel:<id>`, `user:<id>`, `room:<id>`, `thread:<id>`, `imessage:<handle>` ve `sms:<number>` gibi hedef türü ve hizmet önekleri seçili kanalın grameri içinde kalır. Bunlar sağlayıcıyı tek başlarına seçmez.

## Oturum anahtarı biçimleri (örnekler)

Doğrudan mesajlar varsayılan olarak agent'ın **main** oturumuna daraltılır:

- `agent:<agentId>:<mainKey>` (varsayılan: `agent:main:main`)

Doğrudan mesaj konuşma geçmişi main ile paylaşılsa bile, sandbox ve araç ilkesi harici DM'ler için hesap başına türetilmiş bir doğrudan sohbet çalışma zamanı anahtarı kullanır; böylece kanal kaynaklı mesajlar local main-session çalıştırmaları gibi ele alınmaz.

Gruplar ve kanallar kanal başına yalıtılmış kalır:

- Gruplar: `agent:<agentId>:<channel>:group:<id>`
- Kanallar/odalar: `agent:<agentId>:<channel>:channel:<id>`

Thread'ler:

- Slack/Discord thread'leri temel anahtara `:thread:<threadId>` ekler.
- Telegram forum konuları grup anahtarına `:topic:<topicId>` yerleştirir.

Örnekler:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Ana DM rota sabitleme

`session.dmScope` değeri `main` olduğunda, doğrudan mesajlar tek bir main oturumu paylaşabilir. Oturumun `lastRoute` değerinin sahip olmayan DM'ler tarafından üzerine yazılmasını önlemek için OpenClaw, aşağıdakilerin tamamı doğru olduğunda `allowFrom` üzerinden sabitlenmiş bir sahip çıkarımı yapar:

- `allowFrom` tam olarak bir joker karakter olmayan girdiye sahiptir.
- Girdi, o kanal için somut bir gönderici ID'sine normalleştirilebilir.
- Gelen DM göndereni, sabitlenmiş sahip ile eşleşmez.

Bu eşleşmeme durumunda OpenClaw yine de gelen oturum meta verilerini kaydeder, ancak main oturum `lastRoute` güncellemesini atlar.

## Korumalı gelen kayıt

Kanal Plugin'leri, korumalı bir yolun yeni bir OpenClaw oturumu oluşturmaması gerektiğinde gelen oturum kaydını `createIfMissing: false` olarak işaretleyebilir. Bu modda OpenClaw, mevcut bir oturum için meta verileri ve `lastRoute` değerini güncelleyebilir, ancak yalnızca bir mesaj gözlemlendi diye salt rota amaçlı bir oturum girdisi oluşturmaz.

## Yönlendirme kuralları (bir agent nasıl seçilir)

Yönlendirme, her gelen mesaj için **tek bir agent** seçer:

1. **Tam eş eşleşmesi** (`peer.kind` + `peer.id` ile `bindings`).
2. **Üst eş eşleşmesi** (thread kalıtımı).
3. **Guild + rol eşleşmesi** (Discord) `guildId` + `roles` üzerinden.
4. **Guild eşleşmesi** (Discord) `guildId` üzerinden.
5. **Takım eşleşmesi** (Slack) `teamId` üzerinden.
6. **Hesap eşleşmesi** (kanaldaki `accountId`).
7. **Kanal eşleşmesi** (o kanaldaki herhangi bir hesap, `accountId: "*"`).
8. **Varsayılan agent** (`agents.list[].default`, yoksa ilk liste girdisi, geri dönüş olarak `main`).

Bir binding birden fazla eşleşme alanı (`peer`, `guildId`, `teamId`, `roles`) içerdiğinde, o binding'in uygulanması için **sağlanan tüm alanlar eşleşmelidir**.

Eşleşen agent, hangi çalışma alanının ve oturum deposunun kullanılacağını belirler.

## Yayın grupları (birden fazla agent çalıştırma)

Yayın grupları, OpenClaw normalde yanıt vereceği zaman aynı eş için **birden fazla agent** çalıştırmanıza olanak tanır (örneğin: WhatsApp gruplarında, mention/activation geçitlemesinden sonra).

Yapılandırma:

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

Bkz.: [Yayın Grupları](/tr/channels/broadcast-groups).

## Yapılandırmaya genel bakış

- `agents.list`: adlandırılmış agent tanımları (çalışma alanı, model vb.).
- `bindings`: gelen kanalları/hesapları/eşleri agent'lara eşler.

Örnek:

```json5
{
  agents: {
    list: [{ id: "support", name: "Support", workspace: "~/.openclaw/workspace-support" }],
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

## Oturum depolama

Oturum depoları durum dizini altında bulunur (varsayılan `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL transcript'leri deponun yanında bulunur

Depo yolunu `session.store` ve `{agentId}` şablonlaması ile geçersiz kılabilirsiniz.

Gateway ve ACP oturum keşfi ayrıca varsayılan `agents/` kökü altındaki ve şablonlanmış `session.store` kökleri altındaki disk destekli agent depolarını tarar. Keşfedilen depolar, çözümlenen agent kökünün içinde kalmalı ve normal bir `sessions.json` dosyası kullanmalıdır. Symlink'ler ve kök dışı yollar yok sayılır.

## WebChat davranışı

WebChat **seçili agent'a** bağlanır ve varsayılan olarak agent'ın main oturumunu kullanır. Bu nedenle WebChat, o agent için kanallar arası bağlamı tek bir yerde görmenizi sağlar.

## Yanıt bağlamı

Gelen yanıtlar şunları içerir:

- Kullanılabiliyorsa `ReplyToId`, `ReplyToBody` ve `ReplyToSender`.
- Alıntılanan bağlam, `Body` alanına `[Replying to ...]` bloğu olarak eklenir.

Bu, kanallar arasında tutarlıdır.

## İlgili

- [Gruplar](/tr/channels/groups)
- [Yayın grupları](/tr/channels/broadcast-groups)
- [Eşleştirme](/tr/channels/pairing)
