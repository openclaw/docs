---
read_when:
    - Kanal hesaplarını eklemek/kaldırmak istiyorsunuz (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Kanal durumunu kontrol etmek veya kanal günlüklerini takip etmek istiyorsunuz
summary: '`openclaw channels` için CLI referansı (hesaplar, durum, oturum açma/oturumu kapatma, günlükler)'
title: Kanallar
x-i18n:
    generated_at: "2026-05-11T20:25:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 58a964b4db9526defab6ee47b7a99c11086e345d42c8d20f5262fc134337947f
    source_path: cli/channels.md
    workflow: 16
    postprocess_version: locale-links-v1
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

`channels list` yalnızca sohbet kanallarını gösterir: varsayılan olarak yapılandırılmış hesaplar ve her hesap için `installed`, `configured` ve `enabled` durum etiketleri. Henüz yapılandırılmış hesabı olmayan paketlenmiş kanalları ve henüz diskte bulunmayan kurulabilir katalog kanallarını da göstermek için `--all` iletin. Kimlik doğrulama sağlayıcıları (OAuth + API anahtarları) ve model sağlayıcısı kullanım/kota anlık görüntüleri artık burada yazdırılmaz; sağlayıcı kimlik doğrulama profilleri için `openclaw models auth list`, kullanım için `openclaw status` veya `openclaw models list` kullanın.

## Durum / yetenekler / çözümleme / günlükler

- `channels status`: `--channel <name>`, `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (yalnızca `--channel` ile), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` canlı yoldur: erişilebilir bir Gateway üzerinde hesap başına
`probeAccount` ve isteğe bağlı `auditAccount` kontrollerini çalıştırır; bu nedenle çıktı,
aktarım durumunun yanı sıra `works`, `probe failed`, `audit ok` veya `audit failed`
gibi yoklama sonuçlarını içerebilir. Gateway erişilemezse, `channels status` canlı yoklama
çıktısı yerine yalnızca yapılandırmaya dayalı özetlere geri döner.

Kanal soketi sağlık sinyali olarak `openclaw sessions`, Gateway `sessions.list` veya ajan
`sessions_list` aracını kullanmayın. Bu yüzeyler sağlayıcı çalışma zamanı durumunu değil,
saklanan konuşma satırlarını raporlar. Bir Discord sağlayıcısı yeniden başlatıldıktan sonra,
bağlı ama sessiz bir hesap sağlıklı olabilir; buna karşın bir sonraki gelen veya giden
konuşma olayına kadar hiçbir Discord oturum satırı görünmeyebilir.

## Hesap ekleme / kaldırma

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` kanal başına bayrakları (token, özel anahtar, uygulama token'ı, signal-cli yolları vb.) gösterir.
</Tip>

`channels remove` yalnızca kurulmuş/yapılandırılmış kanal Plugin'leri üzerinde çalışır. Kurulabilir katalog kanalları için önce `channels add` kullanın.
Çalışma zamanı destekli kanal Plugin'lerinde, `channels remove` yapılandırmayı güncellemeden önce çalışan Gateway'den seçili hesabı durdurmasını da ister; böylece bir hesabı devre dışı bırakmak veya silmek, yeniden başlatmaya kadar eski dinleyiciyi etkin bırakmaz.

Yaygın etkileşimsiz ekleme yüzeyleri şunları içerir:

- bot-token kanalları: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal/iMessage aktarım alanları: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chat alanları: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrix alanları: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostr alanları: `--private-key`, `--relay-urls`
- Tlon alanları: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- desteklenen yerlerde varsayılan hesap için ortam değişkeni destekli kimlik doğrulamada `--use-env`

Bayraklarla yürütülen bir ekleme komutu sırasında bir kanal Plugin'inin kurulması gerekiyorsa OpenClaw, etkileşimli Plugin kurulum istemini açmadan kanalın varsayılan kurulum kaynağını kullanır.

`openclaw channels add` komutunu bayraksız çalıştırdığınızda, etkileşimli sihirbaz şunları sorabilir:

- seçili kanal başına hesap kimlikleri
- bu hesaplar için isteğe bağlı görünen adlar
- `Route these channel accounts to agents now?`

Şimdi bağlamayı onaylarsanız, sihirbaz yapılandırılan her kanal hesabına hangi ajanın sahip olması gerektiğini sorar ve hesap kapsamlı yönlendirme bağlamalarını yazar.

Aynı yönlendirme kurallarını daha sonra `openclaw agents bindings`, `openclaw agents bind` ve `openclaw agents unbind` ile de yönetebilirsiniz (bkz. [ajanlar](/tr/cli/agents)).

Hâlâ tek hesaplı üst düzey ayarları kullanan bir kanala varsayılan olmayan bir hesap eklediğinizde, OpenClaw yeni hesabı yazmadan önce hesap kapsamlı üst düzey değerleri kanalın hesap eşlemesine yükseltir. Çoğu kanal bu değerleri `channels.<channel>.accounts.default` içine yerleştirir, ancak paketlenmiş kanallar bunun yerine mevcut eşleşen yükseltilmiş bir hesabı koruyabilir. Mevcut örnek Matrix'tir: zaten bir adlandırılmış hesap varsa veya `defaultAccount` mevcut bir adlandırılmış hesabı işaret ediyorsa, yükseltme yeni bir `accounts.default` oluşturmak yerine o hesabı korur.

Yönlendirme davranışı tutarlı kalır:

- Mevcut yalnızca kanal bağlamaları (`accountId` yok) varsayılan hesapla eşleşmeye devam eder.
- `channels add` etkileşimsiz modda bağlamaları otomatik oluşturmaz veya yeniden yazmaz.
- Etkileşimli kurulum isteğe bağlı olarak hesap kapsamlı bağlamalar ekleyebilir.

Yapılandırmanız zaten karma bir durumdaysa (adlandırılmış hesaplar mevcut ve üst düzey tek hesap değerleri hâlâ ayarlıysa), hesap kapsamlı değerleri o kanal için seçilen yükseltilmiş hesaba taşımak üzere `openclaw doctor --fix` çalıştırın. Çoğu kanal `accounts.default` içine yükseltir; Matrix bunun yerine mevcut bir adlandırılmış/varsayılan hedefi koruyabilir.

## Oturum açma ve oturumu kapatma (etkileşimli)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login`, `--verbose` destekler.
- `channels login` ve `logout`, yalnızca bir desteklenen oturum açma hedefi yapılandırılmışsa kanalı çıkarımlayabilir.
- `channels logout`, erişilebilir olduğunda canlı Gateway yolunu tercih eder; böylece oturumu kapatma, kanal kimlik doğrulama durumunu temizlemeden önce tüm etkin dinleyicileri durdurur. Yerel Gateway erişilebilir değilse, yerel kimlik doğrulama temizliğine geri döner.
- `channels login` komutunu Gateway ana makinesindeki bir terminalden çalıştırın. Ajan `exec`, bu etkileşimli oturum açma akışını engeller; mevcut olduğunda sohbetten `whatsapp_login` gibi kanala özgü ajan oturum açma araçları kullanılmalıdır.

## Sorun giderme

- Geniş kapsamlı bir yoklama için `openclaw status --deep` çalıştırın.
- Rehberli düzeltmeler için `openclaw doctor` kullanın.
- `openclaw channels list` artık model sağlayıcısı kullanım/kota anlık görüntülerini yazdırmaz. Bunlar için `openclaw status` (genel bakış) veya `openclaw models list` (sağlayıcı başına) kullanın.
- Gateway erişilemez olduğunda `openclaw channels status` yalnızca yapılandırmaya dayalı özetlere geri döner. Desteklenen bir kanal kimlik bilgisi SecretRef aracılığıyla yapılandırılmış ancak geçerli komut yolunda kullanılamıyorsa, o hesabı yapılandırılmamış göstermek yerine, zayıflama notlarıyla yapılandırılmış olarak raporlar.

## Yetenek yoklaması

Sağlayıcı yetenek ipuçlarını (mevcut olduğu yerlerde intent/scope) ve statik özellik desteğini getirin:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Notlar:

- `--channel` isteğe bağlıdır; her kanalı (Plugin'ler dahil) listelemek için bunu atlayın.
- `--account` yalnızca `--channel` ile geçerlidir.
- `--target`, `channel:<id>` veya ham sayısal kanal kimliği kabul eder ve yalnızca Discord için geçerlidir. Discord ses kanallarında izin denetimi eksik `ViewChannel`, `Connect`, `Speak`, `SendMessages` ve `ReadMessageHistory` izinlerini işaretler.
- Yoklamalar sağlayıcıya özeldir: Discord intent'leri + isteğe bağlı kanal izinleri; Slack bot + kullanıcı scope'ları; Telegram bot bayrakları + Webhook; Signal daemon sürümü; Microsoft Teams uygulama token'ı + Graph rolleri/scope'ları (bilindiği yerlerde notlandırılmış). Yoklaması olmayan kanallar `Probe: unavailable` raporlar.

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
- `channels resolve` salt okunurdur. Seçili bir hesap SecretRef aracılığıyla yapılandırılmış ancak bu kimlik bilgisi geçerli komut yolunda kullanılamıyorsa, komut tüm çalıştırmayı durdurmak yerine notlarla birlikte zayıflamış çözümlenmemiş sonuçlar döndürür.
- `channels resolve` kanal Plugin'lerini kurmaz. Kurulabilir bir katalog kanalı için adları çözümlemeden önce `channels add --channel <name>` kullanın.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Kanallara genel bakış](/tr/channels)
