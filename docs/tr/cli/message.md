---
read_when:
    - Mesaj CLI eylemleri eklerken veya değiştirirken
    - Giden kanal davranışını değiştirirken
summary: '`openclaw message` için CLI başvurusu (gönderme + kanal eylemleri)'
title: message
x-i18n:
    generated_at: "2026-04-05T13:49:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: b70f36189d028d59db25cd8b39d7c67883eaea71bea2358ee6314eec6cd2fa51
    source_path: cli/message.md
    workflow: 15
---

# `openclaw message`

Mesajlar ve kanal eylemleri göndermek için tek giden komut
(Discord/Google Chat/iMessage/Matrix/Mattermost (plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## Kullanım

```
openclaw message <subcommand> [flags]
```

Kanal seçimi:

- Birden fazla kanal yapılandırılmışsa `--channel` gereklidir.
- Tam olarak bir kanal yapılandırılmışsa, varsayılan olarak o kullanılır.
- Değerler: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost için plugin gerekir)

Hedef biçimleri (`--target`):

- WhatsApp: E.164 veya grup JID
- Telegram: sohbet kimliği veya `@username`
- Discord: `channel:<id>` veya `user:<id>` (ya da `<@id>` mention; ham sayısal kimlikler kanal olarak değerlendirilir)
- Google Chat: `spaces/<spaceId>` veya `users/<userId>`
- Slack: `channel:<id>` veya `user:<id>` (ham kanal kimliği kabul edilir)
- Mattermost (plugin): `channel:<id>`, `user:<id>` veya `@username` (yalın kimlikler kanal olarak değerlendirilir)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` veya `username:<name>`/`u:<name>`
- iMessage: handle, `chat_id:<id>`, `chat_guid:<guid>` veya `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` veya `#alias:server`
- Microsoft Teams: konuşma kimliği (`19:...@thread.tacv2`) veya `conversation:<id>` ya da `user:<aad-object-id>`

Ad araması:

- Desteklenen sağlayıcılarda (Discord/Slack/vb.), `Help` veya `#help` gibi kanal adları dizin önbelleği üzerinden çözülür.
- Önbellek isabet etmezse, sağlayıcı destekliyorsa OpenClaw canlı dizin araması yapmayı dener.

## Yaygın bayraklar

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (send/poll/read/vb. için hedef kanal veya kullanıcı)
- `--targets <name>` (tekrarlanır; yalnızca broadcast)
- `--json`
- `--dry-run`
- `--verbose`

## SecretRef davranışı

- `openclaw message`, seçilen eylemi çalıştırmadan önce desteklenen kanal SecretRef’lerini çözümler.
- Çözümleme mümkün olduğunda etkin eylem hedefine göre kapsamlandırılır:
  - `--channel` ayarlandığında kanal kapsamlı (veya `discord:...` gibi önekli hedeflerden çıkarıldığında)
  - `--account` ayarlandığında hesap kapsamlı (kanal genelleri + seçilen hesap yüzeyleri)
  - `--account` atlandığında OpenClaw `default` hesap SecretRef kapsamını zorlamaz
- İlgisiz kanallardaki çözümlenmemiş SecretRef’ler hedefli bir mesaj eylemini engellemez.
- Seçilen kanal/hesap SecretRef’i çözümlenmemişse komut o eylem için güvenli biçimde başarısız olur.

## Eylemler

### Çekirdek

- `send`
  - Kanallar: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Gerekli: `--target`, ayrıca `--message` veya `--media`
  - İsteğe bağlı: `--media`, `--interactive`, `--buttons`, `--components`, `--card`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Paylaşılan etkileşimli yükler: `--interactive`, desteklendiğinde kanala özgü etkileşimli bir JSON yükü gönderir
  - Yalnızca Telegram: `--buttons` (buna izin verilmesi için `channels.telegram.capabilities.inlineButtons` gerekir)
  - Yalnızca Telegram: `--force-document` (Telegram sıkıştırmasını önlemek için görselleri ve GIF’leri belge olarak gönderir)
  - Yalnızca Telegram: `--thread-id` (forum konu kimliği)
  - Yalnızca Slack: `--thread-id` (iş parçacığı zaman damgası; `--reply-to` aynı alanı kullanır)
  - Yalnızca Discord: `--components` JSON yükü
  - Adaptive Card kanalları: desteklendiğinde `--card` JSON yükü
  - Telegram + Discord: `--silent`
  - Yalnızca WhatsApp: `--gif-playback`

- `poll`
  - Kanallar: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Gerekli: `--target`, `--poll-question`, `--poll-option` (tekrarlanır)
  - İsteğe bağlı: `--poll-multi`
  - Yalnızca Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Yalnızca Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Kanallar: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - Gerekli: `--message-id`, `--target`
  - İsteğe bağlı: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Not: `--remove` için `--emoji` gerekir (`--emoji` atlanırsa, desteklenen yerlerde kendi tepkilerinizi temizler; bkz. /tools/reactions)
  - Yalnızca WhatsApp: `--participant`, `--from-me`
  - Signal grup tepkileri: `--target-author` veya `--target-author-uuid` gereklidir

- `reactions`
  - Kanallar: Discord/Google Chat/Slack/Matrix
  - Gerekli: `--message-id`, `--target`
  - İsteğe bağlı: `--limit`

- `read`
  - Kanallar: Discord/Slack/Matrix
  - Gerekli: `--target`
  - İsteğe bağlı: `--limit`, `--before`, `--after`
  - Yalnızca Discord: `--around`

- `edit`
  - Kanallar: Discord/Slack/Matrix
  - Gerekli: `--message-id`, `--message`, `--target`

- `delete`
  - Kanallar: Discord/Slack/Telegram/Matrix
  - Gerekli: `--message-id`, `--target`

- `pin` / `unpin`
  - Kanallar: Discord/Slack/Matrix
  - Gerekli: `--message-id`, `--target`

- `pins` (liste)
  - Kanallar: Discord/Slack/Matrix
  - Gerekli: `--target`

- `permissions`
  - Kanallar: Discord/Matrix
  - Gerekli: `--target`
  - Yalnızca Matrix: Matrix şifreleme etkin olduğunda ve doğrulama eylemlerine izin verildiğinde kullanılabilir

- `search`
  - Kanallar: Discord
  - Gerekli: `--guild-id`, `--query`
  - İsteğe bağlı: `--channel-id`, `--channel-ids` (tekrarlanır), `--author-id`, `--author-ids` (tekrarlanır), `--limit`

### İş parçacıkları

- `thread create`
  - Kanallar: Discord
  - Gerekli: `--thread-name`, `--target` (kanal kimliği)
  - İsteğe bağlı: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - Kanallar: Discord
  - Gerekli: `--guild-id`
  - İsteğe bağlı: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - Kanallar: Discord
  - Gerekli: `--target` (iş parçacığı kimliği), `--message`
  - İsteğe bağlı: `--media`, `--reply-to`

### Emojiler

- `emoji list`
  - Discord: `--guild-id`
  - Slack: ek bayrak yok

- `emoji upload`
  - Kanallar: Discord
  - Gerekli: `--guild-id`, `--emoji-name`, `--media`
  - İsteğe bağlı: `--role-ids` (tekrarlanır)

### Çıkartmalar

- `sticker send`
  - Kanallar: Discord
  - Gerekli: `--target`, `--sticker-id` (tekrarlanır)
  - İsteğe bağlı: `--message`

- `sticker upload`
  - Kanallar: Discord
  - Gerekli: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### Roller / Kanallar / Üyeler / Ses

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (+ Discord için `--guild-id`)
- `voice status` (Discord): `--guild-id`, `--user-id`

### Etkinlikler

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - İsteğe bağlı: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### Moderasyon (Discord)

- `timeout`: `--guild-id`, `--user-id` (isteğe bağlı `--duration-min` veya `--until`; her ikisi de atlanırsa timeout temizlenir)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` ayrıca `--reason` destekler

### Broadcast

- `broadcast`
  - Kanallar: yapılandırılmış herhangi bir kanal; tüm sağlayıcıları hedeflemek için `--channel all` kullanın
  - Gerekli: `--targets <target...>`
  - İsteğe bağlı: `--message`, `--media`, `--dry-run`

## Örnekler

Bir Discord yanıtı gönderin:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

Bileşenlerle bir Discord mesajı gönderin:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --components '{"text":"Choose a path","blocks":[{"type":"actions","buttons":[{"label":"Approve","style":"success"},{"label":"Decline","style":"danger"}]}]}'
```

Tam şema için [Discord components](/tr/channels/discord#interactive-components) bölümüne bakın.

Paylaşılan etkileşimli bir yük gönderin:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --interactive '{"text":"Choose a path","blocks":[{"type":"actions","buttons":[{"label":"Approve"},{"label":"Decline"}]}]}'
```

Bir Discord anketi oluşturun:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Bir Telegram anketi oluşturun (2 dakikada otomatik kapanır):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Proaktif bir Teams mesajı gönderin:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Bir Teams anketi oluşturun:

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

Telegram satır içi düğmeler gönderin:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --buttons '[ [{"text":"Yes","callback_data":"cmd:yes"}], [{"text":"No","callback_data":"cmd:no"}] ]'
```

Bir Teams Adaptive Card gönderin:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Status update"}]}'
```

Sıkıştırmayı önlemek için bir Telegram görselini belge olarak gönderin:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```
