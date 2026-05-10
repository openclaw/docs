---
read_when:
    - WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix kanal hesapları eklemek/kaldırmak istiyorsunuz
    - Kanal durumunu kontrol etmek veya kanal günlüklerini takip etmek istiyorsunuz
summary: '`openclaw channels` için CLI başvurusu (hesaplar, durum, oturum açma/oturum kapatma, günlükler)'
title: Kanallar
x-i18n:
    generated_at: "2026-05-10T19:28:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: e860f2863e148a46b9beb7f855eb9f30addc1b012f1430bf33c544c5e321821d
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Gateway üzerindeki sohbet kanalı hesaplarını ve bunların çalışma zamanı durumunu yönetin.

İlgili belgeler:

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

`channels list` yalnızca sohbet kanallarını gösterir: varsayılan olarak yapılandırılmış hesapları, her hesap için `installed`, `configured` ve `enabled` durum etiketleriyle listeler. Henüz yapılandırılmış hesabı olmayan paketlenmiş kanalları ve henüz diskte bulunmayan kurulabilir katalog kanallarını da göstermek için `--all` iletin. Kimlik doğrulama sağlayıcıları (OAuth + API anahtarları) ve model sağlayıcısı kullanım/kota anlık görüntüleri artık burada yazdırılmaz; sağlayıcı kimlik doğrulama profilleri için `openclaw models auth list`, kullanım için `openclaw status` veya `openclaw models list` kullanın.

