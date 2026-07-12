---
read_when:
    - Kanal hesapları (Discord, Google Chat, iMessage, Matrix, Signal, Slack, Telegram, WhatsApp ve daha fazlası) eklemek veya kaldırmak istiyorsunuz
    - Kanal durumunu kontrol etmek veya kanal günlüklerini canlı izlemek istiyorsunuz
summary: '`openclaw channels` için CLI başvurusu (hesaplar, durum, yetenekler, çözümleme, günlükler, oturum açma/oturumu kapatma)'
title: Kanallar
x-i18n:
    generated_at: "2026-07-12T12:08:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41220535917d645e87dca82bc5c27319eff0035fe14a8cb18f001192b3aad5bd
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
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` yalnızca sohbet kanallarını gösterir: varsayılan olarak yapılandırılmış hesaplar ve hesap başına `installed`, `configured` ve `enabled` durum etiketleri (`--json` makine çıktısı içindir). Henüz yapılandırılmış hesabı olmayan paketle gelen kanalları ve henüz diskte bulunmayan, katalogdan kurulabilir kanalları da göstermek için `--all` seçeneğini kullanın. Sağlayıcı kimlik doğrulaması ve model kullanımı başka yerlerde bulunur: sağlayıcı kimlik doğrulama profilleri için `openclaw models auth list`, kullanım/kota için `openclaw status` veya `openclaw models list`.

## Durum / yetenekler / çözümleme / günlükler

- `channels status`: `--channel <name>`, `--probe`, `--timeout <ms>` (varsayılan `10000`), `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (`--channel` gerektirir), `--target <dest>` (`--channel` gerektirir), `--timeout <ms>` (varsayılan `10000`, üst sınır `30000`), `--json`
- `channels resolve <entries...>`: `--channel <name>`, `--account <id>`, `--kind <auto|user|group>` (varsayılan `auto`), `--json`
- `channels logs`: `--channel <name|all>` (varsayılan `all`), `--lines <n>` (varsayılan `200`), `--json`

`channels status --probe` canlı yoldur: erişilebilir bir Gateway üzerinde hesap başına
`probeAccount` ve isteğe bağlı `auditAccount` kontrollerini çalıştırır; dolayısıyla çıktı, aktarım
durumunun yanı sıra `works`, `probe failed`, `audit ok` veya `audit failed` gibi yoklama sonuçlarını
da içerebilir. Gateway'e erişilemiyorsa `channels status`, canlı yoklama çıktısı yerine yalnızca
yapılandırmaya dayalı özetlere geri döner.

Kanal soketi sağlığının göstergesi olarak `openclaw sessions`, Gateway `sessions.list` veya
ajanın `sessions_list` aracını kullanmayın. Bu yüzeyler sağlayıcı çalışma zamanı durumunu değil,
saklanan konuşma satırlarını bildirir. Bir Discord sağlayıcısı yeniden başlatıldıktan sonra, bağlı
ancak sessiz bir hesap sağlıklı olabilir; buna karşın bir sonraki gelen veya giden konuşma olayına
kadar hiçbir Discord oturumu satırı görünmeyebilir.

