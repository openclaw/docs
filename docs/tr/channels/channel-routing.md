---
read_when:
    - Kanal yönlendirmesini veya gelen kutusu davranışını değiştirme
summary: Kanal bazında yönlendirme kuralları (WhatsApp, Telegram, Discord, Slack) ve paylaşılan bağlam
title: Kanal yönlendirme
x-i18n:
    generated_at: "2026-04-30T09:05:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: c43347048fcfd137cc3a0b2cfdc4cf36426fdcf9645f2d1a05ce9cf49688cf0d
    source_path: channels/channel-routing.md
    workflow: 16
---

# Kanallar ve yönlendirme

OpenClaw yanıtları **mesajın geldiği kanala geri** yönlendirir. Model
kanal seçmez; yönlendirme deterministiktir ve ana makine yapılandırması
tarafından denetlenir.

## Temel terimler

- **Kanal**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`, artı Plugin kanalları. `webchat`, dahili WebChat kullanıcı arayüzü kanalıdır ve yapılandırılabilir bir giden kanal değildir.
- **AccountId**: kanal başına hesap örneği (desteklendiğinde).
- İsteğe bağlı kanal varsayılan hesabı: `channels.<channel>.defaultAccount`, bir giden yol `accountId` belirtmediğinde
  hangi hesabın kullanılacağını seçer.
  - Çok hesaplı kurulumlarda, iki veya daha fazla hesap yapılandırıldığında açık bir varsayılan (`defaultAccount` veya `accounts.default`) ayarlayın. Bu olmadan, yedek yönlendirme ilk normalize edilmiş hesap kimliğini seçebilir.
- **AgentId**: yalıtılmış bir çalışma alanı + oturum deposu (“beyin”).
- **SessionKey**: bağlamı depolamak ve eşzamanlılığı denetlemek için kullanılan kova anahtarı.

## Oturum anahtarı biçimleri (örnekler)

Doğrudan mesajlar varsayılan olarak ajanın **main** oturumuna daraltılır:

- `agent:<agentId>:<mainKey>` (varsayılan: `agent:main:main`)

Doğrudan mesaj konuşma geçmişi main ile paylaşılsa bile, sanal alan ve
araç ilkesi, harici DM'ler için hesap başına türetilmiş bir doğrudan sohbet
çalışma zamanı anahtarı kullanır; böylece kanaldan kaynaklanan mesajlar yerel
main oturum çalıştırmaları gibi değerlendirilmez.

Gruplar ve kanallar, kanal başına yalıtılmış kalır:

- Gruplar: `agent:<agentId>:<channel>:group:<id>`
- Kanallar/odalar: `agent:<agentId>:<channel>:channel:<id>`

İş parçacıkları:

- Slack/Discord iş parçacıkları, temel anahtara `:thread:<threadId>` ekler.
- Telegram forum konuları, grup anahtarına `:topic:<topicId>` gömer.

Örnekler:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Ana DM rota sabitleme

`session.dmScope` değeri `main` olduğunda, doğrudan mesajlar tek bir main oturumunu paylaşabilir.
Oturumun `lastRoute` değerinin sahip olmayan DM'ler tarafından üzerine yazılmasını önlemek için,
aşağıdakilerin tümü doğru olduğunda OpenClaw `allowFrom` üzerinden sabitlenmiş bir sahibi çıkarır:

- `allowFrom` tam olarak bir joker olmayan girişe sahiptir.
- Giriş, ilgili kanal için somut bir gönderen kimliğine normalize edilebilir.
- Gelen DM göndereni, sabitlenmiş bu sahip ile eşleşmez.

Bu uyumsuzluk durumunda OpenClaw yine de gelen oturum meta verilerini kaydeder, ancak
main oturum `lastRoute` değerini güncellemeyi atlar.

## Korumalı gelen kayıt

Kanal Plugin'leri, korumalı bir yol yeni bir OpenClaw oturumu oluşturmamalıysa gelen oturum kaydını `createIfMissing: false`
olarak işaretleyebilir. Bu modda,
OpenClaw mevcut bir oturum için meta verileri ve `lastRoute` değerini güncelleyebilir, ancak
yalnızca bir mesaj gözlemlendi diye sadece rota amaçlı bir oturum girdisi oluşturmaz.

## Yönlendirme kuralları (bir ajan nasıl seçilir)

Yönlendirme, her gelen mesaj için **bir ajan** seçer:

1. **Tam eşleşen eş** (`peer.kind` + `peer.id` ile `bindings`).
2. **Üst eş eşleşmesi** (iş parçacığı kalıtımı).
3. **Sunucu + roller eşleşmesi** (Discord) `guildId` + `roles` üzerinden.
4. **Sunucu eşleşmesi** (Discord) `guildId` üzerinden.
5. **Ekip eşleşmesi** (Slack) `teamId` üzerinden.
6. **Hesap eşleşmesi** (kanalda `accountId`).
7. **Kanal eşleşmesi** (o kanaldaki herhangi bir hesap, `accountId: "*"`).
8. **Varsayılan ajan** (`agents.list[].default`, yoksa ilk liste girdisi, yedek olarak `main`).

Bir bağlama birden çok eşleşme alanı (`peer`, `guildId`, `teamId`, `roles`) içerdiğinde, bu bağlamanın uygulanması için **sağlanan tüm alanlar eşleşmelidir**.

Eşleşen ajan, hangi çalışma alanının ve oturum deposunun kullanılacağını belirler.

## Yayın grupları (birden çok ajan çalıştırma)

Yayın grupları, OpenClaw normalde yanıt verecekken **aynı eş için** **birden çok ajan** çalıştırmanızı sağlar (örneğin: WhatsApp gruplarında, bahsetme/etkinleştirme kapısından sonra).

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
- `bindings`: gelen kanalları/hesapları/eşleri ajanlarla eşler.

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
- JSONL dökümleri deponun yanında bulunur

Depo yolunu `session.store` ve `{agentId}` şablonlamasıyla geçersiz kılabilirsiniz.

Gateway ve ACP oturum keşfi ayrıca varsayılan `agents/` kökü altında ve şablonlanmış `session.store` kökleri altında
disk destekli ajan depolarını tarar. Keşfedilen
depolar, çözümlenen bu ajan kökünün içinde kalmalı ve normal bir
`sessions.json` dosyası kullanmalıdır. Sembolik bağlantılar ve kök dışı yollar yok sayılır.

## WebChat davranışı

WebChat **seçili ajana** bağlanır ve varsayılan olarak ajanın main
oturumunu kullanır. Bu nedenle WebChat, ilgili ajan için kanallar arası bağlamı
tek bir yerde görmenizi sağlar.

## Yanıt bağlamı

Gelen yanıtlara şunlar dahildir:

- Kullanılabilir olduğunda `ReplyToId`, `ReplyToBody` ve `ReplyToSender`.
- Alıntılanan bağlam, `Body` alanına `[Replying to ...]` bloğu olarak eklenir.

Bu, kanallar genelinde tutarlıdır.

## İlgili

- [Gruplar](/tr/channels/groups)
- [Yayın grupları](/tr/channels/broadcast-groups)
- [Eşleştirme](/tr/channels/pairing)
