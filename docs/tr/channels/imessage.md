---
read_when:
    - iMessage desteğini ayarlama
    - iMessage gönderme/alma hata ayıklaması
summary: imsg aracılığıyla yerel iMessage desteği (stdio üzerinden JSON-RPC). Ana makine gereksinimleri karşılandığında yeni OpenClaw iMessage kurulumları için tercih edilir.
title: iMessage
x-i18n:
    generated_at: "2026-05-07T01:50:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39a3d6350333292c147d7986568eb539aa8ce562405092b71b8cecbbf7584450
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Yeni OpenClaw iMessage dağıtımları için, oturum açılmış bir macOS Messages ana makinesinde `imsg` çalıştırabiliyorsanız buradan başlayın. BlueBubbles, HTTP sunucusuna, Webhook'larına veya daha zengin özel API eylemlerine bağlı mevcut kurulumlar için eski yedek seçenek olarak kullanılmaya devam eder.
</Note>

Durum: yerel harici CLI entegrasyonu. Gateway, `imsg rpc` başlatır ve stdio üzerinden JSON-RPC ile iletişim kurar (ayrı daemon/port yoktur).

<CardGroup cols={3}>
  <Card title="BlueBubbles (eski yedek seçenek)" icon="message-circle" href="/tr/channels/bluebubbles">
    Mevcut BlueBubbles destekli yönlendirme için kullanmaya devam edin; imsg uygunsa yeni kurulumlarda bundan kaçının.
  </Card>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    iMessage DM'leri varsayılan olarak eşleştirme modunu kullanır.
  </Card>
  <Card title="Yapılandırma başvurusu" icon="settings" href="/tr/gateway/config-channels#imessage">
    Tam iMessage alan başvurusu.
  </Card>
</CardGroup>

## Hızlı kurulum

