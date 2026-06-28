---
read_when:
    - Mesaj CLI eylemleri ekleme veya değiştirme
    - Giden kanal davranışını değiştirme
summary: 'CLI başvurusu: `openclaw message` (gönderme + kanal eylemleri)'
title: Mesaj
x-i18n:
    generated_at: "2026-06-28T00:22:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4a8a716435313efa41a13ee5c6392eb2e4cfca2ede3e4690b157d26d077f7d56
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Mesaj ve kanal eylemleri göndermek için tek giden komut
(Discord/Google Chat/iMessage/Matrix/Mattermost (plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## Kullanım

```
openclaw message <subcommand> [flags]
```

Kanal seçimi:

- Birden fazla kanal yapılandırılmışsa `--channel` zorunludur.
- Tam olarak bir kanal yapılandırılmışsa varsayılan olur.
- Değerler: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost plugin gerektirir)
- `--channel` veya kanal önekli bir hedef varsa `openclaw message`, seçilen kanalı sahibi olan plugin ile çözümler; aksi halde varsayılan kanal çıkarımı için yapılandırılmış kanal pluginlerini yükler.

Hedef biçimleri (`--target`):

- WhatsApp: E.164, grup JID’si veya WhatsApp Channel/Newsletter JID’si (`...@newsletter`)
- Telegram: sohbet kimliği, `@username` veya forum konu hedefi (`-1001234567890:topic:42` ya da `--thread-id 42`)
- Discord: `channel:<id>` veya `user:<id>` (ya da `<@id>` bahsi; ham sayısal kimlikler kanal olarak değerlendirilir)
- Google Chat: `spaces/<spaceId>` veya `users/<userId>`
- Slack: `channel:<id>` veya `user:<id>` (ham kanal kimliği kabul edilir)
- Mattermost (plugin): `channel:<id>`, `user:<id>` veya `@username` (yalın kimlikler kanal olarak değerlendirilir)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` veya `username:<name>`/`u:<name>`
- iMessage: tanıtıcı, `chat_id:<id>`, `chat_guid:<guid>` veya `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` veya `#alias:server`
- Microsoft Teams: konuşma kimliği (`19:...@thread.tacv2`) ya da `conversation:<id>` veya `user:<aad-object-id>`

Ad araması:

- Desteklenen sağlayıcılar için (Discord/Slack/vb.), `Help` veya `#help` gibi kanal adları dizin önbelleği üzerinden çözümlenir.
- Önbellek kaçırıldığında, sağlayıcı destekliyorsa OpenClaw canlı dizin araması deneyecektir.

## Yaygın bayraklar

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (gönderme/anket/okuma/vb. için hedef kanal veya kullanıcı)
- `--targets <name>` (tekrarlanabilir; yalnızca yayın)
- `--json`
- `--dry-run`
- `--verbose`

## SecretRef davranışı

- `openclaw message`, seçilen eylemi çalıştırmadan önce desteklenen kanal SecretRef’lerini çözümler.
- Çözümleme mümkün olduğunda etkin eylem hedefine kapsamlanır:
  - `--channel` ayarlandığında kanal kapsamlı (veya `discord:...` gibi önekli hedeflerden çıkarıldığında)
  - `--account` ayarlandığında hesap kapsamlı (kanal genelleri + seçili hesap yüzeyleri)
  - `--account` atlandığında OpenClaw bir `default` hesap SecretRef kapsamını zorlamaz
- İlgisiz kanallardaki çözümlenmemiş SecretRef’ler hedefli bir mesaj eylemini engellemez.
- Seçilen kanal/hesap SecretRef’i çözümlenmemişse komut o eylem için kapalı şekilde başarısız olur.

## Eylemler

### Çekirdek

- `send`
  - Kanallar: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Zorunlu: `--target`, ayrıca `--message`, `--media` veya `--presentation`
  - İsteğe bağlı: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Paylaşılan sunum yükleri: `--presentation`, çekirdeğin seçilen kanalın beyan edilen yetenekleri üzerinden işlediği anlamsal bloklar (`text`, `context`, `divider`, `buttons`, `select`) gönderir. Bkz. [Mesaj Sunumu](/tr/plugins/message-presentation).
  - Genel teslim tercihleri: `--delivery`, `{ "pin": true }` gibi teslim ipuçlarını kabul eder; `--pin`, kanal desteklediğinde sabitlenmiş teslim için kısa yoldur.
  - Telegram + WhatsApp: `--force-document` (kanal sıkıştırmasını önlemek için görüntüleri, GIF’leri ve videoları belge olarak gönder)
  - Yalnızca Telegram: `--thread-id` (forum konu kimliği)
  - Yalnızca Slack: `--thread-id` (konu zaman damgası; `--reply-to` aynı alanı kullanır)
  - Telegram + Discord: `--silent`
  - Yalnızca WhatsApp: `--gif-playback`; WhatsApp Channels/Newsletters kendi yerel `@newsletter` JID’leriyle adreslenir.

- `poll`
  - Kanallar: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Zorunlu: `--target`, `--poll-question`, `--poll-option` (tekrarlanabilir)
  - İsteğe bağlı: `--poll-multi`
  - Yalnızca Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Yalnızca Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Kanallar: Discord/Google Chat/Matrix/Nextcloud Talk/Signal/Slack/Telegram/WhatsApp
  - Zorunlu: `--message-id`, `--target`
  - İsteğe bağlı: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Not: `--remove`, `--emoji` gerektirir (desteklenen yerlerde kendi tepkilerinizi temizlemek için `--emoji` değerini atlayın; bkz. /tools/reactions)
  - Yalnızca WhatsApp: `--participant`, `--from-me`
  - Signal grup tepkileri: `--target-author` veya `--target-author-uuid` zorunludur
  - Nextcloud Talk: yalnızca tepki ekleme; `--remove` açık bir hatayla reddedilir (bkz. /tools/reactions)

- `reactions`
  - Kanallar: Discord/Google Chat/Slack/Matrix
  - Zorunlu: `--message-id`, `--target`
  - İsteğe bağlı: `--limit`

- `read`
  - Kanallar: Discord/Slack/Matrix
  - Zorunlu: `--target`
  - İsteğe bağlı: `--limit`, `--message-id`, `--before`, `--after`
  - Yalnızca Slack: `--message-id` belirli bir Slack mesaj zaman damgasını okur; tam bir konu yanıtını okumak için `--thread-id` ile birleştirin.
  - Yalnızca Discord: `--around`

- `edit`
  - Kanallar: Discord/Slack/Matrix
  - Zorunlu: `--message-id`, `--message`, `--target`

- `delete`
  - Kanallar: Discord/Slack/Telegram/Matrix
  - Zorunlu: `--message-id`, `--target`

- `pin` / `unpin`
  - Kanallar: Discord/Slack/Matrix
  - Zorunlu: `--message-id`, `--target`

- `pins` (listele)
  - Kanallar: Discord/Slack/Matrix
  - Zorunlu: `--target`

- `permissions`
  - Kanallar: Discord/Matrix
  - Zorunlu: `--target`
  - Yalnızca Matrix: Matrix şifrelemesi etkin olduğunda ve doğrulama eylemlerine izin verildiğinde kullanılabilir

- `search`
  - Kanallar: Discord
  - Zorunlu: `--guild-id`, `--query`
  - İsteğe bağlı: `--channel-id`, `--channel-ids` (tekrarlanabilir), `--author-id`, `--author-ids` (tekrarlanabilir), `--limit`

### Konular

- `thread create`
  - Kanallar: Discord
  - Zorunlu: `--thread-name`, `--target` (kanal kimliği)
  - İsteğe bağlı: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - Kanallar: Discord
  - Zorunlu: `--guild-id`
  - İsteğe bağlı: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - Kanallar: Discord
  - Zorunlu: `--target` (konu kimliği), `--message`
  - İsteğe bağlı: `--media`, `--reply-to`

### Emojiler

- `emoji list`
  - Discord: `--guild-id`
  - Slack: ek bayrak yok

- `emoji upload`
  - Kanallar: Discord
  - Zorunlu: `--guild-id`, `--emoji-name`, `--media`
  - İsteğe bağlı: `--role-ids` (tekrarlanabilir)

### Çıkartmalar

- `sticker send`
  - Kanallar: Discord
  - Zorunlu: `--target`, `--sticker-id` (tekrarlanabilir)
  - İsteğe bağlı: `--message`

- `sticker upload`
  - Kanallar: Discord
  - Zorunlu: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### Roller / Kanallar / Üyeler / Ses

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (Discord için + `--guild-id`)
- `voice status` (Discord): `--guild-id`, `--user-id`

### Etkinlikler

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - İsteğe bağlı: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### Moderasyon (Discord)

- `timeout`: `--guild-id`, `--user-id` (isteğe bağlı `--duration-min` veya `--until`; zaman aşımını temizlemek için ikisini de atlayın)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` ayrıca `--reason` destekler

### Yayın

- `broadcast`
  - Kanallar: yapılandırılmış herhangi bir kanal; tüm sağlayıcıları hedeflemek için `--channel all` kullanın
  - Gerekli: `--targets <target...>`
  - İsteğe bağlı: `--message`, `--media`, `--dry-run`

## Örnekler

Discord yanıtı gönderin:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

Anlamsal düğmelerle mesaj gönderin:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

Core, aynı `presentation` yükünü kanal yeteneğine bağlı olarak Discord bileşenlerine, Slack bloklarına, Telegram satır içi düğmelerine, Mattermost özelliklerine veya Teams/Feishu kartlarına dönüştürür. Tam sözleşme ve geri dönüş kuralları için [Mesaj Sunumu](/tr/plugins/message-presentation) bölümüne bakın.

Daha zengin bir sunum yükü gönderin:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

Discord anketi oluşturun:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Telegram anketi oluşturun (2 dakika içinde otomatik kapatılır):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Teams proaktif mesajı gönderin:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Teams anketi oluşturun:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

Slack’te tepki verin:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

Bir Signal grubunda tepki verin:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

Genel sunum üzerinden Telegram satır içi düğmeleri gönderin:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Genel sunum üzerinden Telegram Mini App düğmesi gönderin:

```
openclaw message send --channel telegram --target 123456789 --message "Open app:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Launch","webApp":{"url":"https://example.com/app"}}]}]}'
```

Telegram web uygulaması düğmeleri yalnızca bir kullanıcı ile bot arasındaki özel sohbetlerde desteklenir. `web_app` kullanan eski JSON yükleri hâlâ ayrıştırılır, ancak kanonik sunum alanı `webApp`’tir.

Genel sunum üzerinden Teams kartı gönderin:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

Sıkıştırmayı önlemek için Telegram veya WhatsApp görüntüsünü belge olarak gönderin:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## İlgili

- [CLI referansı](/tr/cli)
- [Agent gönderimi](/tr/tools/agent-send)
