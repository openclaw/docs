---
read_when:
    - WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix kanal hesaplarını eklemek/kaldırmak istiyorsunuz
    - Kanal durumunu kontrol etmek veya kanal günlüklerini takip etmek istiyorsunuz
summary: '`openclaw channels` için CLI başvurusu (hesaplar, durum, oturum açma/oturumu kapatma, günlükler)'
title: Kanallar
x-i18n:
    generated_at: "2026-05-02T08:49:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3aff374e81e0845805b9baf09d6b63dfe8270cb48606f74f3f1f2dcd56b552c4
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Gateway üzerinde sohbet kanalı hesaplarını ve bunların çalışma zamanı durumunu yönetin.

İlgili dokümanlar:

- Kanal kılavuzları: [Kanallar](/tr/channels)
- Gateway yapılandırması: [Yapılandırma](/tr/gateway/configuration)

## Yaygın komutlar

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## Durum / yetenekler / çözümleme / günlükler

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (yalnızca `--channel` ile), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` canlı yoldur: erişilebilir bir gateway üzerinde hesap başına
`probeAccount` ve isteğe bağlı `auditAccount` denetimlerini çalıştırır; bu nedenle çıktı,
taşıma durumunu ve `works`, `probe failed`, `audit ok` veya `audit failed` gibi yoklama
sonuçlarını içerebilir. Gateway erişilemezse `channels status`, canlı yoklama çıktısı
yerine yalnızca yapılandırmaya dayalı özetlere geri döner.

`openclaw sessions`, Gateway `sessions.list` veya aracı
`sessions_list` aracını kanal soket sağlığı sinyali olarak kullanmayın. Bu yüzeyler,
sağlayıcı çalışma zamanı durumunu değil, depolanmış konuşma satırlarını raporlar.
Bir Discord sağlayıcısı yeniden başlatıldıktan sonra, bağlı ama sessiz bir hesap sağlıklı
olabilir; buna karşın bir sonraki gelen veya giden konuşma olayına kadar hiçbir Discord
oturum satırı görünmeyebilir.

## Hesap ekleme / kaldırma

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help`, kanal başına bayrakları gösterir (token, özel anahtar, uygulama token'ı, signal-cli yolları vb.).
</Tip>

`channels remove` yalnızca kurulu/yapılandırılmış kanal Pluginleri üzerinde çalışır. Kurulabilir katalog kanalları için önce `channels add` kullanın.
Çalışma zamanı destekli kanal Pluginleri için `channels remove`, yapılandırmayı güncellemeden önce çalışan Gateway'den seçili hesabı durdurmasını da ister; böylece bir hesabı devre dışı bırakmak veya silmek, yeniden başlatmaya kadar eski dinleyiciyi etkin bırakmaz.

Yaygın etkileşimsiz ekleme yüzeyleri şunları içerir:

- bot-token kanalları: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal/iMessage taşıma alanları: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chat alanları: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrix alanları: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostr alanları: `--private-key`, `--relay-urls`
- Tlon alanları: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- desteklendiğinde varsayılan hesap için env destekli kimlik doğrulamada `--use-env`

Bayrak güdümlü bir ekleme komutu sırasında bir kanal Plugininin kurulması gerekiyorsa OpenClaw, etkileşimli Plugin kurulum istemini açmadan kanalın varsayılan kurulum kaynağını kullanır.

`openclaw channels add` komutunu bayraksız çalıştırdığınızda etkileşimli sihirbaz şunları sorabilir:

- seçilen kanal başına hesap kimlikleri
- bu hesaplar için isteğe bağlı görünen adlar
- `Bind configured channel accounts to agents now?`

Şimdi bağlamayı onaylarsanız sihirbaz, yapılandırılmış her kanal hesabına hangi aracının sahip olması gerektiğini sorar ve hesap kapsamlı yönlendirme bağlamalarını yazar.

Aynı yönlendirme kurallarını daha sonra `openclaw agents bindings`, `openclaw agents bind` ve `openclaw agents unbind` ile de yönetebilirsiniz (bkz. [aracılar](/tr/cli/agents)).

Hâlâ tek hesaplı üst düzey ayarları kullanan bir kanala varsayılan olmayan bir hesap eklediğinizde OpenClaw, yeni hesabı yazmadan önce hesap kapsamlı üst düzey değerleri kanalın hesap eşlemesine yükseltir. Çoğu kanal bu değerleri `channels.<channel>.accounts.default` içine yerleştirir, ancak paketlenmiş kanallar mevcut eşleşen bir yükseltilmiş hesabı bunun yerine koruyabilir. Mevcut örnek Matrix'tir: bir adlandırılmış hesap zaten varsa veya `defaultAccount` mevcut bir adlandırılmış hesabı gösteriyorsa yükseltme, yeni bir `accounts.default` oluşturmak yerine o hesabı korur.

Yönlendirme davranışı tutarlı kalır:

- Mevcut yalnızca kanal bağlamaları (`accountId` yok) varsayılan hesapla eşleşmeye devam eder.
- `channels add`, etkileşimsiz modda bağlamaları otomatik olarak oluşturmaz veya yeniden yazmaz.
- Etkileşimli kurulum isteğe bağlı olarak hesap kapsamlı bağlamalar ekleyebilir.

Yapılandırmanız zaten karma durumdaysa (adlandırılmış hesaplar mevcut ve üst düzey tek hesap değerleri hâlâ ayarlıysa), hesap kapsamlı değerleri o kanal için seçilen yükseltilmiş hesaba taşımak üzere `openclaw doctor --fix` çalıştırın. Çoğu kanal `accounts.default` içine yükseltir; Matrix bunun yerine mevcut bir adlandırılmış/varsayılan hedefi koruyabilir.

## Oturum açma ve kapatma (etkileşimli)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login`, `--verbose` destekler.
- `channels login` ve `logout`, yalnızca bir desteklenen oturum açma hedefi yapılandırılmışsa kanalı çıkarımlayabilir.
- `channels logout`, erişilebilir olduğunda canlı Gateway yolunu tercih eder; böylece kanal kimlik doğrulama durumunu temizlemeden önce etkin dinleyicileri durdurur. Yerel bir Gateway erişilebilir değilse yerel kimlik doğrulama temizliğine geri döner.
- `channels login` komutunu gateway ana makinesindeki bir terminalden çalıştırın. Aracı `exec`, bu etkileşimli oturum açma akışını engeller; mevcut olduğunda `whatsapp_login` gibi kanala özgü aracı oturum açma araçları sohbetten kullanılmalıdır.

## Sorun giderme

- Geniş bir yoklama için `openclaw status --deep` çalıştırın.
- Yönlendirmeli düzeltmeler için `openclaw doctor` kullanın.
- `openclaw channels list`, `Claude: HTTP 403 ... user:profile` yazdırıyor → kullanım anlık görüntüsünün `user:profile` kapsamına ihtiyacı vardır. `--no-usage` kullanın, ya da bir claude.ai oturum anahtarı (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) sağlayın, ya da Claude CLI üzerinden yeniden kimlik doğrulaması yapın.
- Gateway erişilemez olduğunda `openclaw channels status` yalnızca yapılandırmaya dayalı özetlere geri döner. Desteklenen bir kanal kimlik bilgisi SecretRef üzerinden yapılandırılmış ancak geçerli komut yolunda kullanılamıyorsa, o hesabı yapılandırılmamış olarak göstermek yerine bozulmuş notlarla yapılandırılmış olarak raporlar.

## Yetenek yoklaması

Sağlayıcı yetenek ipuçlarını (mevcut olduğunda niyetler/kapsamlar) ve statik özellik desteğini alın:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Notlar:

- `--channel` isteğe bağlıdır; her kanalı (uzantılar dahil) listelemek için bunu atlayın.
- `--account` yalnızca `--channel` ile geçerlidir.
- `--target`, `channel:<id>` veya ham sayısal kanal kimliği kabul eder ve yalnızca Discord için geçerlidir.
- Yoklamalar sağlayıcıya özeldir: Discord niyetleri + isteğe bağlı kanal izinleri; Slack bot + kullanıcı kapsamları; Telegram bot bayrakları + Webhook; Signal arka plan programı sürümü; Microsoft Teams uygulama token'ı + Graph rolleri/kapsamları (bilindiği yerlerde açıklamalı). Yoklaması olmayan kanallar `Probe: unavailable` raporlar.

## Adları kimliklere çözümleme

Sağlayıcı dizinini kullanarak kanal/kullanıcı adlarını kimliklere çözümleyin:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Notlar:

- Hedef türünü zorlamak için `--kind user|group|auto` kullanın.
- Birden çok girdi aynı adı paylaştığında çözümleme etkin eşleşmeleri tercih eder.
- `channels resolve` salt okunurdur. Seçili bir hesap SecretRef üzerinden yapılandırılmış ancak bu kimlik bilgisi geçerli komut yolunda kullanılamıyorsa, komut tüm çalıştırmayı iptal etmek yerine notlarla birlikte bozulmuş çözümlenmemiş sonuçlar döndürür.
- `channels resolve`, kanal Pluginlerini kurmaz. Kurulabilir bir katalog kanalı için adları çözümlemeden önce `channels add --channel <name>` kullanın.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Kanallara genel bakış](/tr/channels)
