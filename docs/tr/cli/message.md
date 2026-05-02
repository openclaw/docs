---
read_when:
    - Mesaj CLI eylemleri ekleme veya değiştirme
    - Giden kanal davranışını değiştirme
summary: '`openclaw message` için CLI referansı (gönderme + kanal eylemleri)'
title: Mesaj
x-i18n:
    generated_at: "2026-05-02T20:42:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b73a50da34838f80ad5d0d266f5c66f95436f8535e6312296ae022918b1ab55
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Mesajlar ve kanal eylemleri göndermek için tek giden komut
(Discord/Google Chat/iMessage/Matrix/Mattermost (Plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## Kullanım

```
openclaw message <subcommand> [flags]
```

Kanal seçimi:

- Birden fazla kanal yapılandırılmışsa `--channel` gereklidir.
- Tam olarak bir kanal yapılandırılmışsa varsayılan olur.
- Değerler: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost Plugin gerektirir)
- `openclaw message`, `--channel` veya kanal önekli bir hedef mevcut olduğunda seçilen kanalı sahibi olan Plugin'e çözümler; aksi halde varsayılan kanal çıkarımı için yapılandırılmış kanal Plugin'lerini yükler.

Hedef biçimleri (`--target`):

- WhatsApp: E.164, grup JID'si veya WhatsApp Kanalı/Bülteni JID'si (`...@newsletter`)
- Telegram: sohbet kimliği veya `@username`
- Discord: `channel:<id>` veya `user:<id>` (veya `<@id>` bahsi; ham sayısal kimlikler kanal olarak ele alınır)
- Google Chat: `spaces/<spaceId>` veya `users/<userId>`
- Slack: `channel:<id>` veya `user:<id>` (ham kanal kimliği kabul edilir)
- Mattermost (Plugin): `channel:<id>`, `user:<id>` veya `@username` (yalın kimlikler kanal olarak ele alınır)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` veya `username:<name>`/`u:<name>`
- iMessage: tanıtıcı, `chat_id:<id>`, `chat_guid:<guid>` veya `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` veya `#alias:server`
- Microsoft Teams: konuşma kimliği (`19:...@thread.tacv2`) veya `conversation:<id>` ya da `user:<aad-object-id>`

Ad arama:

- Desteklenen sağlayıcılarda (Discord/Slack/vb.), `Help` veya `#help` gibi kanal adları dizin önbelleği aracılığıyla çözümlenir.
- Önbellekte yoksa, sağlayıcı desteklediğinde OpenClaw canlı dizin araması yapmayı dener.

## Yaygın bayraklar

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (gönderme/yoklama/okuma/vb. için hedef kanal veya kullanıcı)
- `--targets <name>` (tekrarlanabilir; yalnızca yayın)
- `--json`
- `--dry-run`
- `--verbose`

## SecretRef davranışı

- `openclaw message`, seçilen eylemi çalıştırmadan önce desteklenen kanal SecretRef'lerini çözümler.
- Çözümleme mümkün olduğunda etkin eylem hedefiyle sınırlandırılır:
  - `--channel` ayarlandığında (veya `discord:...` gibi önekli hedeflerden çıkarıldığında) kanal kapsamlı
  - `--account` ayarlandığında hesap kapsamlı (kanal genelleri + seçilen hesap yüzeyleri)
  - `--account` atlandığında OpenClaw bir `default` hesap SecretRef kapsamını zorlamaz
- İlgisiz kanallardaki çözümlenmemiş SecretRef'ler hedefli bir mesaj eylemini engellemez.
- Seçilen kanal/hesap SecretRef'i çözümlenmemişse komut o eylem için kapalı şekilde başarısız olur.

## Eylemler

### Çekirdek

- `send`
  - Kanallar: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Gerekli: `--target`, ayrıca `--message`, `--media` veya `--presentation`
  - İsteğe bağlı: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Paylaşılan sunum yükleri: `--presentation`, çekirdeğin seçilen kanalın beyan edilen yetenekleri üzerinden işlediği anlamsal bloklar (`text`, `context`, `divider`, `buttons`, `select`) gönderir. Bkz. [Mesaj Sunumu](/tr/plugins/message-presentation).
  - Genel teslim tercihleri: `--delivery`, `{ "pin": true }` gibi teslim ipuçlarını kabul eder; kanal desteklediğinde `--pin`, sabitlenmiş teslim için kısa yoldur.
  - Yalnızca Telegram: `--force-document` (Telegram sıkıştırmasını önlemek için görselleri ve GIF'leri belge olarak gönderir)
  - Yalnızca Telegram: `--thread-id` (forum konu kimliği)
  - Yalnızca Slack: `--thread-id` (iş parçacığı zaman damgası; `--reply-to` aynı alanı kullanır)
  - Telegram + Discord: `--silent`
  - Yalnızca WhatsApp: `--gif-playback`; WhatsApp Kanalları/Bültenleri kendi yerel `@newsletter` JID'leriyle adreslenir.

- `poll`
  - Kanallar: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Gerekli: `--target`, `--poll-question`, `--poll-option` (tekrarlanabilir)
  - İsteğe bağlı: `--poll-multi`
  - Yalnızca Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Yalnızca Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Kanallar: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - Gerekli: `--message-id`, `--target`
  - İsteğe bağlı: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Not: `--remove`, `--emoji` gerektirir (desteklendiği yerlerde kendi tepkilerinizi temizlemek için `--emoji` değerini atlayın; bkz. /tools/reactions)
  - Yalnızca WhatsApp: `--participant`, `--from-me`
  - Signal grup tepkileri: `--target-author` veya `--target-author-uuid` gerekli

- `reactions`
  - Kanallar: Discord/Google Chat/Slack/Matrix
  - Gerekli: `--message-id`, `--target`
  - İsteğe bağlı: `--limit`

- `read`
  - Kanallar: Discord/Slack/Matrix
  - Gerekli: `--target`
  - İsteğe bağlı: `--limit`, `--message-id`, `--before`, `--after`
  - Yalnızca Slack: `--message-id` belirli bir Slack mesaj zaman damgasını okur; tam bir iş parçacığı yanıtını okumak için `--thread-id` ile birleştirin.
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
  - İsteğe bağlı: `--channel-id`, `--channel-ids` (tekrarlanabilir), `--author-id`, `--author-ids` (tekrarlanabilir), `--limit`

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
  - İsteğe bağlı: `--role-ids` (tekrarlanabilir)

### Çıkartmalar

- `sticker send`
  - Kanallar: Discord
  - Gerekli: `--target`, `--sticker-id` (tekrarlanabilir)
  - İsteğe bağlı: `--message`

- `sticker upload`
  - Kanallar: Discord
  - Gerekli: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

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

Bir Discord yanıtı gönderin:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

Anlamsal düğmeler içeren bir mesaj gönderin:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

Çekirdek, aynı `presentation` yükünü kanal yeteneğine bağlı olarak Discord bileşenlerine, Slack bloklarına, Telegram satır içi düğmelerine, Mattermost prop'larına veya Teams/Feishu kartlarına işler. Tam sözleşme ve geri dönüş kuralları için bkz. [Mesaj Sunumu](/tr/plugins/message-presentation).

Daha zengin bir sunum yükü gönderin:

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

Bir Telegram anketi oluşturun (2 dakika içinde otomatik kapanır):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Bir Teams proaktif mesajı gönderin:

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

Genel sunum üzerinden Telegram satır içi düğmeleri gönderin:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Genel sunum üzerinden bir Teams kartı gönderin:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

Sıkıştırmayı önlemek için bir Telegram görselini belge olarak gönderin:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## İlgili

- [CLI başvurusu](/tr/cli)
- [Agent gönderimi](/tr/tools/agent-send)
