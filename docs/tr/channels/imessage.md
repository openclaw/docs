---
read_when:
    - iMessage desteğini ayarlama
    - iMessage gönderme/alma işlemlerinde hata ayıklama
summary: imsg aracılığıyla eski iMessage desteği (stdio üzerinden JSON-RPC). Yeni kurulumlar BlueBubbles kullanmalıdır.
title: iMessage
x-i18n:
    generated_at: "2026-04-30T09:06:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 60eeb3553a6511d56b8177ca4eafbedfed2d0852ac64c230c250911cd18ce17e
    source_path: channels/imessage.md
    workflow: 16
---

<Warning>
Yeni iMessage dağıtımları için <a href="/tr/channels/bluebubbles">BlueBubbles</a> kullanın.

`imsg` entegrasyonu eskidir ve gelecekteki bir sürümde kaldırılabilir.
</Warning>

Durum: eski harici CLI entegrasyonu. Gateway, `imsg rpc` sürecini başlatır ve stdio üzerinden JSON-RPC ile iletişim kurar (ayrı daemon/port yoktur).

<CardGroup cols={3}>
  <Card title="BlueBubbles (önerilir)" icon="message-circle" href="/tr/channels/bluebubbles">
    Yeni kurulumlar için tercih edilen iMessage yolu.
  </Card>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    iMessage DM'leri varsayılan olarak eşleştirme modunu kullanır.
  </Card>
  <Card title="Yapılandırma referansı" icon="settings" href="/tr/gateway/config-channels#imessage">
    Tam iMessage alan referansı.
  </Card>
</CardGroup>

## Hızlı kurulum

<Tabs>
  <Tab title="Yerel Mac (hızlı yol)">
    <Steps>
      <Step title="imsg kurun ve doğrulayın">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="OpenClaw'ı yapılandırın">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Gateway'i başlatın">

```bash
openclaw gateway
```

      </Step>

      <Step title="İlk DM eşleştirmesini onaylayın (varsayılan dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Eşleştirme isteklerinin süresi 1 saat sonra dolar.
      </Step>
    </Steps>

  </Tab>

  <Tab title="SSH üzerinden uzak Mac">
    OpenClaw yalnızca stdio uyumlu bir `cliPath` gerektirir; bu nedenle `cliPath` değerini uzak bir Mac'e SSH yapan ve `imsg` çalıştıran bir sarmalayıcı betiğe yönlendirebilirsiniz.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Ekler etkinleştirildiğinde önerilen yapılandırma:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    `remoteHost` ayarlanmamışsa OpenClaw, SSH sarmalayıcı betiğini ayrıştırarak bunu otomatik algılamaya çalışır.
    `remoteHost`, `host` veya `user@host` olmalıdır (boşluk veya SSH seçenekleri olmamalıdır).
    OpenClaw, SCP için sıkı host anahtarı denetimi kullanır; bu nedenle aktarıcı host anahtarı `~/.ssh/known_hosts` içinde zaten bulunmalıdır.
    Ek yolları izin verilen köklere (`attachmentRoots` / `remoteAttachmentRoots`) göre doğrulanır.

  </Tab>
</Tabs>

## Gereksinimler ve izinler (macOS)

- Messages, `imsg` çalıştıran Mac'te oturum açmış olmalıdır.
- OpenClaw/`imsg` çalıştıran süreç bağlamı için Full Disk Access gerekir (Messages DB erişimi).
- Messages.app üzerinden ileti göndermek için Automation izni gerekir.

