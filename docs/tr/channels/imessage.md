---
read_when:
    - iMessage desteğini ayarlama
    - iMessage gönderme/alma sorunlarını ayıklama
summary: imsg aracılığıyla eski iMessage desteği (stdio üzerinden JSON-RPC). Yeni kurulumlar BlueBubbles kullanmalıdır.
title: iMessage
x-i18n:
    generated_at: "2026-04-24T08:58:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff2773ebcfced8834bc5d28378d9a6e3c20826cc0e08d6ea5480f8a5975fd8e3
    source_path: channels/imessage.md
    workflow: 15
---

# iMessage (eski: imsg)

<Warning>
Yeni iMessage dağıtımları için <a href="/tr/channels/bluebubbles">BlueBubbles</a> kullanın.

`imsg` entegrasyonu eskidir ve gelecekteki bir sürümde kaldırılabilir.
</Warning>

Durum: eski harici CLI entegrasyonu. Gateway, `imsg rpc` başlatır ve stdio üzerinde JSON-RPC ile iletişim kurar (ayrı bir daemon/port yoktur).

<CardGroup cols={3}>
  <Card title="BlueBubbles (önerilen)" icon="message-circle" href="/tr/channels/bluebubbles">
    Yeni kurulumlar için tercih edilen iMessage yolu.
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
    OpenClaw yalnızca stdio uyumlu bir `cliPath` gerektirir; bu nedenle `cliPath` değerini uzak bir Mac'e SSH ile bağlanıp `imsg` çalıştıran bir sarmalayıcı betiğe yönlendirebilirsiniz.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Ekler etkin olduğunda önerilen yapılandırma:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // SCP ek alma işlemleri için kullanılır
      includeAttachments: true,
      // İsteğe bağlı: izin verilen ek köklerini geçersiz kılın.
      // Varsayılanlar arasında /Users/*/Library/Messages/Attachments bulunur
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    `remoteHost` ayarlanmadıysa OpenClaw, SSH sarmalayıcı betiğini ayrıştırarak bunu otomatik algılamaya çalışır.
    `remoteHost` değeri `host` veya `user@host` olmalıdır (boşluk veya SSH seçenekleri olmadan).
    OpenClaw, SCP için sıkı ana makine anahtarı denetimi kullanır; bu nedenle röle ana makine anahtarı `~/.ssh/known_hosts` içinde zaten bulunmalıdır.
    Ek yolları, izin verilen köklere göre doğrulanır (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Gereksinimler ve izinler (macOS)

- Messages, `imsg` çalıştıran Mac'te oturum açmış olmalıdır.
- OpenClaw/`imsg` çalıştıran süreç bağlamı için Full Disk Access gereklidir (Messages veritabanı erişimi).
- Messages.app üzerinden mesaj göndermek için Automation izni gereklidir.

<Tip>
İzinler süreç bağlamı başına verilir. Gateway başsız çalışıyorsa (LaunchAgent/SSH), istemleri tetiklemek için aynı bağlamda bir kez etkileşimli komut çalıştırın:

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

    İzin listesi alanı: `channels.imessage.allowFrom`.

    İzin listesi girdileri handle veya sohbet hedefleri olabilir (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Grup ilkesi + bahsetmeler">
    `channels.imessage.groupPolicy`, grup işlemeyi denetler:

    - `allowlist` (yapılandırıldığında varsayılan)
    - `open`
    - `disabled`

    Grup gönderen izin listesi: `channels.imessage.groupAllowFrom`.

    Çalışma zamanı geri dönüşü: `groupAllowFrom` ayarlanmamışsa, iMessage grup gönderen denetimleri varsa `allowFrom` değerine geri döner.
    Çalışma zamanı notu: `channels.imessage` tamamen eksikse, çalışma zamanı `groupPolicy="allowlist"` değerine geri döner ve bir uyarı günlüğe kaydeder (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

    Gruplar için bahsetme geçitlemesi:

    - iMessage yerel bahsetme meta verisine sahip değildir
    - bahsetme algılama regex desenlerini kullanır (`agents.list[].groupChat.mentionPatterns`, geri dönüş olarak `messages.groupChat.mentionPatterns`)
    - yapılandırılmış desen yoksa bahsetme geçitlemesi zorunlu tutulamaz

    Yetkili gönderenlerden gelen kontrol komutları gruplarda bahsetme geçitlemesini atlayabilir.

  </Tab>

  <Tab title="Oturumlar ve deterministik yanıtlar">
    - DM'ler doğrudan yönlendirme kullanır; gruplar grup yönlendirmesi kullanır.
    - Varsayılan `session.dmScope=main` ile iMessage DM'leri aracının ana oturumunda birleşir.
    - Grup oturumları yalıtılmıştır (`agent:<agentId>:imessage:group:<chat_id>`).
    - Yanıtlar, kaynak kanal/hedef meta verileri kullanılarak yeniden iMessage'a yönlendirilir.

    Grup benzeri iş parçacığı davranışı:

    Bazı çok katılımcılı iMessage iş parçacıkları `is_group=false` ile gelebilir.
    Bu `chat_id`, `channels.imessage.groups` altında açıkça yapılandırılmışsa OpenClaw bunu grup trafiği olarak değerlendirir (grup geçitlemesi + grup oturumu yalıtımı).

  </Tab>
</Tabs>

## ACP konuşma bağlamaları

Eski iMessage sohbetleri ACP oturumlarına da bağlanabilir.

Hızlı operatör akışı:

- DM veya izin verilen grup sohbeti içinde `/acp spawn codex --bind here` çalıştırın.
- Aynı iMessage konuşmasındaki sonraki mesajlar oluşturulan ACP oturumuna yönlendirilir.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve bağlamayı kaldırır.

Yapılandırılmış kalıcı bağlamalar, `type: "acp"` ve `match.channel: "imessage"` içeren üst düzey `bindings[]` girdileriyle desteklenir.

`match.peer.id` şunları kullanabilir:

- `+15555550123` veya `user@example.com` gibi normalize edilmiş DM handle
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

Paylaşılan ACP bağlama davranışı için [ACP Aracıları](/tr/tools/acp-agents) sayfasına bakın.

## Dağıtım desenleri

<AccordionGroup>
  <Accordion title="Özel bot macOS kullanıcısı (ayrı iMessage kimliği)">
    Bot trafiğinin kişisel Messages profilinizden yalıtılması için özel bir Apple ID ve macOS kullanıcısı kullanın.

    Tipik akış:

    1. Özel bir macOS kullanıcısı oluşturun/oturum açın.
    2. O kullanıcıda bot Apple ID'si ile Messages'e giriş yapın.
    3. Bu kullanıcıda `imsg` kurun.
    4. OpenClaw'ın bu kullanıcı bağlamında `imsg` çalıştırabilmesi için SSH sarmalayıcı oluşturun.
    5. `channels.imessage.accounts.<id>.cliPath` ve `.dbPath` alanlarını bu kullanıcı profiline yönlendirin.

    İlk çalıştırmada bu bot kullanıcı oturumunda GUI onayları (Automation + Full Disk Access) gerekebilir.

  </Accordion>

  <Accordion title="Tailscale üzerinden uzak Mac (örnek)">
    Yaygın topoloji:

    - Gateway Linux/VM üzerinde çalışır
    - iMessage + `imsg`, tailnet'inizdeki bir Mac'te çalışır
    - `cliPath` sarmalayıcısı, `imsg` çalıştırmak için SSH kullanır
    - `remoteHost`, SCP ek alma işlemlerini etkinleştirir

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
    `known_hosts` doldurulsun diye önce ana makine anahtarının güvenildiğinden emin olun (örneğin `ssh bot@mac-mini.tailnet-1234.ts.net`).

  </Accordion>

  <Accordion title="Çok hesaplı desen">
    iMessage, `channels.imessage.accounts` altında hesap başına yapılandırmayı destekler.

    Her hesap `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, geçmiş ayarları ve ek kök izin listeleri gibi alanları geçersiz kılabilir.

  </Accordion>
</AccordionGroup>

## Medya, parçalama ve teslim hedefleri

<AccordionGroup>
  <Accordion title="Ekler ve medya">
    - gelen ek alımı isteğe bağlıdır: `channels.imessage.includeAttachments`
    - `remoteHost` ayarlandığında uzak ek yolları SCP ile alınabilir
    - ek yolları izin verilen köklerle eşleşmelidir:
      - `channels.imessage.attachmentRoots` (yerel)
      - `channels.imessage.remoteAttachmentRoots` (uzak SCP modu)
      - varsayılan kök deseni: `/Users/*/Library/Messages/Attachments`
    - SCP sıkı ana makine anahtarı denetimi kullanır (`StrictHostKeyChecking=yes`)
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

## Yapılandırma yazmaları

iMessage, kanal tarafından başlatılan yapılandırma yazmalarına varsayılan olarak izin verir (`commands.config: true` olduğunda `/config set|unset` için).

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

    Probe, RPC desteklenmediğini bildiriyorsa `imsg` güncelleyin.

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
    - `channels.imessage.groups` izin listesi davranışı
    - bahsetme deseni yapılandırması (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Uzak ekler başarısız oluyor">
    Şunları kontrol edin:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - Gateway ana makinesinden SSH/SCP anahtar kimlik doğrulaması
    - Gateway ana makinesinde ana makine anahtarı `~/.ssh/known_hosts` içinde mevcut
    - Messages çalıştıran Mac'te uzak yol okunabilirliği

  </Accordion>

  <Accordion title="macOS izin istemleri kaçırıldı">
    Aynı kullanıcı/oturum bağlamında etkileşimli bir GUI terminalinde yeniden çalıştırın ve istemleri onaylayın:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    OpenClaw/`imsg` çalıştıran süreç bağlamına Full Disk Access + Automation verildiğini doğrulayın.

  </Accordion>
</AccordionGroup>

## Yapılandırma başvurusu işaretçileri

- [Yapılandırma başvurusu - iMessage](/tr/gateway/config-channels#imessage)
- [Gateway yapılandırması](/tr/gateway/configuration)
- [Eşleştirme](/tr/channels/pairing)
- [BlueBubbles](/tr/channels/bluebubbles)

## İlgili

- [Kanallara genel bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme geçitlemesi
- [Kanal yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
