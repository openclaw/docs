---
read_when:
    - Kanal hesapları eklemek/kaldırmak istiyorsunuz (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Kanal durumunu kontrol etmek veya kanal günlüklerini takip etmek istiyorsunuz
summary: '`openclaw channels` için CLI referansı (hesaplar, durum, oturum açma/oturumu kapatma, günlükler)'
title: Kanallar
x-i18n:
    generated_at: "2026-05-01T08:58:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f673a626b46cd4c8ba7eb28963d27e7e3f630dd86723332faab9b4c86553da9
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
`probeAccount` ve isteğe bağlı `auditAccount` denetimlerini çalıştırır; bu nedenle çıktı, aktarım
durumunun yanı sıra `works`, `probe failed`, `audit ok` veya `audit failed` gibi probe sonuçlarını
içerebilir. Gateway erişilemezse, `channels status` canlı probe çıktısı yerine yalnızca yapılandırma
özetlerine geri döner.

## Hesap ekleme / kaldırma

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help`, kanal başına bayrakları (token, private key, app token, signal-cli yolları vb.) gösterir.
</Tip>

`channels remove` yalnızca kurulu/yapılandırılmış kanal plugin’leri üzerinde çalışır. Kurulabilir katalog kanalları için önce `channels add` kullanın.

Yaygın etkileşimsiz ekleme yüzeyleri şunları içerir:

- bot-token kanalları: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal/iMessage aktarım alanları: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chat alanları: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrix alanları: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostr alanları: `--private-key`, `--relay-urls`
- Tlon alanları: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- desteklendiğinde varsayılan hesap için env destekli kimlik doğrulamasında `--use-env`

Bayrakla yönlendirilen bir ekleme komutu sırasında bir kanal plugin’inin kurulması gerekiyorsa, OpenClaw etkileşimli plugin kurulum istemini açmadan kanalın varsayılan kurulum kaynağını kullanır.

`openclaw channels add` komutunu bayraksız çalıştırdığınızda, etkileşimli sihirbaz şunları sorabilir:

- seçilen kanal başına hesap kimlikleri
- bu hesaplar için isteğe bağlı görünen adlar
- `Bind configured channel accounts to agents now?`

Şimdi bağlamayı onaylarsanız, sihirbaz hangi agent’ın her yapılandırılmış kanal hesabına sahip olması gerektiğini sorar ve hesap kapsamlı yönlendirme bağlamaları yazar.

Aynı yönlendirme kurallarını daha sonra `openclaw agents bindings`, `openclaw agents bind` ve `openclaw agents unbind` ile de yönetebilirsiniz (bkz. [agent’lar](/tr/cli/agents)).

Hâlâ tek hesaplı üst düzey ayarlar kullanan bir kanala varsayılan olmayan bir hesap eklediğinizde, OpenClaw yeni hesabı yazmadan önce hesap kapsamlı üst düzey değerleri kanalın hesap haritasına yükseltir. Çoğu kanal bu değerleri `channels.<channel>.accounts.default` içine yerleştirir, ancak paketli kanallar bunun yerine mevcut eşleşen yükseltilmiş bir hesabı koruyabilir. Mevcut örnek Matrix’tir: Zaten bir adlandırılmış hesap varsa veya `defaultAccount` mevcut bir adlandırılmış hesaba işaret ediyorsa, yükseltme yeni bir `accounts.default` oluşturmak yerine o hesabı korur.

Yönlendirme davranışı tutarlı kalır:

- Mevcut yalnızca kanal bağlamaları (`accountId` yok) varsayılan hesapla eşleşmeye devam eder.
- `channels add`, etkileşimsiz modda bağlamaları otomatik oluşturmaz veya yeniden yazmaz.
- Etkileşimli kurulum isteğe bağlı olarak hesap kapsamlı bağlamalar ekleyebilir.

Yapılandırmanız zaten karma bir durumdaysa (adlandırılmış hesaplar mevcutken üst düzey tek hesap değerleri hâlâ ayarlıysa), hesap kapsamlı değerleri o kanal için seçilen yükseltilmiş hesaba taşımak üzere `openclaw doctor --fix` çalıştırın. Çoğu kanal `accounts.default` içine yükseltir; Matrix bunun yerine mevcut bir adlandırılmış/varsayılan hedefi koruyabilir.

## Oturum açma ve kapatma (etkileşimli)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login`, `--verbose` destekler.
- `channels login` ve `logout`, yalnızca bir desteklenen oturum açma hedefi yapılandırılmışsa kanalı çıkarımlayabilir.
- `channels login` komutunu gateway host’undaki bir terminalden çalıştırın. Agent `exec`, bu etkileşimli oturum açma akışını engeller; mevcut olduğunda `whatsapp_login` gibi kanala özgü agent oturum açma araçları sohbetten kullanılmalıdır.

## Sorun giderme

- Geniş bir probe için `openclaw status --deep` çalıştırın.
- Kılavuzlu düzeltmeler için `openclaw doctor` kullanın.
- `openclaw channels list`, `Claude: HTTP 403 ... user:profile` yazdırıyor → kullanım anlık görüntüsünün `user:profile` kapsamına ihtiyacı vardır. `--no-usage` kullanın, bir claude.ai oturum anahtarı (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) sağlayın veya Claude CLI üzerinden yeniden kimlik doğrulaması yapın.
- Gateway erişilemez olduğunda `openclaw channels status`, yalnızca yapılandırma özetlerine geri döner. Desteklenen bir kanal kimlik bilgisi SecretRef üzerinden yapılandırılmış ancak geçerli komut yolunda kullanılamıyorsa, hesabı yapılandırılmamış olarak göstermek yerine bozulmuş notlarla yapılandırılmış olarak raporlar.

## Yetenekler probe’u

Sağlayıcı yetenek ipuçlarını (mevcut olduğunda intents/scopes) ve statik özellik desteğini alın:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Notlar:

- `--channel` isteğe bağlıdır; her kanalı (extensions dahil) listelemek için atlayın.
- `--account` yalnızca `--channel` ile geçerlidir.
- `--target`, `channel:<id>` veya ham sayısal kanal kimliği kabul eder ve yalnızca Discord için geçerlidir.
- Probe’lar sağlayıcıya özeldir: Discord intents + isteğe bağlı kanal izinleri; Slack bot + kullanıcı kapsamları; Telegram bot bayrakları + Webhook; Signal daemon sürümü; Microsoft Teams app token + Graph rolleri/kapsamları (bilinen yerlerde açıklamalı). Probe’u olmayan kanallar `Probe: unavailable` raporlar.

## Adları kimliklere çözümleme

Sağlayıcı dizinini kullanarak kanal/kullanıcı adlarını kimliklere çözümleyin:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Notlar:

- Hedef türünü zorlamak için `--kind user|group|auto` kullanın.
- Birden çok giriş aynı adı paylaşıyorsa çözümleme aktif eşleşmeleri tercih eder.
- `channels resolve` salt okunurdur. Seçilen bir hesap SecretRef üzerinden yapılandırılmış ancak bu kimlik bilgisi geçerli komut yolunda kullanılamıyorsa, komut tüm çalıştırmayı durdurmak yerine notlarla bozulmuş çözümlenmemiş sonuçlar döndürür.
- `channels resolve`, kanal plugin’leri kurmaz. Kurulabilir bir katalog kanalı için adları çözümlemeden önce `channels add --channel <name>` kullanın.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Kanallar genel bakışı](/tr/channels)
