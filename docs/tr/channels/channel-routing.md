---
read_when:
    - Kanal yönlendirmesini veya gelen kutusu davranışını değiştirme
summary: Kanal başına yönlendirme kuralları (WhatsApp, Telegram, Discord, Slack) ve paylaşılan bağlam
title: Kanal yönlendirme
x-i18n:
    generated_at: "2026-07-16T17:01:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4836671840e8c7919e7def8140d4a54fdeea17ddbe8c7a348ab5a23ff8b4213c
    source_path: channels/channel-routing.md
    workflow: 16
---

# Kanallar ve yönlendirme

OpenClaw, yanıtları **mesajın geldiği kanala geri** yönlendirir. Model bir kanal
seçmez; yönlendirme belirlenimseldir ve ana makine yapılandırması tarafından
denetlenir.

## Temel terimler

- **Kanal**: `discord`, `googlechat`, `imessage`, `irc`, `line`, `signal`, `slack`, `telegram` veya `whatsapp` gibi paketle birlikte gelen bir kanal plugini ve ayrıca yüklenmiş plugin kanalları. `webchat`, dahili WebChat kullanıcı arayüzü kanalıdır ve yapılandırılabilir bir giden kanal değildir.
- **AccountId**: kanal başına hesap örneği (destekleniyorsa).
- İsteğe bağlı kanal varsayılan hesabı: `channels.<channel>.defaultAccount`, bir giden yol `accountId` belirtmediğinde
  hangi hesabın kullanılacağını seçer.
  - Çok hesaplı kurulumlarda, iki veya daha fazla hesap yapılandırıldığında açık bir varsayılan (`defaultAccount` veya `default` adlı bir hesap) ayarlayın. Bu olmadan, geri dönüş yönlendirmesi normalleştirilmiş ilk hesap kimliğini seçebilir.
- **AgentId**: yalıtılmış bir çalışma alanı + oturum deposu ("beyin").
- **SessionKey**: bağlamı depolamak ve eşzamanlılığı denetlemek için kullanılan bölüm anahtarı.

## Giden hedef önekleri

Açık giden hedefler, `telegram:123` veya `tg:123` gibi bir sağlayıcı öneki içerebilir. Çekirdek, bu öneki yalnızca seçilen kanal `last` olduğunda veya başka şekilde çözümlenemediğinde ve yalnızca yüklenen plugin bu öneki bildirdiğinde kanal seçimi ipucu olarak değerlendirir. Çağıran zaten açık bir kanal seçmişse sağlayıcı öneki bu kanalla eşleşmelidir; WhatsApp üzerinden `telegram:123` hedefine teslimat gibi kanallar arası birleşimler, plugine özgü hedef normalleştirmesinden önce başarısız olur.

`channel:<id>`, `user:<id>`, `room:<id>`, `thread:<id>`, `imessage:<handle>` ve `sms:<number>` gibi hedef türü ve hizmet önekleri, seçilen kanalın dil bilgisi kapsamında kalır. Sağlayıcıyı tek başlarına seçmezler.

## Oturum anahtarı biçimleri (örnekler)

Doğrudan mesajlar varsayılan olarak aracının **ana** oturumunda birleştirilir:

- `agent:<agentId>:<mainKey>` (varsayılan: `agent:main:main`)

`session.dmScope`, doğrudan mesajların birleştirilmesini denetler: `main` (varsayılan) tek bir ana
oturumu paylaşırken `per-peer`, `per-channel-peer` ve `per-account-channel-peer`,
doğrudan mesajları ayrı oturumlarda tutar. Bir yol bağlaması, eşleşen eşleri için kapsamı
`bindings[].session.dmScope` aracılığıyla geçersiz kılabilir.

Doğrudan mesaj görüşme geçmişi ana oturumla paylaşılsa bile, korumalı alan ve
araç ilkesi harici doğrudan mesajlar için hesap başına türetilmiş bir doğrudan sohbet çalışma zamanı anahtarı kullanır;
böylece kanaldan gelen mesajlar yerel ana oturum çalıştırmaları gibi değerlendirilmez.

Gruplar ve kanallar, kanal başına yalıtılmış kalır:

- Gruplar: `agent:<agentId>:<channel>:group:<id>`
- Kanallar/odalar: `agent:<agentId>:<channel>:channel:<id>`

İleti dizileri:

- Slack/Discord ileti dizileri, temel anahtara `:thread:<threadId>` ekler.
- Telegram forum konuları, grup anahtarına `:topic:<topicId>` yerleştirir.

Örnekler:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Ana doğrudan mesaj yolunu sabitleme

`session.dmScope`, `main` olduğunda doğrudan mesajlar tek bir ana oturumu paylaşabilir.
Oturumun `lastRoute` değerinin sahip olmayan kişilerin doğrudan mesajlarıyla üzerine yazılmasını önlemek için
OpenClaw, aşağıdakilerin tümü doğru olduğunda `allowFrom` içinden sabitlenmiş bir sahip çıkarır:

