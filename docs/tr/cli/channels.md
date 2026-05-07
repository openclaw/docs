---
read_when:
    - WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix kanal hesaplarını eklemek/kaldırmak istiyorsunuz
    - Kanal durumunu kontrol etmek veya kanal günlüklerini takip etmek istiyorsunuz
summary: '`openclaw channels` için CLI başvurusu (hesaplar, durum, oturum açma/oturumu kapatma, günlükler)'
title: Kanallar
x-i18n:
    generated_at: "2026-05-07T13:13:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: a78d7a5306c822314052151e0a9aa8bed347481f59d9a19f92240dfa562e4b23
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Gateway üzerinde sohbet kanalı hesaplarını ve çalışma zamanı durumlarını yönetin.

İlgili dokümanlar:

- Kanal kılavuzları: [Kanallar](/tr/channels)
- Gateway yapılandırması: [Yapılandırma](/tr/gateway/configuration)

## Yaygın komutlar

```bash
openclaw channels list
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` yalnızca sohbet kanallarını gösterir: varsayılan olarak yapılandırılmış hesapları, hesap başına `installed`, `configured` ve `enabled` durum etiketleriyle birlikte listeler. Henüz yapılandırılmış hesabı olmayan paketli kanalları ve diskte henüz bulunmayan kurulabilir katalog kanallarını da göstermek için `--all` geçin. Kimlik doğrulama sağlayıcıları (OAuth + API anahtarları) ve model sağlayıcı kullanım/kota anlık görüntüleri artık burada yazdırılmaz; sağlayıcı kimlik doğrulama profilleri için `openclaw models auth list`, kullanım için `openclaw status` veya `openclaw models list` kullanın.