<Tip>
İzinler süreç bağlamı başına verilir. Gateway başsız çalışıyorsa (LaunchAgent/SSH), istemleri tetiklemek için aynı bağlamda bir kerelik etkileşimli komut çalıştırın:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Erişim denetimi ve yönlendirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.imessage.dmPolicy` doğrudan iletileri denetler:

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`allowFrom` içinde `"*"` bulunmasını gerektirir)
    - `disabled`

    İzin listesi alanı: `channels.imessage.allowFrom`.

    İzin listesi girdileri tanıtıcılar veya sohbet hedefleri olabilir (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Grup ilkesi + bahsetmeler">
    `channels.imessage.groupPolicy` grup işlemeyi denetler:

    - `allowlist` (yapılandırıldığında varsayılan)
    - `open`
    - `disabled`

    Grup gönderen izin listesi: `channels.imessage.groupAllowFrom`.

    Çalışma zamanı geri dönüşü: `groupAllowFrom` ayarlanmamışsa iMessage grup gönderen denetimleri, mevcut olduğunda `allowFrom` değerine geri döner.
    Çalışma zamanı notu: `channels.imessage` tamamen eksikse çalışma zamanı `groupPolicy="allowlist"` değerine geri döner ve bir uyarı günlüğe yazar (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

    Gruplar için bahsetme geçidi:

    - iMessage yerel bahsetme meta verilerine sahip değildir
    - bahsetme algılama regex desenlerini kullanır (`agents.list[].groupChat.mentionPatterns`, geri dönüş `messages.groupChat.mentionPatterns`)
    - yapılandırılmış desen yoksa bahsetme geçidi zorunlu kılınamaz

    Yetkili gönderenlerden gelen denetim komutları, gruplarda bahsetme geçidini atlayabilir.

  </Tab>

  <Tab title="Oturumlar ve deterministik yanıtlar">
    - DM'ler doğrudan yönlendirme kullanır; gruplar grup yönlendirmesi kullanır.
    - Varsayılan `session.dmScope=main` ile iMessage DM'leri aracının ana oturumunda birleşir.
    - Grup oturumları yalıtılmıştır (`agent:<agentId>:imessage:group:<chat_id>`).
    - Yanıtlar, kaynak kanal/hedef meta verileri kullanılarak tekrar iMessage'a yönlendirilir.

    Grup benzeri iş parçacığı davranışı:

    Bazı çok katılımcılı iMessage iş parçacıkları `is_group=false` ile gelebilir.
    Bu `chat_id` açıkça `channels.imessage.groups` altında yapılandırılmışsa OpenClaw bunu grup trafiği olarak işler (grup geçidi + grup oturumu yalıtımı).

  </Tab>
</Tabs>

## ACP konuşma bağlamaları

Eski iMessage sohbetleri ACP oturumlarına da bağlanabilir.

Hızlı operatör akışı:

- DM veya izin verilen grup sohbeti içinde `/acp spawn codex --bind here` çalıştırın.
- Aynı iMessage konuşmasındaki gelecekteki iletiler, başlatılan ACP oturumuna yönlendirilir.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve bağlamayı kaldırır.

Yapılandırılmış kalıcı bağlamalar, `type: "acp"` ve `match.channel: "imessage"` içeren üst düzey `bindings[]` girdileriyle desteklenir.

`match.peer.id` şunları kullanabilir:

- `+15555550123` veya `user@example.com` gibi normalize edilmiş DM tanıtıcısı
- `chat_id:<id>` (kararlı grup bağlamaları için önerilir)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Örnek:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

Paylaşılan ACP bağlama davranışı için [ACP Aracıları](/tr/tools/acp-agents) bölümüne bakın.

## Dağıtım kalıpları

<AccordionGroup>
  <Accordion title="Ayrılmış bot macOS kullanıcısı (ayrı iMessage kimliği)">
    Bot trafiğini kişisel Messages profilinizden yalıtmak için ayrılmış bir Apple ID ve macOS kullanıcısı kullanın.

    Tipik akış:

    1. Ayrılmış bir macOS kullanıcısı oluşturun/oturum açın.
    2. Bu kullanıcıda bot Apple ID ile Messages'a giriş yapın.
    3. `imsg` öğesini bu kullanıcıda kurun.
    4. OpenClaw'ın `imsg` öğesini bu kullanıcı bağlamında çalıştırabilmesi için SSH sarmalayıcı oluşturun.
    5. `channels.imessage.accounts.<id>.cliPath` ve `.dbPath` değerlerini bu kullanıcı profiline yönlendirin.

    İlk çalıştırma, bu bot kullanıcı oturumunda GUI onayları (Automation + Full Disk Access) gerektirebilir.

  </Accordion>

  <Accordion title="Tailscale üzerinden uzak Mac (örnek)">
    Yaygın topoloji:

    - gateway Linux/VM üzerinde çalışır
    - iMessage + `imsg`, tailnet'inizdeki bir Mac üzerinde çalışır
    - `cliPath` sarmalayıcısı `imsg` çalıştırmak için SSH kullanır
    - `remoteHost`, SCP ek getirmelerini etkinleştirir

    Örnek:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
      includeAttachments: true,
      dbPath: "/Users/bot/Library/Messages/chat.db",
    },
  },
}
```