- `allowFrom`, joker karakter olmayan tam olarak bir giriş içerir.
- Giriş, bu kanal için somut bir gönderici kimliğine normalleştirilebilir.
- Gelen doğrudan mesajın göndericisi, sabitlenmiş sahiple eşleşmez.

Bu eşleşmeme durumunda OpenClaw gelen oturum meta verilerini yine kaydeder ancak
ana oturumun `lastRoute` değerini güncellemeyi atlar.

## Korumalı gelen kayıt

Kanal pluginleri, korumalı bir yolun yeni bir OpenClaw oturumu oluşturmaması gerektiğinde
gelen bir oturum kaydını `createIfMissing: false` olarak işaretleyebilir. Bu modda
OpenClaw, mevcut bir oturum için meta verileri ve `lastRoute` değerini güncelleyebilir ancak
yalnızca bir mesaj gözlemlendiği için sadece yola ait bir oturum girdisi oluşturmaz.

## Yönlendirme kuralları (bir aracı nasıl seçilir)

Yönlendirme, her gelen mesaj için **bir aracı** seçer:

1. **Tam eş eşleşmesi** (`bindings` ile `peer.kind` + `peer.id`).
2. **Üst eş eşleşmesi** (ileti dizisi devralması).
3. **Eş joker karakteri eşleşmesi** (bir eş türü için `peer.id: "*"`).
4. **Sunucu + roller eşleşmesi** (Discord), `guildId` + `roles` aracılığıyla.
5. **Sunucu eşleşmesi** (Discord), `guildId` aracılığıyla.
6. **Takım eşleşmesi** (Slack), `teamId` aracılığıyla.
7. **Hesap eşleşmesi** (kanaldaki `accountId`).
8. **Kanal eşleşmesi** (bu kanaldaki herhangi bir hesap, `accountId: "*"`).
9. **Varsayılan aracı** (`agents.list[].default`, yoksa listedeki ilk giriş, geri dönüş olarak `main`).

Bir bağlama birden fazla eşleşme alanı (`peer`, `guildId`, `teamId`, `roles`) içerdiğinde, bu bağlamanın uygulanması için **sağlanan tüm alanların eşleşmesi gerekir**.

Eşleşen aracı, hangi çalışma alanının ve oturum deposunun kullanılacağını belirler.

## Yayın grupları (birden fazla aracı çalıştırma)

Yayın grupları, aynı eş için **OpenClaw normalde yanıt vereceği zaman** (örneğin WhatsApp gruplarında, bahsetme/etkinleştirme denetiminden sonra) **birden fazla aracı** çalıştırmanıza olanak tanır.

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

- `agents.list`: adlandırılmış aracı tanımları (çalışma alanı, model vb.).
- `bindings`: gelen kanalları/hesapları/eşleri aracılarla eşleştirir.

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

Çalışma zamanı oturum satırları, durum dizini altındaki her aracının SQLite veritabanında
bulunur (varsayılan `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`

Eski kurulumlarda `~/.openclaw/agents/<agentId>/sessions/` altında eski transkript JSONL dosyaları ve bir `sessions.json` satır
deposu bulunabilir. Gateway başlangıcı ve
`openclaw doctor --fix`, etkin eski satırları/geçmişi otomatik olarak SQLite'a aktarır.
Açık geçiş kanıtına ihtiyacınız olduğunda `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` ve
[Doctor](/tr/cli/doctor#session-sqlite-migration) doğrulama sırasını kullanın.
Geçiş ve çevrimdışı bakım iş akışları için `session.store` ve `{agentId}`
şablonlama aracılığıyla eski bir depo yolu seçmeye devam edebilirsiniz.

Gateway ve ACP oturum keşfi, varsayılan `agents/` kökü ve şablonlanmış
`session.store` kökleri altındaki disk destekli aracı depolarını da tarar. Keşfedilen
depolar, çözümlenmiş aracı kökünün içinde kalmalı ve normal bir eski
`sessions.json` dosyası kullanmalıdır. Sembolik bağlantılar ve kök dışındaki yollar yok sayılır.

## WebChat davranışı

WebChat, **seçilen aracıya** bağlanır ve varsayılan olarak aracının ana
oturumunu kullanır. Bu nedenle WebChat, söz konusu aracı için kanallar arası bağlamı
tek bir yerde görmenizi sağlar.

## Yanıt bağlamı

Gelen yanıtlar şunları içerir:

- Mevcut olduğunda `ReplyToId`, `ReplyToBody` ve `ReplyToSender`.
- Alıntılanan bağlam, `Body` öğesine bir `[Replying to ...]` bloğu olarak eklenir.

Bu davranış kanallar arasında tutarlıdır.

## İlgili

- [Gruplar](/tr/channels/groups)
- [Yayın grupları](/tr/channels/broadcast-groups)
- [Eşleştirme](/tr/channels/pairing)
