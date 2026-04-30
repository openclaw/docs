---
read_when:
    - Kanal hesapları eklemek/kaldırmak istiyorsunuz (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Kanal durumunu kontrol etmek veya kanal günlüklerini canlı izlemek istiyorsunuz
summary: '`openclaw channels` için CLI başvurusu (hesaplar, durum, oturum açma/oturumu kapatma, günlükler)'
title: Kanallar
x-i18n:
    generated_at: "2026-04-30T09:11:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fc3c5983114c17e0e7284450aa161b658312c05864db65e09d6d764e357cd1f
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Gateway üzerinde sohbet kanalı hesaplarını ve bunların çalışma zamanı durumunu yönetin.

İlgili belgeler:

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
`probeAccount` ve isteğe bağlı `auditAccount` denetimleri çalıştırır; bu nedenle çıktı, aktarım
durumunu ve `works`, `probe failed`, `audit ok` veya `audit failed` gibi prob sonuçlarını içerebilir.
Gateway erişilemez durumdaysa, `channels status` canlı prob çıktısı yerine yalnızca yapılandırma özetlerine
geri döner.

## Hesap ekleme / kaldırma

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` kanal başına bayrakları gösterir (token, private key, app token, signal-cli paths vb.).
</Tip>

Yaygın etkileşimsiz ekleme yüzeyleri şunları içerir:

- bot-token kanalları: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal/iMessage aktarım alanları: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chat alanları: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrix alanları: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostr alanları: `--private-key`, `--relay-urls`
- Tlon alanları: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- desteklendiği yerlerde varsayılan hesap için ortam destekli kimlik doğrulamada `--use-env`

Bayraklarla yönlendirilen bir ekleme komutu sırasında bir kanal Plugin’inin kurulması gerekiyorsa, OpenClaw etkileşimli Plugin kurulum istemini açmadan kanalın varsayılan kurulum kaynağını kullanır.

`openclaw channels add` komutunu bayraksız çalıştırdığınızda, etkileşimli sihirbaz şunları sorabilir:

- seçilen kanal başına hesap kimlikleri
- bu hesaplar için isteğe bağlı görünen adlar
- `Bind configured channel accounts to agents now?`

Şimdi bağlamayı onaylarsanız, sihirbaz her yapılandırılmış kanal hesabının hangi aracıya ait olması gerektiğini sorar ve hesap kapsamlı yönlendirme bağlamaları yazar.

Aynı yönlendirme kurallarını daha sonra `openclaw agents bindings`, `openclaw agents bind` ve `openclaw agents unbind` ile de yönetebilirsiniz (bkz. [aracılar](/tr/cli/agents)).

Hâlâ tek hesaplı üst düzey ayarları kullanan bir kanala varsayılan olmayan bir hesap eklediğinizde, OpenClaw yeni hesabı yazmadan önce hesap kapsamlı üst düzey değerleri kanalın hesap eşlemesine yükseltir. Çoğu kanal bu değerleri `channels.<channel>.accounts.default` içine yerleştirir, ancak paketlenmiş kanallar bunun yerine mevcut eşleşen yükseltilmiş bir hesabı koruyabilir. Güncel örnek Matrix’tir: bir adlandırılmış hesap zaten varsa veya `defaultAccount` mevcut bir adlandırılmış hesaba işaret ediyorsa, yükseltme yeni bir `accounts.default` oluşturmak yerine o hesabı korur.

Yönlendirme davranışı tutarlı kalır:

- Mevcut yalnızca kanal bağlamaları (`accountId` yok) varsayılan hesapla eşleşmeye devam eder.
- `channels add`, etkileşimsiz modda bağlamaları otomatik olarak oluşturmaz veya yeniden yazmaz.
- Etkileşimli kurulum isteğe bağlı olarak hesap kapsamlı bağlamalar ekleyebilir.

Yapılandırmanız zaten karışık durumdaysa (adlandırılmış hesaplar mevcut ve üst düzey tek hesap değerleri hâlâ ayarlıysa), hesap kapsamlı değerleri o kanal için seçilen yükseltilmiş hesaba taşımak üzere `openclaw doctor --fix` komutunu çalıştırın. Çoğu kanal `accounts.default` içine yükseltir; Matrix bunun yerine mevcut bir adlandırılmış/varsayılan hedefi koruyabilir.

## Oturum açma ve kapatma (etkileşimli)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login`, `--verbose` destekler.
- `channels login` ve `logout`, yalnızca bir desteklenen oturum açma hedefi yapılandırıldığında kanalı çıkarımla belirleyebilir.
- `channels login` komutunu Gateway ana makinesindeki bir terminalden çalıştırın. Aracı `exec`, bu etkileşimli oturum açma akışını engeller; kullanılabilir olduğunda sohbetten `whatsapp_login` gibi kanala özgü aracı oturum açma araçları kullanılmalıdır.

## Sorun giderme

- Geniş kapsamlı bir prob için `openclaw status --deep` çalıştırın.
- Rehberli düzeltmeler için `openclaw doctor` kullanın.
- `openclaw channels list`, `Claude: HTTP 403 ... user:profile` yazdırır → kullanım anlık görüntüsü `user:profile` kapsamını gerektirir. `--no-usage` kullanın veya bir claude.ai oturum anahtarı (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) sağlayın ya da Claude CLI üzerinden yeniden kimlik doğrulaması yapın.
- Gateway erişilemez olduğunda `openclaw channels status` yalnızca yapılandırma özetlerine geri döner. Desteklenen bir kanal kimlik bilgisi SecretRef üzerinden yapılandırılmış ancak geçerli komut yolunda kullanılamıyorsa, hesap yapılandırılmamış olarak gösterilmek yerine zayıflamış notlarla yapılandırılmış olarak raporlanır.

## Yetenek probu

Sağlayıcı yetenek ipuçlarını (varsa intent/kapsamlar) ve statik özellik desteğini alın:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Notlar:

- `--channel` isteğe bağlıdır; her kanalı (uzantılar dahil) listelemek için atlayın.
- `--account` yalnızca `--channel` ile geçerlidir.
- `--target`, `channel:<id>` veya ham sayısal kanal kimliği kabul eder ve yalnızca Discord için geçerlidir.
- Problar sağlayıcıya özeldir: Discord intent’leri + isteğe bağlı kanal izinleri; Slack bot + kullanıcı kapsamları; Telegram bot bayrakları + Webhook; Signal daemon sürümü; Microsoft Teams app token + Graph rolleri/kapsamları (bilinen yerlerde açıklamalı). Probu olmayan kanallar `Probe: unavailable` raporlar.

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
- `channels resolve` salt okunurdur. Seçili bir hesap SecretRef üzerinden yapılandırılmış ancak bu kimlik bilgisi geçerli komut yolunda kullanılamıyorsa, komut tüm çalıştırmayı iptal etmek yerine notlarla birlikte zayıflamış çözümlenemeyen sonuçlar döndürür.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Kanallara genel bakış](/tr/channels)