<Tabs>
  <Tab title="Yerel Mac (hızlı yol)">
    <Steps>
      <Step title="imsg'yi yükleyin ve doğrulayın">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="OpenClaw'u yapılandırın">

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

    `remoteHost` ayarlanmamışsa OpenClaw, SSH sarmalayıcı betiğini ayrıştırarak bunu otomatik algılamayı dener.
    `remoteHost`, `host` veya `user@host` olmalıdır (boşluk veya SSH seçenekleri olmadan).
    OpenClaw, SCP için katı ana makine anahtarı denetimi kullanır; bu nedenle aktarıcı ana makine anahtarı `~/.ssh/known_hosts` içinde zaten bulunmalıdır.
    Ek yolları izin verilen köklere göre doğrulanır (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Gereksinimler ve izinler (macOS)

- Messages, `imsg` çalıştıran Mac'te oturum açmış olmalıdır.
- OpenClaw/`imsg` çalıştıran süreç bağlamı için Full Disk Access gerekir (Messages DB erişimi).
- Messages.app üzerinden mesaj göndermek için Automation izni gerekir.

<Tip>
İzinler süreç bağlamı başına verilir. Gateway başsız çalışıyorsa (LaunchAgent/SSH), istemleri tetiklemek için aynı bağlamda tek seferlik etkileşimli bir komut çalıştırın:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Erişim denetimi ve yönlendirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.imessage.dmPolicy`, doğrudan mesajları denetler:

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`allowFrom` değerinin `"*"` içermesini gerektirir)
    - `disabled`

    İzin listesi alanı: `channels.imessage.allowFrom`.

    İzin listesi girdileri tanıtıcılar veya sohbet hedefleri olabilir (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Grup ilkesi + bahsetmeler">
    `channels.imessage.groupPolicy`, grup işlemeyi denetler:

    - `allowlist` (yapılandırıldığında varsayılan)
    - `open`
    - `disabled`

    Grup gönderici izin listesi: `channels.imessage.groupAllowFrom`.

    Çalışma zamanı yedeği: `groupAllowFrom` ayarlanmamışsa iMessage grup gönderici denetimleri, mevcut olduğunda `allowFrom` değerine geri döner.
    Çalışma zamanı notu: `channels.imessage` tamamen eksikse çalışma zamanı `groupPolicy="allowlist"` değerine geri döner ve bir uyarı günlüğe yazar (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

    Gruplar için bahsetme kapısı:

    - iMessage'da yerel bahsetme meta verisi yoktur
    - bahsetme algılama regex kalıplarını kullanır (`agents.list[].groupChat.mentionPatterns`, yedek `messages.groupChat.mentionPatterns`)
    - yapılandırılmış kalıp yoksa bahsetme kapısı uygulanamaz

    Yetkili göndericilerden gelen denetim komutları gruplarda bahsetme kapısını atlayabilir.

  </Tab>

  <Tab title="Oturumlar ve belirleyici yanıtlar">
    - DM'ler doğrudan yönlendirme kullanır; gruplar grup yönlendirmesi kullanır.
    - Varsayılan `session.dmScope=main` ile iMessage DM'leri aracının ana oturumuna daraltılır.
    - Grup oturumları yalıtılmıştır (`agent:<agentId>:imessage:group:<chat_id>`).
    - Yanıtlar, kaynak kanal/hedef meta verileri kullanılarak iMessage'a geri yönlendirilir.

    Grup benzeri ileti dizisi davranışı:

    Bazı çok katılımcılı iMessage ileti dizileri `is_group=false` ile gelebilir.
    Bu `chat_id`, `channels.imessage.groups` altında açıkça yapılandırılmışsa OpenClaw bunu grup trafiği olarak ele alır (grup kapısı + grup oturumu yalıtımı).

  </Tab>
</Tabs>

## ACP konuşma bağlamaları

Eski iMessage sohbetleri ACP oturumlarına da bağlanabilir.

Hızlı operatör akışı:

- DM veya izin verilen grup sohbetinin içinde `/acp spawn codex --bind here` çalıştırın.
- Aynı iMessage konuşmasındaki sonraki mesajlar, başlatılan ACP oturumuna yönlendirilir.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve bağlamayı kaldırır.

Yapılandırılmış kalıcı bağlamalar, `type: "acp"` ve `match.channel: "imessage"` içeren üst düzey `bindings[]` girdileriyle desteklenir.

`match.peer.id` şunları kullanabilir:

- `+15555550123` veya `user@example.com` gibi normalleştirilmiş DM tanıtıcısı
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
    Bot trafiğinin kişisel Messages profilinizden yalıtılması için ayrılmış bir Apple ID ve macOS kullanıcısı kullanın.

    Tipik akış:

    1. Ayrılmış bir macOS kullanıcısı oluşturun/oturum açın.
    2. Bu kullanıcıda bot Apple ID'siyle Messages'a oturum açın.
    3. Bu kullanıcıda `imsg` yükleyin.
    4. OpenClaw'un bu kullanıcı bağlamında `imsg` çalıştırabilmesi için SSH sarmalayıcısı oluşturun.
    5. `channels.imessage.accounts.<id>.cliPath` ve `.dbPath` değerlerini bu kullanıcı profiline yönlendirin.

    İlk çalıştırma, bu bot kullanıcı oturumunda GUI onayları gerektirebilir (Automation + Full Disk Access).

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
    `known_hosts` dosyasının doldurulması için önce ana makine anahtarının güvenilir olduğundan emin olun (örneğin `ssh bot@mac-mini.tailnet-1234.ts.net`).

  </Accordion>

  <Accordion title="Çok hesaplı kalıp">
    iMessage, `channels.imessage.accounts` altında hesap başına yapılandırmayı destekler.

    Her hesap `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, geçmiş ayarları ve ek kökü izin listeleri gibi alanları geçersiz kılabilir.

  </Accordion>
</AccordionGroup>

## Medya, parçalama ve teslim hedefleri

<AccordionGroup>
  <Accordion title="Ekler ve medya">
    - gelen ek alımı isteğe bağlıdır: `channels.imessage.includeAttachments`
    - `remoteHost` ayarlandığında uzak ek yolları SCP üzerinden getirilebilir
    - ek yolları izin verilen köklerle eşleşmelidir:
      - `channels.imessage.attachmentRoots` (yerel)
      - `channels.imessage.remoteAttachmentRoots` (uzak SCP modu)
      - varsayılan kök kalıbı: `/Users/*/Library/Messages/Attachments`
    - SCP katı ana makine anahtarı denetimi kullanır (`StrictHostKeyChecking=yes`)
    - giden medya boyutu `channels.imessage.mediaMaxMb` kullanır (varsayılan 16 MB)

  </Accordion>

  <Accordion title="Giden parçalama">
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

iMessage, kanal tarafından başlatılan yapılandırma yazmalarına varsayılan olarak izin verir (`commands.config: true` olduğunda `/config set|unset` için).

Devre dışı bırakma:

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
    İkili dosyayı ve RPC desteğini doğrulayın:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Probe, RPC'nin desteklenmediğini bildirirse `imsg` güncelleyin.

  </Accordion>

  <Accordion title="DM'ler yok sayılıyor">
    Kontrol edin:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - eşleştirme onayları (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Grup mesajları yok sayılıyor">
    Kontrol edin:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` izin listesi davranışı
    - bahsetme kalıbı yapılandırması (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Uzak ekler başarısız oluyor">
    Kontrol edin:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - gateway ana makinesinden SSH/SCP anahtar kimlik doğrulaması
    - ana makine anahtarının gateway ana makinesindeki `~/.ssh/known_hosts` içinde mevcut olması
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

## Yapılandırma başvurusu işaretçileri

- [Yapılandırma başvurusu - iMessage](/tr/gateway/config-channels#imessage)
- [Gateway yapılandırması](/tr/gateway/configuration)
- [Eşleştirme](/tr/channels/pairing)
- [BlueBubbles](/tr/channels/bluebubbles)

## İlgili

- [Kanallar Genel Bakışı](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — doğrudan mesaj kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme denetimi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirme
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sıkılaştırma