## Durum / yetenekler / çözümleme / günlükler

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (yalnızca `--channel` ile), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` canlı yoldur: erişilebilir bir gateway üzerinde hesap başına
`probeAccount` ve isteğe bağlı `auditAccount` kontrollerini çalıştırır, bu yüzden çıktı aktarım
durumunun yanı sıra `works`, `probe failed`, `audit ok` veya `audit failed` gibi yoklama sonuçlarını içerebilir.
Gateway erişilemez durumdaysa `channels status`, canlı yoklama çıktısı yerine yalnızca yapılandırma özetlerine
geri döner.

`openclaw sessions`, Gateway `sessions.list` veya aracı
`sessions_list` aracını kanal soketi sağlık sinyali olarak kullanmayın. Bu yüzeyler
sağlayıcı çalışma zamanı durumunu değil, saklanan konuşma satırlarını raporlar. Bir Discord sağlayıcısı
yeniden başlatıldıktan sonra, bağlı ama sessiz bir hesap sağlıklı olabilir; ancak bir sonraki gelen veya giden konuşma olayına kadar hiçbir Discord oturum
satırı görünmeyebilir.

## Hesap ekleme / kaldırma

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help`, kanal başına bayrakları gösterir (token, özel anahtar, uygulama token'ı, signal-cli yolları vb.).
</Tip>

`channels remove` yalnızca kurulu/yapılandırılmış kanal Plugin'leri üzerinde çalışır. Kurulabilir katalog kanalları için önce `channels add` kullanın.
Çalışma zamanı destekli kanal Plugin'lerinde `channels remove`, yapılandırmayı güncellemeden önce çalışan Gateway'den seçilen hesabı durdurmasını da ister; böylece bir hesabı devre dışı bırakmak veya silmek, yeniden başlatmaya kadar eski dinleyiciyi etkin bırakmaz.

Yaygın etkileşimsiz ekleme yüzeyleri şunları içerir:

- bot-token kanalları: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal/iMessage aktarım alanları: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chat alanları: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrix alanları: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostr alanları: `--private-key`, `--relay-urls`
- Tlon alanları: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- desteklendiği yerlerde varsayılan hesap ortam destekli kimlik doğrulaması için `--use-env`

Bayraklarla yürütülen bir ekleme komutu sırasında bir kanal Plugin'inin kurulması gerekiyorsa OpenClaw, etkileşimli Plugin kurulum istemini açmadan kanalın varsayılan kurulum kaynağını kullanır.

`openclaw channels add` komutunu bayraksız çalıştırdığınızda etkileşimli sihirbaz şunları sorabilir:

- seçilen kanal başına hesap kimlikleri
- bu hesaplar için isteğe bağlı görünen adlar
- `Bind configured channel accounts to agents now?`

Şimdi bağlamayı onaylarsanız sihirbaz, yapılandırılmış her kanal hesabına hangi aracının sahip olması gerektiğini sorar ve hesap kapsamlı yönlendirme bağlamaları yazar.

Aynı yönlendirme kurallarını daha sonra `openclaw agents bindings`, `openclaw agents bind` ve `openclaw agents unbind` ile de yönetebilirsiniz (bkz. [aracılar](/tr/cli/agents)).

Hâlâ tek hesaplı üst düzey ayarları kullanan bir kanala varsayılan olmayan bir hesap eklediğinizde OpenClaw, yeni hesabı yazmadan önce hesap kapsamlı üst düzey değerleri kanalın hesap eşlemesine yükseltir. Çoğu kanal bu değerleri `channels.<channel>.accounts.default` içine yerleştirir, ancak paketli kanallar bunun yerine mevcut eşleşen yükseltilmiş bir hesabı koruyabilir. Güncel örnek Matrix'tir: zaten bir adlandırılmış hesap varsa veya `defaultAccount` mevcut bir adlandırılmış hesabı gösteriyorsa yükseltme, yeni bir `accounts.default` oluşturmak yerine bu hesabı korur.

Yönlendirme davranışı tutarlı kalır:

- Mevcut yalnızca kanal bağlamaları (`accountId` yok) varsayılan hesapla eşleşmeye devam eder.
- `channels add`, etkileşimsiz modda bağlamaları otomatik olarak oluşturmaz veya yeniden yazmaz.
- Etkileşimli kurulum isteğe bağlı olarak hesap kapsamlı bağlamalar ekleyebilir.

Yapılandırmanız zaten karma durumdaysa (adlandırılmış hesaplar mevcut ve üst düzey tek hesap değerleri hâlâ ayarlıysa), hesap kapsamlı değerleri ilgili kanal için seçilen yükseltilmiş hesaba taşımak üzere `openclaw doctor --fix` çalıştırın. Çoğu kanal `accounts.default` içine yükseltir; Matrix bunun yerine mevcut bir adlandırılmış/varsayılan hedefi koruyabilir.

## Oturum açma ve kapatma (etkileşimli)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login`, `--verbose` destekler.
- Yalnızca bir desteklenen oturum açma hedefi yapılandırılmışsa `channels login` ve `logout` kanalı çıkarımlayabilir.
- `channels logout`, erişilebilir olduğunda canlı Gateway yolunu tercih eder; böylece oturum kapatma, kanal kimlik doğrulama durumunu temizlemeden önce etkin dinleyicileri durdurur. Yerel bir Gateway erişilebilir değilse yerel kimlik doğrulama temizliğine geri döner.
- `channels login` komutunu gateway ana makinesindeki bir terminalden çalıştırın. Aracı `exec`, bu etkileşimli oturum açma akışını engeller; mevcut olduğunda sohbetten `whatsapp_login` gibi kanala özgü aracı oturum açma araçları kullanılmalıdır.

## Sorun giderme

- Geniş kapsamlı bir yoklama için `openclaw status --deep` çalıştırın.
- Kılavuzlu düzeltmeler için `openclaw doctor` kullanın.
- `openclaw channels list` artık model sağlayıcı kullanım/kota anlık görüntülerini yazdırmaz. Bunlar için `openclaw status` (genel bakış) veya `openclaw models list` (sağlayıcı başına) kullanın.
- Gateway erişilemez durumdaysa `openclaw channels status`, yalnızca yapılandırma özetlerine geri döner. Desteklenen bir kanal kimlik bilgisi SecretRef aracılığıyla yapılandırılmış ancak geçerli komut yolunda kullanılamıyorsa, hesabı yapılandırılmamış göstermek yerine bozulmuş notlarla yapılandırılmış olarak raporlar.

## Yetenek yoklaması

Sağlayıcı yetenek ipuçlarını (mevcut olduğunda intent'ler/kapsamlar) ve statik özellik desteğini alın:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Notlar:

- `--channel` isteğe bağlıdır; tüm kanalları (extensions dahil) listelemek için atlayın.
- `--account` yalnızca `--channel` ile geçerlidir.
- `--target`, `channel:<id>` veya ham sayısal kanal kimliği kabul eder ve yalnızca Discord için geçerlidir. Discord ses kanalları için izin kontrolü eksik `ViewChannel`, `Connect`, `Speak`, `SendMessages` ve `ReadMessageHistory` bayraklarını işaretler.
- Yoklamalar sağlayıcıya özeldir: Discord intent'leri + isteğe bağlı kanal izinleri; Slack bot + kullanıcı kapsamları; Telegram bot bayrakları + Webhook; Signal daemon sürümü; Microsoft Teams uygulama token'ı + Graph rolleri/kapsamları (bilindiği yerlerde açıklamalı). Yoklaması olmayan kanallar `Probe: unavailable` raporlar.

## Adları kimliklere çözümleme

Sağlayıcı dizinini kullanarak kanal/kullanıcı adlarını kimliklere çözümleyin:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Notlar:

- Hedef türünü zorlamak için `--kind user|group|auto` kullanın.
- Birden fazla giriş aynı adı paylaştığında çözümleme etkin eşleşmeleri tercih eder.
- `channels resolve` salt okunurdur. Seçilen bir hesap SecretRef aracılığıyla yapılandırılmışsa ancak bu kimlik bilgisi geçerli komut yolunda kullanılamıyorsa, komut tüm çalıştırmayı iptal etmek yerine notlarla birlikte bozulmuş çözümlenmemiş sonuçlar döndürür.
- `channels resolve`, kanal Plugin'lerini kurmaz. Kurulabilir bir katalog kanalı için adları çözümlemeden önce `channels add --channel <name>` kullanın.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Kanallara genel bakış](/tr/channels)
