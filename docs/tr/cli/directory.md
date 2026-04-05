---
read_when:
    - Bir kanal için kişi/grup/kendi kimliklerini aramak istediğinizde
    - Bir kanal dizini bağdaştırıcısı geliştirirken
summary: '`openclaw directory` için CLI başvurusu (kendim, eşler, gruplar)'
title: directory
x-i18n:
    generated_at: "2026-04-05T13:48:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a81a037e0a33f77c24b1adabbc4be16ed4d03c419873f3cbdd63f2ce84a1064
    source_path: cli/directory.md
    workflow: 15
---

# `openclaw directory`

Bunu destekleyen kanallar için dizin sorguları (kişiler/eşler, gruplar ve “ben”).

## Yaygın bayraklar

- `--channel <name>`: kanal kimliği/takma adı (birden fazla kanal yapılandırılmışsa gereklidir; yalnızca bir kanal yapılandırılmışsa otomatik)
- `--account <id>`: hesap kimliği (varsayılan: kanal varsayılanı)
- `--json`: JSON çıktısı ver

## Notlar

- `directory`, başka komutlara yapıştırabileceğiniz kimlikleri bulmanıza yardımcı olmak için tasarlanmıştır (özellikle `openclaw message send --target ...`).
- Birçok kanalda sonuçlar canlı sağlayıcı dizini yerine yapılandırma desteklidir (allowlist'ler / yapılandırılmış gruplar).
- Varsayılan çıktı sekmeyle ayrılmış `id` (ve bazen `name`) biçimindedir; betik kullanımı için `--json` kullanın.

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
- Matrix (eklenti): `user:@user:server`, `room:!roomId:server` veya `#alias:server`
- Microsoft Teams (eklenti): `user:<id>` ve `conversation:<id>`
- Zalo (eklenti): kullanıcı kimliği (Bot API)
- Zalo Personal / `zalouser` (eklenti): `zca` üzerinden thread kimliği (DM/grup) (`me`, `friend list`, `group list`)

## Kendim ("me")

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