```bash
#!/usr/bin/env bash
exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
```

    Hem SSH hem de SCP etkileşimsiz olsun diye SSH anahtarları kullanın.
    `known_hosts` doldurulsun diye önce host anahtarının güvenilir olduğundan emin olun (örneğin `ssh bot@mac-mini.tailnet-1234.ts.net`).

  </Accordion>

  <Accordion title="Çok hesaplı kalıp">
    iMessage, `channels.imessage.accounts` altında hesap başına yapılandırmayı destekler.

    Her hesap `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, geçmiş ayarları ve ek kökü izin listeleri gibi alanları geçersiz kılabilir.

  </Accordion>
</AccordionGroup>

## Medya, parçalara ayırma ve teslim hedefleri

<AccordionGroup>
  <Accordion title="Ekler ve medya">
    - gelen ek alımı isteğe bağlıdır: `channels.imessage.includeAttachments`
    - `remoteHost` ayarlandığında uzak ek yolları SCP aracılığıyla getirilebilir
    - ek yolları izin verilen köklerle eşleşmelidir:
      - `channels.imessage.attachmentRoots` (yerel)
      - `channels.imessage.remoteAttachmentRoots` (uzak SCP modu)
      - varsayılan kök deseni: `/Users/*/Library/Messages/Attachments`
    - SCP sıkı host anahtarı denetimi kullanır (`StrictHostKeyChecking=yes`)
    - giden medya boyutu `channels.imessage.mediaMaxMb` değerini kullanır (varsayılan 16 MB)

  </Accordion>

  <Accordion title="Giden parçalara ayırma">
    - metin parça sınırı: `channels.imessage.textChunkLimit` (varsayılan 4000)
    - parça modu: `channels.imessage.chunkMode`
      - `length` (varsayılan)
      - `newline` (paragraf öncelikli bölme)

  </Accordion>

  <Accordion title="Adresleme biçimleri">
    Tercih edilen açık hedefler:

    - `chat_id:123` (kararlı yönlendirme için önerilir)
    - `chat_guid:...`
    - `chat_identifier:...`

    Tanıtıcı hedefleri de desteklenir:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## Yapılandırma yazmaları

iMessage varsayılan olarak kanal tarafından başlatılan yapılandırma yazmalarına izin verir (`commands.config: true` olduğunda `/config set|unset` için).

Devre dışı bırakın:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

## Sorun giderme

<AccordionGroup>
  <Accordion title="imsg bulunamadı veya RPC desteklenmiyor">
    İkiliyi ve RPC desteğini doğrulayın:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Yoklama RPC'nin desteklenmediğini bildirirse `imsg` öğesini güncelleyin.

  </Accordion>

  <Accordion title="DM'ler yok sayılıyor">
    Kontrol edin:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - eşleştirme onayları (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Grup iletileri yok sayılıyor">
    Kontrol edin:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` izin listesi davranışı
    - bahsetme deseni yapılandırması (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Uzak ekler başarısız oluyor">
    Kontrol edin:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - Gateway host'undan SSH/SCP anahtar kimlik doğrulaması
    - host anahtarının Gateway host'unda `~/.ssh/known_hosts` içinde bulunması
    - Messages çalıştıran Mac'te uzak yolun okunabilirliği

  </Accordion>

  <Accordion title="macOS izin istemleri kaçırıldı">
    Aynı kullanıcı/oturum bağlamında etkileşimli bir GUI terminalinde yeniden çalıştırın ve istemleri onaylayın:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    OpenClaw/`imsg` çalıştıran süreç bağlamı için Full Disk Access + Automation izinlerinin verildiğini doğrulayın.

  </Accordion>
</AccordionGroup>

## Yapılandırma referansı işaretçileri

- [Yapılandırma referansı - iMessage](/tr/gateway/config-channels#imessage)
- [Gateway yapılandırması](/tr/gateway/configuration)
- [Eşleştirme](/tr/channels/pairing)
- [BlueBubbles](/tr/channels/bluebubbles)

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme geçidi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — iletiler için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve güçlendirme
