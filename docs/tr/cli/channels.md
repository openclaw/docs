---
read_when:
    - Kanal hesapları eklemek/kaldırmak istiyorsunuz (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Kanal durumunu denetlemek veya kanal günlüklerini canlı izlemek istiyorsunuz
summary: '`openclaw channels` için CLI başvurusu (hesaplar, durum, giriş/çıkış, günlükler)'
title: Kanallar
x-i18n:
    generated_at: "2026-04-26T12:24:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73c44ccac8996d2700d8c912d29e1ea08898128427ae10ff2e35b6ed422e45d1
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Gateway üzerindeki sohbet kanalı hesaplarını ve çalışma zamanı durumlarını yönetin.

İlgili belgeler:

- Kanal kılavuzları: [Kanallar](/tr/channels/index)
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
- `channels capabilities`: `--channel <name>`, `--account <id>` (`--channel` ile birlikte), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` canlı yoldur: erişilebilir bir gateway üzerinde, hesap başına
`probeAccount` ve isteğe bağlı `auditAccount` denetimlerini çalıştırır; bu yüzden çıktı, aktarım
durumunun yanında `works`, `probe failed`, `audit ok` veya `audit failed` gibi yoklama sonuçlarını da içerebilir.
Gateway erişilemezse, `channels status` canlı yoklama çıktısı yerine yalnızca yapılandırma özetlerine
geri döner.

## Hesap ekleme / kaldırma

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

İpucu: `openclaw channels add --help`, kanal başına bayrakları gösterir (token, private key, app token, signal-cli yolları vb.).

Yaygın etkileşimsiz ekleme yüzeyleri şunları içerir:

- bot-token kanalları: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal/iMessage aktarım alanları: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chat alanları: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrix alanları: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostr alanları: `--private-key`, `--relay-urls`
- Tlon alanları: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- Desteklendiği yerlerde varsayılan hesap için ortam değişkeni tabanlı kimlik doğrulaması amacıyla `--use-env`

Bir kanal Plugin'i, bayrak tabanlı ekleme komutu sırasında kurulmayı gerektiriyorsa, OpenClaw etkileşimli Plugin kurulum istemini açmadan kanalın varsayılan kurulum kaynağını kullanır.

`openclaw channels add` komutunu bayraksız çalıştırdığınızda, etkileşimli sihirbaz şunları sorabilir:

- seçilen kanal başına hesap kimlikleri
- bu hesaplar için isteğe bağlı görünen adlar
- `Bind configured channel accounts to agents now?`

Bağlamayı şimdi onaylarsanız, sihirbaz hangi aracının her yapılandırılmış kanal hesabına sahip olması gerektiğini sorar ve hesap kapsamlı yönlendirme bağlarını yazar.

Aynı yönlendirme kurallarını daha sonra `openclaw agents bindings`, `openclaw agents bind` ve `openclaw agents unbind` ile de yönetebilirsiniz ([agents](/tr/cli/agents) bölümüne bakın).

Tek hesaplı üst düzey ayarları hâlâ kullanan bir kanala varsayılan olmayan bir hesap eklediğinizde, OpenClaw yeni hesabı yazmadan önce hesap kapsamlı üst düzey değerleri kanalın hesap eşlemesine yükseltir. Çoğu kanal bu değerleri `channels.<channel>.accounts.default` içine yerleştirir, ancak paketlenmiş kanallar bunun yerine mevcut eşleşen yükseltilmiş bir hesabı koruyabilir. Matrix bunun mevcut örneğidir: adlandırılmış bir hesap zaten varsa veya `defaultAccount` mevcut bir adlandırılmış hesaba işaret ediyorsa, yükseltme yeni bir `accounts.default` oluşturmak yerine bu hesabı korur.

Yönlendirme davranışı tutarlı kalır:

- Mevcut yalnızca kanal bağları (`accountId` olmadan) varsayılan hesapla eşleşmeye devam eder.
- `channels add`, etkileşimsiz modda bağları otomatik olarak oluşturmaz veya yeniden yazmaz.
- Etkileşimli kurulum, isteğe bağlı olarak hesap kapsamlı bağlar ekleyebilir.

Yapılandırmanız zaten karma bir durumdaysa (adlandırılmış hesaplar mevcutken üst düzey tek hesap değerleri de hâlâ ayarlıysa), o kanal için seçilen yükseltilmiş hesaba hesap kapsamlı değerleri taşımak üzere `openclaw doctor --fix` çalıştırın. Çoğu kanal `accounts.default` içine yükseltir; Matrix ise mevcut bir adlandırılmış/varsayılan hedefi koruyabilir.

## Giriş / çıkış (etkileşimli)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

Notlar:

- `channels login`, `--verbose` destekler.
- `channels login` / `logout`, yalnızca bir desteklenen giriş hedefi yapılandırılmışsa kanalı çıkarımlayabilir.

## Sorun giderme

- Geniş kapsamlı bir yoklama için `openclaw status --deep` çalıştırın.
- Yönlendirmeli düzeltmeler için `openclaw doctor` kullanın.
- `openclaw channels list` içinde `Claude: HTTP 403 ... user:profile` yazıyorsa → kullanım anlık görüntüsünün `user:profile` kapsamına ihtiyacı vardır. `--no-usage` kullanın veya bir claude.ai oturum anahtarı sağlayın (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) ya da Claude CLI ile yeniden kimlik doğrulaması yapın.
- `openclaw channels status`, gateway erişilemez olduğunda yalnızca yapılandırma özetlerine geri döner. Desteklenen bir kanal kimlik bilgisi SecretRef üzerinden yapılandırılmış ancak mevcut komut yolunda kullanılamıyorsa, hesabı yapılandırılmamış olarak göstermek yerine düşürülmüş notlarla birlikte yapılandırılmış olarak bildirir.

## Yetenek yoklaması

Statik özellik desteğine ek olarak sağlayıcı yetenek ipuçlarını (mevcut olduğunda intents/scopes) alın:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Notlar:

- `--channel` isteğe bağlıdır; tüm kanalları (extensions dahil) listelemek için bunu atlayın.
- `--account` yalnızca `--channel` ile geçerlidir.
- `--target`, `channel:<id>` veya ham sayısal bir kanal kimliğini kabul eder ve yalnızca Discord için geçerlidir.
- Yoklamalar sağlayıcıya özeldir: Discord intents + isteğe bağlı kanal izinleri; Slack bot + kullanıcı kapsamları; Telegram bot bayrakları + webhook; Signal daemon sürümü; Microsoft Teams app token + Graph rolleri/kapsamları (biliniyorsa açıklamalı). Yoklaması olmayan kanallar `Probe: unavailable` bildirir.

## Adları kimliklere çözümleme

Sağlayıcı dizinini kullanarak kanal/kullanıcı adlarını kimliklere çözümleyin:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Notlar:

- Hedef türünü zorlamak için `--kind user|group|auto` kullanın.
- Çözümleme, birden fazla giriş aynı adı paylaştığında etkin eşleşmeleri tercih eder.
- `channels resolve` salt okunurdur. Seçilen bir hesap SecretRef üzerinden yapılandırılmış ancak bu kimlik bilgisi mevcut komut yolunda kullanılamıyorsa, komut tüm çalışmayı iptal etmek yerine notlarla birlikte düşürülmüş çözülmemiş sonuçlar döndürür.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Kanallara genel bakış](/tr/channels)