## Durum / yetenekler / çözümleme / günlükler

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (yalnızca `--channel` ile), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` canlı yoldur: erişilebilir bir Gateway üzerinde hesap başına
`probeAccount` ve isteğe bağlı `auditAccount` denetimlerini çalıştırır; bu nedenle çıktı,
taşıma durumunun yanı sıra `works`, `probe failed`, `audit ok` veya `audit failed`
gibi yoklama sonuçlarını içerebilir. Gateway erişilebilir değilse `channels status`,
canlı yoklama çıktısı yerine yalnızca yapılandırmaya dayalı özetlere geri döner.

Kanal soketi sağlık sinyali olarak `openclaw sessions`, Gateway `sessions.list` veya ajan
`sessions_list` aracını kullanmayın. Bu yüzeyler sağlayıcı çalışma zamanı durumunu değil,
saklanan konuşma satırlarını bildirir. Bir Discord sağlayıcısı yeniden başlatıldıktan sonra,
bağlı ama sessiz bir hesap sağlıklı olabilir; buna karşılık bir sonraki gelen veya giden
konuşma olayına kadar hiçbir Discord oturumu satırı görünmeyebilir.

## Hesap ekleme / kaldırma

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help`, kanal başına bayrakları (token, özel anahtar, uygulama token'ı, signal-cli yolları vb.) gösterir.
</Tip>

`channels remove` yalnızca kurulu/yapılandırılmış kanal plugin'leri üzerinde çalışır. Kurulabilir katalog kanalları için önce `channels add` kullanın.
Çalışma zamanı destekli kanal plugin'lerinde `channels remove`, yapılandırmayı güncellemeden önce seçili hesabı durdurmasını çalışan Gateway'den de ister; böylece bir hesabı devre dışı bırakmak veya silmek, eski dinleyicinin yeniden başlatmaya kadar etkin kalmasına neden olmaz.

Yaygın etkileşimsiz ekleme yüzeyleri şunları içerir:

- bot-token kanalları: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal/iMessage taşıma alanları: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chat alanları: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrix alanları: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostr alanları: `--private-key`, `--relay-urls`
- Tlon alanları: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- desteklendiği yerlerde varsayılan hesap için ortam destekli kimlik doğrulama amacıyla `--use-env`

Bayraklarla yürütülen bir ekleme komutu sırasında bir kanal plugin'inin kurulması gerekiyorsa OpenClaw, etkileşimli plugin kurulum istemini açmadan kanalın varsayılan kurulum kaynağını kullanır.

`openclaw channels add` komutunu bayraksız çalıştırdığınızda etkileşimli sihirbaz şunları sorabilir:

- seçilen kanal başına hesap kimlikleri
- bu hesaplar için isteğe bağlı görünen adlar
- `Route these channel accounts to agents now?`

Şimdi bağlamayı onaylarsanız sihirbaz, yapılandırılmış her kanal hesabının hangi ajana ait olması gerektiğini sorar ve hesap kapsamlı yönlendirme bağlamalarını yazar.

Aynı yönlendirme kurallarını daha sonra `openclaw agents bindings`, `openclaw agents bind` ve `openclaw agents unbind` ile de yönetebilirsiniz (bkz. [ajanlar](/tr/cli/agents)).

Hâlâ tek hesaplı üst düzey ayarları kullanan bir kanala varsayılan olmayan bir hesap eklediğinizde OpenClaw, yeni hesabı yazmadan önce hesap kapsamlı üst düzey değerleri kanalın hesap haritasına yükseltir. Çoğu kanal bu değerleri `channels.<channel>.accounts.default` içine yerleştirir, ancak paketlenmiş kanallar bunun yerine mevcut eşleşen yükseltilmiş bir hesabı koruyabilir. Matrix güncel örnektir: zaten bir adlandırılmış hesap varsa veya `defaultAccount` mevcut bir adlandırılmış hesabı gösteriyorsa, yükseltme yeni bir `accounts.default` oluşturmak yerine bu hesabı korur.

Yönlendirme davranışı tutarlı kalır:

- Mevcut yalnızca kanal bağlamaları (`accountId` yok) varsayılan hesapla eşleşmeye devam eder.
- `channels add`, etkileşimsiz modda bağlamaları otomatik olarak oluşturmaz veya yeniden yazmaz.
- Etkileşimli kurulum isteğe bağlı olarak hesap kapsamlı bağlamalar ekleyebilir.

Yapılandırmanız zaten karma bir durumdaysa (adlandırılmış hesaplar mevcut ve üst düzey tek hesap değerleri hâlâ ayarlanmışsa), hesap kapsamlı değerleri o kanal için seçilen yükseltilmiş hesaba taşımak üzere `openclaw doctor --fix` çalıştırın. Çoğu kanal `accounts.default` içine yükseltir; Matrix bunun yerine mevcut bir adlandırılmış/varsayılan hedefi koruyabilir.

## Oturum açma ve kapatma (etkileşimli)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login`, `--verbose` destekler.
- `channels login` ve `logout`, yalnızca bir desteklenen oturum açma hedefi yapılandırılmışsa kanalı çıkarımlayabilir.
- `channels logout`, erişilebilir olduğunda canlı Gateway yolunu tercih eder; böylece oturum kapatma, kanal kimlik doğrulama durumunu temizlemeden önce etkin dinleyicileri durdurur. Yerel bir Gateway erişilebilir değilse yerel kimlik doğrulama temizliğine geri döner.
- `channels login` komutunu gateway ana makinesindeki bir terminalden çalıştırın. Ajan `exec`, bu etkileşimli oturum açma akışını engeller; `whatsapp_login` gibi kanala özgü ajan oturum açma araçları mevcut olduğunda sohbetten kullanılmalıdır.

## Sorun giderme

- Geniş bir yoklama için `openclaw status --deep` çalıştırın.
- Kılavuzlu düzeltmeler için `openclaw doctor` kullanın.
- `openclaw channels list` artık model sağlayıcısı kullanım/kota anlık görüntülerini yazdırmaz. Bunlar için `openclaw status` (genel bakış) veya `openclaw models list` (sağlayıcı başına) kullanın.
- Gateway erişilebilir olmadığında `openclaw channels status`, yalnızca yapılandırmaya dayalı özetlere geri döner. Desteklenen bir kanal kimlik bilgisi SecretRef üzerinden yapılandırılmış ancak geçerli komut yolunda kullanılamıyorsa, hesabı yapılandırılmamış olarak göstermek yerine, zayıflama notlarıyla yapılandırılmış olarak bildirir.

## Yetenek yoklaması

Sağlayıcı yetenek ipuçlarını (mevcut olduğunda amaçlar/kapsamlar) ve statik özellik desteğini alın:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Notlar:

- `--channel` isteğe bağlıdır; her kanalı (eklentiler dahil) listelemek için atlayın.
- `--account` yalnızca `--channel` ile geçerlidir.
- `--target`, `channel:<id>` veya ham sayısal kanal kimliğini kabul eder ve yalnızca Discord için geçerlidir. Discord ses kanallarında izin denetimi eksik `ViewChannel`, `Connect`, `Speak`, `SendMessages` ve `ReadMessageHistory` izinlerini işaretler.
- Yoklamalar sağlayıcıya özeldir: Discord amaçları + isteğe bağlı kanal izinleri; Slack bot + kullanıcı kapsamları; Telegram bot bayrakları + Webhook; Signal daemon sürümü; Microsoft Teams uygulama token'ı + Graph rolleri/kapsamları (bilindiği yerlerde notlandırılır). Yoklaması olmayan kanallar `Probe: unavailable` bildirir.

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
- `channels resolve` salt okunurdur. Seçili bir hesap SecretRef üzerinden yapılandırılmış ancak bu kimlik bilgisi geçerli komut yolunda kullanılamıyorsa, komut tüm çalıştırmayı sonlandırmak yerine notlarla birlikte zayıflamış çözümlenmemiş sonuçlar döndürür.
- `channels resolve`, kanal plugin'lerini kurmaz. Kurulabilir bir katalog kanalı için adları çözümlemeden önce `channels add --channel <name>` kullanın.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Kanallar genel bakışı](/tr/channels)
