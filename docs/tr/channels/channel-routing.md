---
read_when:
    - Kanal yönlendirmesini veya gelen kutusu davranışını değiştirme
summary: Kanal başına yönlendirme kuralları (WhatsApp, Telegram, Discord, Slack) ve paylaşılan bağlam
title: Kanal yönlendirme
x-i18n:
    generated_at: "2026-05-06T09:02:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92b14cf02b00312121bec2f0f8ec784f36364babd6085d684e71f425dd82715e
    source_path: channels/channel-routing.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Kanallar ve yönlendirme

OpenClaw yanıtları **mesajın geldiği kanala geri** yönlendirir. Model kanal seçmez; yönlendirme deterministiktir ve host yapılandırması tarafından kontrol edilir.

## Temel terimler

- **Kanal**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line` ve Plugin kanalları. `webchat`, dahili WebChat UI kanalıdır ve yapılandırılabilir bir giden kanal değildir.
- **AccountId**: kanal başına hesap örneği (desteklendiğinde).
- İsteğe bağlı kanal varsayılan hesabı: `channels.<channel>.defaultAccount`, giden yol `accountId` belirtmediğinde hangi hesabın kullanılacağını seçer.
  - Çok hesaplı kurulumlarda, iki veya daha fazla hesap yapılandırıldığında açık bir varsayılan (`defaultAccount` veya `accounts.default`) ayarlayın. Bu olmadan, yedek yönlendirme ilk normalleştirilmiş hesap kimliğini seçebilir.
- **AgentId**: yalıtılmış bir çalışma alanı + oturum deposu ("beyin").
- **SessionKey**: bağlamı depolamak ve eşzamanlılığı denetlemek için kullanılan kova anahtarı.

## Giden hedef önekleri

Açık giden hedefler, `telegram:123` veya `tg:123` gibi bir sağlayıcı öneki içerebilir. Core bu öneki, yalnızca seçili kanal `last` olduğunda veya başka şekilde çözümlenmemiş olduğunda ve yalnızca yüklenen Plugin bu öneki duyurduğunda kanal seçimi ipucu olarak ele alır. Çağıran zaten açık bir kanal seçtiyse, sağlayıcı öneki bu kanalla eşleşmelidir; WhatsApp teslimatının `telegram:123` hedefine yapılması gibi kanallar arası birleşimler, Plugin'e özgü hedef normalleştirmesinden önce başarısız olur.

`channel:<id>`, `user:<id>`, `room:<id>`, `thread:<id>`, `imessage:<handle>` ve `sms:<number>` gibi hedef türü ve hizmet önekleri seçili kanalın grameri içinde kalır. Sağlayıcıyı kendi başlarına seçmezler.

## Oturum anahtarı biçimleri (örnekler)

Doğrudan mesajlar varsayılan olarak ajanın **main** oturumuna indirgenir:

- `agent:<agentId>:<mainKey>` (varsayılan: `agent:main:main`)

Doğrudan mesaj konuşma geçmişi main ile paylaşılsa bile, sandbox ve araç ilkesi harici DM'ler için hesap başına türetilmiş bir doğrudan sohbet çalışma zamanı anahtarı kullanır; böylece kanal kaynaklı mesajlar yerel main-session çalıştırmaları gibi ele alınmaz.

Gruplar ve kanallar, kanal başına yalıtılmış kalır:

- Gruplar: `agent:<agentId>:<channel>:group:<id>`
- Kanallar/odalar: `agent:<agentId>:<channel>:channel:<id>`

Thread'ler:

- Slack/Discord thread'leri temel anahtara `:thread:<threadId>` ekler.
- Telegram forum konuları grup anahtarına `:topic:<topicId>` yerleştirir.

Örnekler:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Ana DM rota sabitleme

`session.dmScope` değeri `main` olduğunda, doğrudan mesajlar tek bir main oturumunu paylaşabilir. Oturumun `lastRoute` değerinin sahip olmayan DM'ler tarafından üzerine yazılmasını önlemek için OpenClaw, aşağıdakilerin tümü doğru olduğunda `allowFrom` değerinden sabitlenmiş bir sahip çıkarır:

- `allowFrom` tam olarak bir joker olmayan girişe sahiptir.
- Giriş, o kanal için somut bir gönderici kimliğine normalleştirilebilir.
- Gelen DM göndericisi bu sabitlenmiş sahiple eşleşmez.

Bu eşleşmeme durumunda OpenClaw yine gelen oturum meta verilerini kaydeder, ancak main oturum `lastRoute` değerini güncellemeyi atlar.

## Korumalı gelen kayıt

Kanal Plugin'leri, korumalı bir yol yeni bir OpenClaw oturumu oluşturmamalıysa gelen oturum kaydını `createIfMissing: false` olarak işaretleyebilir. Bu modda OpenClaw, mevcut bir oturum için meta verileri ve `lastRoute` değerini güncelleyebilir, ancak yalnızca bir mesaj gözlemlendi diye sadece rota içeren bir oturum girdisi oluşturmaz.

## Yönlendirme kuralları (ajan nasıl seçilir)

Yönlendirme, her gelen mesaj için **bir ajan** seçer:

1. **Tam eş eşleşmesi** (`peer.kind` + `peer.id` ile `bindings`).
2. **Üst eş eşleşmesi** (thread kalıtımı).
3. **Guild + roller eşleşmesi** (Discord) `guildId` + `roles` aracılığıyla.
4. **Guild eşleşmesi** (Discord) `guildId` aracılığıyla.
5. **Takım eşleşmesi** (Slack) `teamId` aracılığıyla.
6. **Hesap eşleşmesi** (kanaldaki `accountId`).
7. **Kanal eşleşmesi** (o kanaldaki herhangi bir hesap, `accountId: "*"`).
8. **Varsayılan ajan** (`agents.list[].default`, yoksa ilk liste girdisi, yedek olarak `main`).

Bir binding birden fazla eşleşme alanı (`peer`, `guildId`, `teamId`, `roles`) içerdiğinde, o binding'in uygulanması için **sağlanan tüm alanlar eşleşmelidir**.

Eşleşen ajan hangi çalışma alanının ve oturum deposunun kullanılacağını belirler.

## Yayın grupları (birden fazla ajan çalıştırma)

Yayın grupları, aynı eş için **birden fazla ajan** çalıştırmanıza olanak tanır; bu, **OpenClaw normalde yanıt vereceğinde** gerçekleşir (örneğin: WhatsApp gruplarında, bahsetme/etkinleştirme geçidinden sonra).

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

## Yapılandırma özeti

- `agents.list`: adlandırılmış ajan tanımları (çalışma alanı, model vb.).
- `bindings`: gelen kanalları/hesapları/eşleri ajanlara eşler.

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

Oturum depoları durum dizininin altında bulunur (varsayılan `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL transkriptleri de deponun yanında bulunur

Depo yolunu `session.store` ve `{agentId}` şablonlaması ile geçersiz kılabilirsiniz.

Gateway ve ACP oturum keşfi, varsayılan `agents/` kökü altında ve şablonlanmış `session.store` kökleri altında disk destekli ajan depolarını da tarar. Keşfedilen depolar, çözümlenen ajan kökünün içinde kalmalı ve normal bir `sessions.json` dosyası kullanmalıdır. Sembolik bağlantılar ve kök dışı yollar yok sayılır.

## WebChat davranışı

WebChat, **seçili ajana** bağlanır ve varsayılan olarak ajanın main oturumunu kullanır. Bu nedenle WebChat, o ajan için kanallar arası bağlamı tek yerde görmenizi sağlar.

## Yanıt bağlamı

Gelen yanıtlar şunları içerir:

- Kullanılabilir olduğunda `ReplyToId`, `ReplyToBody` ve `ReplyToSender`.
- Alıntılanan bağlam, `Body` öğesine `[Replying to ...]` bloğu olarak eklenir.

Bu, kanallar genelinde tutarlıdır.

## İlgili

- [Gruplar](/tr/channels/groups)
- [Yayın grupları](/tr/channels/broadcast-groups)
- [Eşleştirme](/tr/channels/pairing)
