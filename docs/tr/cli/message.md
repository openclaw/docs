---
read_when:
    - Mesaj CLI eylemlerini ekleme veya değiştirme
    - Giden kanal davranışını değiştirme
summary: '`openclaw message` için CLI başvurusu (gönder + kanal eylemleri)'
title: Mesaj
x-i18n:
    generated_at: "2026-04-24T09:02:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39932fb54caee37bdf58681da22b30e1b4cc7cc11b654010bf0335b1da3b2b4d
    source_path: cli/message.md
    workflow: 15
---

# `openclaw message`

Mesaj göndermek ve kanal eylemleri için tek giden komut
(Discord/Google Chat/iMessage/Matrix/Mattermost (Plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## Kullanım

```
openclaw message <subcommand> [flags]
```

Kanal seçimi:

- Birden fazla kanal yapılandırılmışsa `--channel` gereklidir.
- Yalnızca bir kanal yapılandırılmışsa bu varsayılan olur.
- Değerler: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost için Plugin gerekir)

Hedef biçimleri (`--target`):

- WhatsApp: E.164 veya grup JID
- Telegram: sohbet kimliği veya `@username`
- Discord: `channel:<id>` veya `user:<id>` (veya `<@id>` mention; ham sayısal kimlikler kanal olarak değerlendirilir)
- Google Chat: `spaces/<spaceId>` veya `users/<userId>`
- Slack: `channel:<id>` veya `user:<id>` (ham kanal kimliği kabul edilir)
- Mattermost (Plugin): `channel:<id>`, `user:<id>` veya `@username` (yalın kimlikler kanal olarak değerlendirilir)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` veya `username:<name>`/`u:<name>`
- iMessage: handle, `chat_id:<id>`, `chat_guid:<guid>` veya `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` veya `#alias:server`
- Microsoft Teams: konuşma kimliği (`19:...@thread.tacv2`) veya `conversation:<id>` veya `user:<aad-object-id>`

Ad arama:

- Desteklenen sağlayıcılarda (Discord/Slack/vb.), `Help` veya `#help` gibi kanal adları dizin önbelleği üzerinden çözümlenir.
- Önbellek kaçırıldığında, sağlayıcı destekliyorsa OpenClaw canlı dizin araması yapmayı dener.

## Yaygın bayraklar

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (send/poll/read/vb. için hedef kanal veya kullanıcı)
- `--targets <name>` (tekrarlanabilir; yalnızca broadcast)
- `--json`
- `--dry-run`
- `--verbose`

## SecretRef davranışı

- `openclaw message`, seçili eylemi çalıştırmadan önce desteklenen kanal SecretRef'lerini çözümler.
- Çözümleme mümkün olduğunda etkin eylem hedefine kapsamlanır:
  - `--channel` ayarlıysa kanal kapsamlı (veya `discord:...` gibi önekli hedeflerden çıkarılıyorsa)
  - `--account` ayarlıysa hesap kapsamlı (kanal genelleri + seçili hesap yüzeyleri)
  - `--account` belirtilmemişse OpenClaw `default` hesap SecretRef kapsamını zorlamaz
- İlgisiz kanallardaki çözümlenmemiş SecretRef'ler hedefli bir mesaj eylemini engellemez.
- Seçili kanal/hesap SecretRef'i çözümlenmemişse komut o eylem için fail-closed olur.

## Eylemler

### Çekirdek

- `send`
  - Kanallar: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Gerekli: `--target` ve ayrıca `--message`, `--media` veya `--presentation`
  - İsteğe bağlı: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Paylaşılan presentation payload'ları: `--presentation`, çekirdeğin seçili kanalın bildirilmiş yetenekleri üzerinden işlediği anlamsal blokları (`text`, `context`, `divider`, `buttons`, `select`) gönderir. Bkz. [Mesaj Sunumu](/tr/plugins/message-presentation).
  - Genel teslim tercihleri: `--delivery`, `{ "pin": true }` gibi teslim ipuçlarını kabul eder; `--pin`, kanal destekliyorsa sabitlenmiş teslim için kısa yoldur.
  - Yalnızca Telegram: `--force-document` (Telegram sıkıştırmasından kaçınmak için görselleri ve GIF'leri belge olarak gönder)
  - Yalnızca Telegram: `--thread-id` (forum konu kimliği)
  - Yalnızca Slack: `--thread-id` (konu zaman damgası; `--reply-to` aynı alanı kullanır)
  - Telegram + Discord: `--silent`
  - Yalnızca WhatsApp: `--gif-playback`

- `poll`
  - Kanallar: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Gerekli: `--target`, `--poll-question`, `--poll-option` (tekrarlı)
  - İsteğe bağlı: `--poll-multi`
  - Yalnızca Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Yalnızca Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Kanallar: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - Gerekli: `--message-id`, `--target`
  - İsteğe bağlı: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Not: `--remove`, `--emoji` gerektirir (`--emoji` belirtilmezse desteklenen yerlerde kendi tepkilerini temizler; bkz. /tools/reactions)
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
  - Yalnızca Matrix: Matrix şifrelemesi etkin olduğunda ve doğrulama eylemlerine izin verildiğinde kullanılabilir

- `search`
  - Kanallar: Discord
  - Gerekli: `--guild-id`, `--query`
  - İsteğe bağlı: `--channel-id`, `--channel-ids` (tekrarlı), `--author-id`, `--author-ids` (tekrarlı), `--limit`

### Konular

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
  - Gerekli: `--target` (konu kimliği), `--message`
  - İsteğe bağlı: `--media`, `--reply-to`

### Emojiler

- `emoji list`
  - Discord: `--guild-id`
  - Slack: ek bayrak yok

- `emoji upload`
  - Kanallar: Discord
  - Gerekli: `--guild-id`, `--emoji-name`, `--media`
  - İsteğe bağlı: `--role-ids` (tekrarlı)

### Çıkartmalar

- `sticker send`
  - Kanallar: Discord
  - Gerekli: `--target`, `--sticker-id` (tekrarlı)
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

### Olaylar

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - İsteğe bağlı: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### Moderasyon (Discord)

- `timeout`: `--guild-id`, `--user-id` (isteğe bağlı `--duration-min` veya `--until`; her ikisini de belirtmezseniz timeout temizlenir)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout`, `--reason` da destekler

### Yayın

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

Anlamsal düğmelerle bir mesaj gönderin:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

Çekirdek, aynı `presentation` payload'ını kanal yeteneğine bağlı olarak Discord bileşenlerine, Slack bloklarına, Telegram satır içi düğmelerine, Mattermost props'larına veya Teams/Feishu kartlarına işler. Tam sözleşme ve fallback kuralları için [Mesaj Sunumu](/tr/plugins/message-presentation) bölümüne bakın.

Daha zengin bir presentation payload'ı gönderin:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

Bir Discord anketi oluşturun:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Bir Telegram anketi oluşturun (2 dakika sonra otomatik kapanır):

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

Slack'te tepki verin:

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

Genel presentation üzerinden Telegram satır içi düğmeleri gönderin:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Genel presentation üzerinden bir Teams kartı gönderin:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

Sıkıştırmadan kaçınmak için bir Telegram görselini belge olarak gönderin:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## İlgili

- [CLI başvurusu](/tr/cli)
- [Ajan gönderimi](/tr/tools/agent-send)
