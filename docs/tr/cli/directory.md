---
read_when:
    - Bir kanal için kişileri/grupları/kendi kimliklerini aramak istiyorsunuz
    - Bir kanal dizini bağdaştırıcısı geliştiriyorsunuz
summary: '`openclaw directory` için CLI başvurusu (self, peers, groups)'
title: Dizin
x-i18n:
    generated_at: "2026-04-24T09:02:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: f63ed92469738501ae1f8f08aec3edf01d1f0f46008571ed38ccd9c77e5ba15e
    source_path: cli/directory.md
    workflow: 15
---

# `openclaw directory`

Bunu destekleyen kanallar için dizin aramaları (kişiler/eşler, gruplar ve “ben”).

## Yaygın bayraklar

- `--channel <name>`: kanal kimliği/takma adı (birden fazla kanal yapılandırılmışsa gereklidir; yalnızca bir kanal yapılandırılmışsa otomatik)
- `--account <id>`: hesap kimliği (varsayılan: kanalın varsayılan hesabı)
- `--json`: JSON çıktısı

## Notlar

- `directory`, diğer komutlara yapıştırabileceğiniz kimlikleri bulmanıza yardımcı olmak içindir (özellikle `openclaw message send --target ...`).
- Birçok kanal için sonuçlar canlı bir sağlayıcı dizini yerine yapılandırma desteklidir (izin listeleri / yapılandırılmış gruplar).
- Varsayılan çıktı sekmeyle ayrılmış `id` (ve bazen `name`) biçimindedir; betikleme için `--json` kullanın.

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
- Zalo Personal / `zalouser` (Plugin): `zca` içinden iş parçacığı kimliği (DM/grup) (`me`, `friend list`, `group list`)

## Benlik ("me")

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
