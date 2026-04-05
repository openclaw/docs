---
read_when:
    - iMessage desteği kurulurken
    - iMessage gönderme/alma sorunları giderilirken
summary: imsg üzerinden eski iMessage desteği (stdio üzerinden JSON-RPC). Yeni kurulumlarda BlueBubbles kullanılmalıdır.
title: iMessage
x-i18n:
    generated_at: "2026-04-05T13:43:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 086d85bead49f75d12ae6b14ac917af52375b6afd28f6af1a0dcbbc7fcb628a0
    source_path: channels/imessage.md
    workflow: 15
---

# iMessage (eski: imsg)

<Warning>
Yeni iMessage dağıtımları için <a href="/channels/bluebubbles">BlueBubbles</a> kullanın.

`imsg` entegrasyonu eskidir ve gelecekteki bir sürümde kaldırılabilir.
</Warning>

Durum: eski harici CLI entegrasyonu. Gateway, `imsg rpc` başlatır ve stdio üzerinde JSON-RPC ile iletişim kurar (ayrı daemon/port yoktur).

<CardGroup cols={3}>
  <Card title="BlueBubbles (önerilen)" icon="message-circle" href="/channels/bluebubbles">
    Yeni kurulumlar için tercih edilen iMessage yolu.
  </Card>
  <Card title="Eşleştirme" icon="link" href="/channels/pairing">
    iMessage DM'leri varsayılan olarak eşleştirme modunu kullanır.
  </Card>
  <Card title="Yapılandırma başvurusu" icon="settings" href="/gateway/configuration-reference#imessage">
    iMessage için tüm alan başvurusu.
  </Card>
</CardGroup>

## Hızlı kurulum

