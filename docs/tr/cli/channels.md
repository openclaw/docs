---
read_when:
    - Kanal hesapları eklemek/kaldırmak istediğinizde (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (eklenti)/Signal/iMessage/Matrix)
    - Kanal durumunu kontrol etmek veya kanal günlüklerini izlemek istediğinizde
summary: '`openclaw channels` için CLI başvurusu (hesaplar, durum, giriş/çıkış, günlükler)'
title: channels
x-i18n:
    generated_at: "2026-04-05T13:48:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: d0f558fdb5f6ec54e7fdb7a88e5c24c9d2567174341bd3ea87848bce4cba5d29
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Gateway üzerindeki sohbet kanalı hesaplarını ve bunların çalışma zamanı durumunu yönetin.

İlgili dokümanlar:

- Kanal kılavuzları: [Channels](/tr/channels/index)
- Gateway yapılandırması: [Configuration](/gateway/configuration)

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

`channels status --probe`, canlı yoldur: erişilebilir bir gateway üzerinde hesap başına
`probeAccount` ve isteğe bağlı `auditAccount` kontrollerini çalıştırır; bu nedenle çıktı, taşıma
durumunun yanı sıra `works`, `probe failed`, `audit ok` veya `audit failed` gibi probe sonuçlarını da içerebilir.
Gateway'e erişilemiyorsa `channels status`, canlı probe çıktısı yerine yalnızca yapılandırma özetlerine
geri döner.

## Hesap ekleme / kaldırma

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

İpucu: `openclaw channels add --help`, kanal başına bayrakları gösterir (token, özel anahtar, uygulama token'ı, signal-cli yolları vb.).

Yaygın etkileşimsiz ekleme yüzeyleri şunları içerir:

- bot-token kanalları: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal/iMessage taşıma alanları: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chat alanları: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrix alanları: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostr alanları: `--private-key`, `--relay-urls`
- Tlon alanları: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- Desteklenen yerlerde varsayılan hesap için ortam değişkeni destekli kimlik doğrulama amacıyla `--use-env`

Bayraksız olarak `openclaw channels add` çalıştırdığınızda, etkileşimli sihirbaz şunları sorabilir:

- seçilen kanal başına hesap kimlikleri
- bu hesaplar için isteğe bağlı görünen adlar
- `Bind configured channel accounts to agents now?`

Şimdi bağlamayı onaylarsanız sihirbaz, hangi agent'ın her yapılandırılmış kanal hesabına sahip olması gerektiğini sorar ve hesap kapsamlı yönlendirme bağlarını yazar.

Aynı yönlendirme kurallarını daha sonra `openclaw agents bindings`, `openclaw agents bind` ve `openclaw agents unbind` ile de yönetebilirsiniz (bkz. [agents](/cli/agents)).

Tek hesaplı üst düzey ayarları hâlâ kullanan bir kanala varsayılan olmayan bir hesap eklediğinizde OpenClaw, yeni hesabı yazmadan önce hesap kapsamlı üst düzey değerleri kanalın hesap haritasına yükseltir. Çoğu kanal bu değerleri `channels.<channel>.accounts.default` içine yerleştirir, ancak paketlenmiş kanallar mevcut eşleşen yükseltilmiş hesabı bunun yerine koruyabilir. Matrix şu anki örnektir: zaten bir adlandırılmış hesap varsa veya `defaultAccount` mevcut bir adlandırılmış hesaba işaret ediyorsa, yükseltme yeni bir `accounts.default` oluşturmaktansa o hesabı korur.

Yönlendirme davranışı tutarlı kalır:

- Mevcut yalnızca kanal bağları (`accountId` olmadan) varsayılan hesapla eşleşmeye devam eder.
- `channels add`, etkileşimsiz modda bağları otomatik olarak oluşturmaz veya yeniden yazmaz.
- Etkileşimli kurulum isteğe bağlı olarak hesap kapsamlı bağlar ekleyebilir.

Yapılandırmanız zaten karma durumdaysa (adlandırılmış hesaplar mevcut ve üst düzey tek hesap değerleri hâlâ ayarlıysa), o kanal için seçilen yükseltilmiş hesaba hesap kapsamlı değerleri taşımak üzere `openclaw doctor --fix` çalıştırın. Çoğu kanal `accounts.default` içine yükseltir; Matrix mevcut bir adlandırılmış/varsayılan hedefi koruyabilir.

## Giriş / çıkış (etkileşimli)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

Notlar:

- `channels login`, `--verbose` desteğine sahiptir.
- `channels login` / `logout`, yalnızca tek bir desteklenen giriş hedefi yapılandırılmışsa kanalı çıkarımlayabilir.

## Sorun giderme

- Geniş kapsamlı probe için `openclaw status --deep` çalıştırın.
- Rehberli düzeltmeler için `openclaw doctor` kullanın.
- `openclaw channels list`, `Claude: HTTP 403 ... user:profile` yazdırıyorsa → kullanım anlık görüntüsü için `user:profile` kapsamı gerekir. `--no-usage` kullanın veya bir claude.ai oturum anahtarı (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) sağlayın ya da Claude CLI üzerinden yeniden kimlik doğrulaması yapın.
- `openclaw channels status`, gateway'e erişilemediğinde yalnızca yapılandırma özetlerine geri döner. Desteklenen bir kanal kimlik bilgisi SecretRef üzerinden yapılandırılmış ancak mevcut komut yolunda kullanılamıyorsa, hesabı yapılandırılmamış olarak göstermek yerine düşürülmüş notlarla birlikte yapılandırılmış olarak bildirir.

## Yetenek probe'u

Sağlayıcı yetenek ipuçlarını (mümkün olduğunda intents/scopes) ve statik özellik desteğini getirin:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Notlar:

- `--channel` isteğe bağlıdır; tüm kanalları (eklentiler dahil) listelemek için bunu atlayın.
- `--account` yalnızca `--channel` ile geçerlidir.
- `--target`, `channel:<id>` veya ham sayısal kanal kimliği kabul eder ve yalnızca Discord için geçerlidir.
- Probe'lar sağlayıcıya özeldir: Discord intents + isteğe bağlı kanal izinleri; Slack bot + kullanıcı kapsamları; Telegram bot bayrakları + webhook; Signal daemon sürümü; Microsoft Teams uygulama token'ı + Graph roller/kapsamlar (bilindiği yerde not edilmiştir). Probe'u olmayan kanallar `Probe: unavailable` bildirir.

## Adları kimliklere çözümleme

Sağlayıcı dizinini kullanarak kanal/kullanıcı adlarını kimliklere çözümleyin:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Notlar:

- Hedef türünü zorlamak için `--kind user|group|auto` kullanın.
- Birden fazla giriş aynı adı paylaşıyorsa çözümleme etkin eşleşmeleri tercih eder.
- `channels resolve` salt okunurdur. Seçili bir hesap SecretRef üzerinden yapılandırılmış ancak bu kimlik bilgisi mevcut komut yolunda kullanılamıyorsa, komut tüm çalışmayı iptal etmek yerine notlarla birlikte düşürülmüş çözülmemiş sonuçlar döndürür.
