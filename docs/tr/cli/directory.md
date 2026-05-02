---
read_when:
    - Bir kanal için kişi/grup/kendi kimliklerini aramak istiyorsunuz
    - Bir kanal dizini bağdaştırıcısı geliştiriyorsunuz
summary: '`openclaw directory` için CLI referansı (self, peers, groups)'
title: Dizin
x-i18n:
    generated_at: "2026-05-02T08:50:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcd0be284c0ec1aa347084d84f7001f1e2f47977ec5198025ba303297858aaab
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Bunu destekleyen kanallar için dizin aramaları (kişiler/eşler, gruplar ve “ben”).

## Ortak bayraklar

- `--channel <name>`: kanal kimliği/takma adı (birden fazla kanal yapılandırıldığında zorunlu; yalnızca bir kanal yapılandırıldığında otomatik)
- `--account <id>`: hesap kimliği (varsayılan: kanal varsayılanı)
- `--json`: JSON çıktısı ver

## Notlar

- `directory`, diğer komutlara yapıştırabileceğiniz kimlikleri bulmanıza yardımcı olmak içindir (özellikle `openclaw message send --target ...`).
- Birçok kanal için sonuçlar canlı bir sağlayıcı dizini yerine yapılandırma desteklidir (izin listeleri / yapılandırılmış gruplar).
- Yüklü kanal Plugin'leri yine de dizin desteğini atlayabilir; bu durumda komut, Plugin'i yeniden yüklemek yerine desteklenmeyen dizin işlemini bildirir.
- Varsayılan çıktı, sekme ile ayrılmış `id` (ve bazen `name`) değeridir; betik yazımı için `--json` kullanın.

## Sonuçları `message send` ile kullanma

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Kimlik biçimleri (kanala göre)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (grup)
- Telegram: `@username` veya sayısal sohbet kimliği; gruplar sayısal kimliklerdir
- Slack: `user:U…` ve `channel:C…`
- Discord: `user:<id>` ve `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server` veya `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` ve `conversation:<id>`
- Zalo (Plugin): kullanıcı kimliği (Bot API)
- Zalo Personal / `zalouser` (Plugin): `zca` kaynağından iş parçacığı kimliği (DM/grup) (`me`, `friend list`, `group list`)

## Kendi kullanıcı ("me")

```bash
openclaw directory self --channel zalouser
```

## Eşler (kişiler/kullanıcılar)

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## Gruplar

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```

## İlgili

- [CLI başvurusu](/tr/cli)