## Hesap ekleme / kaldırma

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help`, kanala özgü bayrakları (belirteç, özel anahtar, uygulama belirteci, signal-cli yolları vb.) gösterir.
</Tip>

`channels remove` yalnızca kurulu/yapılandırılmış kanal Plugin'leri üzerinde çalışır. Katalogdan kurulabilir kanallar için önce `channels add` kullanın. `--delete` olmadan hesabı devre dışı bırakmayı sorar ve yapılandırmasını korur; `--delete`, yapılandırma girdilerini sormadan kaldırır.
Çalışma zamanı destekli kanal Plugin'lerinde `channels remove`, yapılandırmayı güncellemeden önce çalışan Gateway'den seçilen hesabı durdurmasını da ister; böylece bir hesabı devre dışı bırakmak veya silmek, eski dinleyiciyi yeniden başlatmaya kadar etkin bırakmaz.

Kanallar arasında paylaşılan etkileşimsiz ekleme bayrakları: `--account <id>`, `--name <name>`, `--token`, `--token-file`, `--bot-token`, `--app-token`, `--secret`, `--secret-file`, `--password`, `--cli-path`, `--url`, `--base-url`, `--http-url`, `--auth-dir` ve `--use-env` (ortam değişkeni destekli kimlik doğrulama; desteklendiği yerlerde yalnızca varsayılan hesap). Kanala özgü bayraklar şunlardır:

| Kanal       | Bayraklar                                                                                            |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Google Chat | `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`                                   |
| iMessage    | `--cli-path`, `--db-path`, `--service`, `--region`                                                   |
| Matrix      | `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit` |
| Nostr       | `--private-key`, `--relay-urls`                                                                      |
| Signal      | `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`                          |
| Tlon        | `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`        |
| WhatsApp    | `--auth-dir`                                                                                         |

Bayraklarla yürütülen bir ekleme komutu sırasında bir kanal Plugin'inin kurulması gerekiyorsa OpenClaw, etkileşimli Plugin kurulum istemini açmadan kanalın varsayılan kurulum kaynağını kullanır.

`openclaw channels add` komutunu bayraksız çalıştırdığınızda etkileşimli sihirbaz şunları sorabilir:

- seçilen kanal başına hesap kimlikleri
- bu hesaplar için isteğe bağlı görünen adlar
- `Route these channel accounts to agents now?`

Şimdi bağlamayı onaylarsanız sihirbaz, yapılandırılmış her kanal hesabına hangi ajanın sahip olması gerektiğini sorar ve hesap kapsamlı yönlendirme bağlamalarını yazar.

Aynı yönlendirme kurallarını daha sonra `openclaw agents bindings`, `openclaw agents bind` ve `openclaw agents unbind` ile de yönetebilirsiniz (bkz. [ajanlar](/tr/cli/agents)).

Hâlâ tek hesaplı üst düzey ayarları kullanan bir kanala varsayılan olmayan bir hesap eklediğinizde OpenClaw, yeni hesabı yazmadan önce bu üst düzey değerleri kanalın hesap eşlemesine yükseltir. Kanalda tam olarak bir tane adlandırılmış hesap varsa veya `defaultAccount` bunlardan birini gösteriyorsa yükseltme mevcut adlandırılmış hesabı yeniden kullanır; aksi takdirde değerler `channels.<channel>.accounts.default` konumuna yerleştirilir.

Yönlendirme davranışı tutarlı kalır:

- Mevcut yalnızca kanal bağlamaları (`accountId` olmadan) varsayılan hesapla eşleşmeye devam eder.
- `channels add`, etkileşimsiz modda bağlamaları otomatik olarak oluşturmaz veya yeniden yazmaz.
- Etkileşimli kurulum isteğe bağlı olarak hesap kapsamlı bağlamalar ekleyebilir.

Yapılandırmanız zaten karma durumdaysa (adlandırılmış hesaplar mevcutken üst düzey tek hesap değerleri hâlâ ayarlıysa), hesap kapsamlı değerleri ilgili kanal için seçilen yükseltilmiş hesaba taşımak üzere `openclaw doctor --fix` komutunu çalıştırın.

## Oturum açma ve kapatma (etkileşimli)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login`, `--account <id>` ve `--verbose` seçeneklerini; `channels logout` ise `--account <id>` seçeneğini destekler.
- Yalnızca yapılandırılmış tek bir kanal ilgili eylemi destekliyorsa `channels login` ve `logout` kanalı çıkarabilir; birden fazla kanal varsa `--channel` seçeneğini belirtin.
- `channels logout`, erişilebildiğinde canlı Gateway yolunu tercih eder; böylece kanal kimlik doğrulama durumunu temizlemeden önce etkin dinleyicileri durdurur. Yerel bir Gateway'e erişilemiyorsa yerel kimlik doğrulama temizliğine geri döner; `gateway.mode: "remote"` kullanıldığında ise Gateway hatası komutun başarısız olmasına neden olur.
- Başarılı bir oturum açmanın ardından CLI, erişilebilir yerel bir Gateway'den hesabı başlatmasını ister; uzak modda kimlik doğrulamasını yerel olarak kaydeder ve uzak çalışma zamanının yeniden başlatılmadığını belirtir.
- `channels login` komutunu Gateway ana makinesindeki bir terminalden çalıştırın. Ajan `exec`, bu etkileşimli oturum açma akışını engeller; mevcut olduğunda sohbetten `whatsapp_login` gibi kanala özgü ajan oturum açma araçları kullanılmalıdır.

## Sorun giderme

- Geniş kapsamlı bir yoklama için `openclaw status --deep` komutunu çalıştırın.
- Yönlendirmeli düzeltmeler için `openclaw doctor` kullanın.
- Gateway'e erişilemediğinde `openclaw channels status`, yalnızca yapılandırmaya dayalı özetlere geri döner. Desteklenen bir kanal kimlik bilgisi SecretRef aracılığıyla yapılandırılmış ancak geçerli komut yolunda kullanılamıyorsa, hesabı yapılandırılmamış olarak göstermek yerine düşürülmüş durum notlarıyla yapılandırılmış olarak bildirir.

## Yetenek yoklaması

Sağlayıcı yetenek ipuçlarını (mevcut olduğunda amaçlar/kapsamlar) ve statik özellik desteğini alın:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Notlar:

- `--channel` isteğe bağlıdır; tüm kanalları (Plugin tarafından sağlanan kanallar dâhil) listelemek için bunu atlayın.
- `--account` yalnızca `--channel` ile geçerlidir.
- `--target`, `channel:<id>` veya ham sayısal kanal kimliği kabul eder ve yalnızca Discord için geçerlidir. Discord ses kanallarında izin denetimi eksik `ViewChannel`, `Connect`, `Speak`, `SendMessages` ve `ReadMessageHistory` izinlerini işaretler.
- Yoklamalar sağlayıcıya özgüdür: Discord bot kimliği + amaçlar ve isteğe bağlı kanal izinleri; Slack bot + kullanıcı kapsamları; Telegram bot bayrakları + Webhook; Signal hizmet süreci sürümü; Microsoft Teams uygulama belirteci + Graph rolleri/kapsamları (bilindiği yerlerde açıklamalı). Yoklaması olmayan kanallar `Probe: unavailable` bildirir.

## Adları kimliklere çözümleme

Sağlayıcı dizinini kullanarak kanal/kullanıcı adlarını kimliklere çözümleyin:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Notlar:

- Hedef türünü zorlamak için `--kind user|group|auto` kullanın.
- Birden fazla girdi aynı adı paylaştığında çözümleme etkin eşleşmeleri tercih eder.
- `channels resolve` salt okunurdur. Seçilen hesap SecretRef aracılığıyla yapılandırılmış ancak bu kimlik bilgisi geçerli komut yolunda kullanılamıyorsa, komut tüm çalışmayı iptal etmek yerine notlarla birlikte düşürülmüş, çözümlenmemiş sonuçlar döndürür.
- `channels resolve`, kanal Plugin'lerini kurmaz. Katalogdan kurulabilir bir kanal için adları çözümlemeden önce `channels add --channel <name>` kullanın.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Kanallara genel bakış](/tr/channels)
