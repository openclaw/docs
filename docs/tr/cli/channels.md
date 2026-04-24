---
read_when:
    - Kanal hesapları eklemek/kaldırmak istiyorsunuz (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Kanal durumunu kontrol etmek veya kanal günlüklerini izlemek istiyorsunuz
summary: '`openclaw channels` için CLI başvurusu (hesaplar, durum, giriş/çıkış, günlükler)'
title: Kanallar
x-i18n:
    generated_at: "2026-04-24T09:01:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31c0f3b830f12e8561ba52f70a599d8b572fcb0a9f9c25e5608860bb7e8661de
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Gateway üzerindeki sohbet kanalı hesaplarını ve bunların çalışma zamanı durumunu yönetin.

İlgili belgeler:

- Kanal kılavuzları: [Channels](/tr/channels/index)
- Gateway yapılandırması: [Configuration](/tr/gateway/configuration)

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
`probeAccount` ve isteğe bağlı `auditAccount` kontrollerini çalıştırır; böylece çıktı,
taşıma durumu ile `works`, `probe failed`, `audit ok` veya `audit failed` gibi probe
sonuçlarını içerebilir.
Gateway'e ulaşılamıyorsa, `channels status` canlı probe çıktısı yerine yalnızca yapılandırma özetlerine fallback yapar.

## Hesap ekleme / kaldırma

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

İpucu: `openclaw channels add --help`, kanal başına bayrakları gösterir (token, private key, app token, signal-cli yolları vb.).

Yaygın etkileşimsiz ekleme yüzeyleri şunlardır:

- bot-token kanalları: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal/iMessage taşıma alanları: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chat alanları: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrix alanları: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostr alanları: `--private-key`, `--relay-urls`
- Tlon alanları: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- desteklenen durumlarda varsayılan hesap için env destekli kimlik doğrulama amacıyla `--use-env`

`openclaw channels add` komutunu bayrak olmadan çalıştırdığınızda, etkileşimli sihirbaz şunları sorabilir:

- seçilen kanal başına hesap ID'leri
- bu hesaplar için isteğe bağlı görünen adlar
- `Bind configured channel accounts to agents now?`

Şimdi bağlamayı onaylarsanız, sihirbaz her yapılandırılmış kanal hesabının hangi aracıya ait olması gerektiğini sorar ve hesap kapsamlı yönlendirme binding'leri yazar.

Aynı yönlendirme kurallarını daha sonra `openclaw agents bindings`, `openclaw agents bind` ve `openclaw agents unbind` ile de yönetebilirsiniz (bkz. [agents](/tr/cli/agents)).

Hâlâ tek hesaplı üst düzey ayarlar kullanan bir kanala varsayılan olmayan bir hesap eklediğinizde, OpenClaw yeni hesabı yazmadan önce hesap kapsamlı üst düzey değerleri kanalın hesap eşlemesine taşır. Çoğu kanal bu değerleri `channels.<channel>.accounts.default` içine yerleştirir, ancak paketlenmiş kanallar bunun yerine mevcut eşleşen bir taşınmış hesabı koruyabilir. Matrix bunun mevcut örneğidir: adlandırılmış bir hesap zaten varsa veya `defaultAccount` mevcut bir adlandırılmış hesabı gösteriyorsa, taşıma yeni bir `accounts.default` oluşturmak yerine o hesabı korur.

Yönlendirme davranışı tutarlı kalır:

- Mevcut yalnızca kanal binding'leri (`accountId` olmadan) varsayılan hesapla eşleşmeye devam eder.
- `channels add`, etkileşimsiz modda binding'leri otomatik oluşturmaz veya yeniden yazmaz.
- Etkileşimli kurulum isteğe bağlı olarak hesap kapsamlı binding'ler ekleyebilir.

Yapılandırmanız zaten karma durumdaysa (adlandırılmış hesaplar mevcut ve üst düzey tek hesap değerleri hâlâ ayarlıysa), hesap kapsamlı değerleri o kanal için seçilen taşınmış hesaba taşımak üzere `openclaw doctor --fix` çalıştırın. Çoğu kanal `accounts.default` içine taşır; Matrix ise mevcut bir adlandırılmış/varsayılan hedefi koruyabilir.

## Giriş / çıkış (etkileşimli)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

Notlar:

- `channels login`, `--verbose` destekler.
- Yalnızca bir desteklenen giriş hedefi yapılandırıldığında `channels login` / `logout` kanalı çıkarabilir.

## Sorun giderme

- Geniş bir probe için `openclaw status --deep` çalıştırın.
- Rehberli düzeltmeler için `openclaw doctor` kullanın.
- `openclaw channels list`, `Claude: HTTP 403 ... user:profile` yazdırıyorsa kullanım anlık görüntüsünün `user:profile` kapsamına ihtiyacı vardır. `--no-usage` kullanın ya da bir claude.ai oturum anahtarı (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) sağlayın veya Claude CLI üzerinden yeniden kimlik doğrulaması yapın.
- `channels status`, gateway'e ulaşılamadığında yalnızca yapılandırma özetlerine fallback yapar. Desteklenen bir kanal kimlik bilgisi SecretRef üzerinden yapılandırılmış ancak mevcut komut yolunda kullanılamıyorsa, o hesabı yapılandırılmamış olarak göstermek yerine bozulmuş notlarla yapılandırılmış olarak bildirir.

## Yetenek probe'u

Mevcut olduğunda sağlayıcı yetenek ipuçlarını (intents/scopes) ve statik özellik desteğini alın:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Notlar:

- `--channel` isteğe bağlıdır; tüm kanalları listelemek için bunu atlayın (uzantılar dahil).
- `--account` yalnızca `--channel` ile geçerlidir.
- `--target`, `channel:<id>` veya ham sayısal kanal ID'si kabul eder ve yalnızca Discord için geçerlidir.
- Probe'lar sağlayıcıya özeldir: Discord intents + isteğe bağlı kanal izinleri; Slack bot + kullanıcı kapsamları; Telegram bot bayrakları + Webhook; Signal daemon sürümü; Microsoft Teams app token + Graph roller/kapsamlar (bilindiğinde açıklamalı). Probe olmayan kanallar `Probe: unavailable` bildirir.

## Adları ID'lere çözümleme

Sağlayıcı dizinini kullanarak kanal/kullanıcı adlarını ID'lere çözümleyin:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Notlar:

- Hedef türünü zorlamak için `--kind user|group|auto` kullanın.
- Birden fazla giriş aynı adı paylaştığında çözümleme etkin eşleşmeleri tercih eder.
- `channels resolve` salt okunurdur. Seçili hesap SecretRef üzerinden yapılandırılmış ancak o kimlik bilgisi mevcut komut yolunda kullanılamıyorsa, komut tüm çalıştırmayı iptal etmek yerine bozulmuş çözümlenmemiş sonuçları notlarla döndürür.

## İlgili

- [CLI reference](/tr/cli)
- [Channels overview](/tr/channels)