<Tabs>
  <Tab title="Yerel Mac (hızlı yol)">
    <Steps>
      <Step title="imsg yükleyin ve doğrulayın">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="OpenClaw yapılandırın">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/<you>/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Gateway başlatın">

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
    OpenClaw yalnızca stdio uyumlu bir `cliPath` gerektirir; bu nedenle `cliPath` değerini uzak bir Mac'e SSH ile bağlanıp `imsg` çalıştıran bir sarmalayıcı betiğe yönlendirebilirsiniz.

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
      remoteHost: "user@gateway-host", // SCP ek getirmeleri için kullanılır
      includeAttachments: true,
      // İsteğe bağlı: izin verilen ek köklerini geçersiz kılın.
      // Varsayılanlar /Users/*/Library/Messages/Attachments içerir
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    `remoteHost` ayarlı değilse, OpenClaw SSH sarmalayıcı betiğini ayrıştırarak bunu otomatik algılamaya çalışır.
    `remoteHost`, `host` veya `user@host` olmalıdır (boşluk veya SSH seçenekleri olmadan).
    OpenClaw, SCP için katı ana makine anahtarı denetimi kullanır; bu nedenle aktarma ana makinesi anahtarı `~/.ssh/known_hosts` içinde zaten bulunmalıdır.
    Ek yolları izin verilen köklere göre doğrulanır (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Gereksinimler ve izinler (macOS)

- Messages, `imsg` çalıştıran Mac'te oturum açmış olmalıdır.
- OpenClaw/`imsg` çalıştıran işlem bağlamı için Tam Disk Erişimi gereklidir (Messages DB erişimi).
- Messages.app üzerinden mesaj göndermek için Otomasyon izni gereklidir.

<Tip>
İzinler işlem bağlamı başına verilir. Gateway başsız çalışıyorsa (LaunchAgent/SSH), istemleri tetiklemek için aynı bağlamda bir defalık etkileşimli komut çalıştırın:

```bash
imsg chats --limit 1
# veya
imsg send <handle> "test"
```

</Tip>

## Erişim denetimi ve yönlendirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.imessage.dmPolicy`, doğrudan mesajları denetler:

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`allowFrom` içinde `"*"` bulunmasını gerektirir)
    - `disabled`

    Allowlist alanı: `channels.imessage.allowFrom`.

    Allowlist girdileri handle'lar veya sohbet hedefleri olabilir (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Grup ilkesi + anmalar">
    `channels.imessage.groupPolicy`, grup işlemesini denetler:

    - `allowlist` (yapılandırıldığında varsayılan)
    - `open`
    - `disabled`

    Grup gönderen allowlist'i: `channels.imessage.groupAllowFrom`.

    Çalışma zamanı fallback'i: `groupAllowFrom` ayarlı değilse, iMessage grup gönderen denetimleri kullanılabilir olduğunda `allowFrom` değerine geri düşer.
    Çalışma zamanı notu: `channels.imessage` tamamen eksikse, çalışma zamanı `groupPolicy="allowlist"` değerine geri düşer ve bir uyarı kaydeder (`channels.defaults.groupPolicy` ayarlı olsa bile).

    Gruplar için anma geçitlemesi:

    - iMessage, yerel anma meta verisine sahip değildir
    - anma algılama regex desenleri kullanır (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - yapılandırılmış desen yoksa anma geçitlemesi zorunlu kılınamaz

    Yetkili gönderenlerden gelen denetim komutları, gruplarda anma geçitlemesini aşabilir.

  </Tab>

  <Tab title="Oturumlar ve deterministik yanıtlar">
    - DM'ler doğrudan yönlendirme kullanır; gruplar grup yönlendirmesi kullanır.
    - Varsayılan `session.dmScope=main` ile iMessage DM'leri agent ana oturumunda toplanır.
    - Grup oturumları yalıtılmıştır (`agent:<agentId>:imessage:group:<chat_id>`).
    - Yanıtlar, kaynak kanal/hedef meta verileri kullanılarak yeniden iMessage'a yönlendirilir.

    Grup benzeri konu davranışı:

    Bazı çok katılımcılı iMessage konuları `is_group=false` ile gelebilir.
    Bu `chat_id`, `channels.imessage.groups` altında açıkça yapılandırılmışsa OpenClaw bunu grup trafiği olarak ele alır (grup geçitlemesi + grup oturumu yalıtımı).

  </Tab>
</Tabs>

## ACP konuşma bağlamaları

Eski iMessage sohbetleri ACP oturumlarına da bağlanabilir.

Hızlı operatör akışı:

- DM veya izin verilen grup sohbeti içinde `/acp spawn codex --bind here` çalıştırın.
- Aynı iMessage konuşmasındaki sonraki mesajlar oluşturulan ACP oturumuna yönlendirilir.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve bağlamayı kaldırır.

Yapılandırılmış kalıcı bağlamalar, üst düzey `bindings[]` girdileri üzerinden `type: "acp"` ve `match.channel: "imessage"` ile desteklenir.

`match.peer.id` şu biçimleri kullanabilir:

- `+15555550123` veya `user@example.com` gibi normalize edilmiş DM handle'ı
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

Paylaşılan ACP bağlama davranışı için [ACP Agent'ları](/tools/acp-agents) sayfasına bakın.

## Dağıtım kalıpları

<AccordionGroup>
  <Accordion title="Ayrılmış bot macOS kullanıcısı (ayrı iMessage kimliği)">
    Bot trafiğinin kişisel Messages profilinizden yalıtılması için ayrılmış bir Apple ID ve macOS kullanıcısı kullanın.

    Tipik akış:

    1. Ayrılmış bir macOS kullanıcısı oluşturun/oturum açın.
    2. Bu kullanıcıda bot Apple ID'siyle Messages oturumu açın.
    3. Bu kullanıcıda `imsg` yükleyin.
    4. OpenClaw'ın bu kullanıcı bağlamında `imsg` çalıştırabilmesi için SSH sarmalayıcısı oluşturun.
    5. `channels.imessage.accounts.<id>.cliPath` ve `.dbPath` değerlerini bu kullanıcı profiline yönlendirin.

    İlk çalıştırma, bu bot kullanıcı oturumunda GUI onayları gerektirebilir (Otomasyon + Tam Disk Erişimi).

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

    Hem SSH hem SCP'nin etkileşimsiz olması için SSH anahtarları kullanın.
    `known_hosts` doldurulsun diye önce ana makine anahtarının güvenilir olduğundan emin olun (örneğin `ssh bot@mac-mini.tailnet-1234.ts.net`).

  </Accordion>

  <Accordion title="Çok hesaplı kalıp">
    iMessage, `channels.imessage.accounts` altında hesap başına yapılandırmayı destekler.

    Her hesap `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, geçmiş ayarları ve ek kökü allowlist'leri gibi alanları geçersiz kılabilir.

  </Accordion>
</AccordionGroup>

## Medya, parçalama ve teslimat hedefleri

<AccordionGroup>
  <Accordion title="Ekler ve medya">
    - gelen ek alımı isteğe bağlıdır: `channels.imessage.includeAttachments`
    - `remoteHost` ayarlandığında uzak ek yolları SCP ile alınabilir
    - ek yolları izin verilen köklerle eşleşmelidir:
      - `channels.imessage.attachmentRoots` (yerel)
      - `channels.imessage.remoteAttachmentRoots` (uzak SCP modu)
      - varsayılan kök deseni: `/Users/*/Library/Messages/Attachments`
    - SCP, katı ana makine anahtarı denetimi kullanır (`StrictHostKeyChecking=yes`)
    - giden medya boyutu `channels.imessage.mediaMaxMb` kullanır (varsayılan 16 MB)
  </Accordion>

  <Accordion title="Giden parçalama">
    - metin parça sınırı: `channels.imessage.textChunkLimit` (varsayılan 4000)
    - parça modu: `channels.imessage.chunkMode`
      - `length` (varsayılan)
      - `newline` (önce paragraf bölme)
  </Accordion>

  <Accordion title="Adresleme biçimleri">
    Tercih edilen açık hedefler:

    - `chat_id:123` (kararlı yönlendirme için önerilir)
    - `chat_guid:...`
    - `chat_identifier:...`

    Handle hedefleri de desteklenir:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## Yapılandırma yazımları

iMessage, varsayılan olarak kanal tarafından başlatılan yapılandırma yazımlarına izin verir (`commands.config: true` olduğunda `/config set|unset` için).

Devre dışı bırakmak için:

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

    Probe, RPC desteklenmiyor bildiriyorsa `imsg` güncelleyin.

  </Accordion>

  <Accordion title="DM'ler yok sayılıyor">
    Şunları kontrol edin:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - eşleştirme onayları (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Grup mesajları yok sayılıyor">
    Şunları kontrol edin:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` allowlist davranışı
    - anma deseni yapılandırması (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Uzak ekler başarısız oluyor">
    Şunları kontrol edin:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - gateway ana makinesinden SSH/SCP anahtar kimlik doğrulaması
    - gateway ana makinesindeki `~/.ssh/known_hosts` içinde ana makine anahtarının mevcut olması
    - Messages çalıştıran Mac'te uzak yol okunabilirliği

  </Accordion>

  <Accordion title="macOS izin istemleri kaçırıldı">
    Aynı kullanıcı/oturum bağlamında etkileşimli GUI terminalinde yeniden çalıştırın ve istemleri onaylayın:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    OpenClaw/`imsg` çalıştıran işlem bağlamı için Tam Disk Erişimi + Otomasyon izinlerinin verildiğini doğrulayın.

  </Accordion>
</AccordionGroup>

## Yapılandırma başvurusu işaretçileri

- [Yapılandırma başvurusu - iMessage](/gateway/configuration-reference#imessage)
- [Gateway yapılandırması](/gateway/configuration)
- [Eşleştirme](/channels/pairing)
- [BlueBubbles](/channels/bluebubbles)

## İlgili

- [Kanallara Genel Bakış](/channels) — desteklenen tüm kanallar
- [Eşleştirme](/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/channels/groups) — grup sohbeti davranışı ve anma geçitlemesi
- [Kanal Yönlendirme](/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/gateway/security) — erişim modeli ve sağlamlaştırma
