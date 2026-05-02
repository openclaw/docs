---
read_when:
    - Bir kanal için kişi/grup/kendi kimliklerini bulmak istiyorsunuz
    - Bir kanal dizini bağdaştırıcısı geliştiriyorsunuz
summary: '`openclaw directory` için CLI referansı (kendi, eşler, gruplar)'
title: Dizin
x-i18n:
    generated_at: "2026-05-02T20:41:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 011f762d6f53605a37bd12b31c767594c0efa5681da4b2aabe7fb358751b1542
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Bunu destekleyen kanallar için dizin aramaları (kişiler/eşler, gruplar ve “ben”).

## Ortak bayraklar

- `--channel <name>`: kanal kimliği/takma adı (birden fazla kanal yapılandırıldığında zorunlu; yalnızca bir tane yapılandırılmışsa otomatik)
- `--account <id>`: hesap kimliği (varsayılan: kanal varsayılanı)
- `--json`: JSON çıktısı

## Notlar

- `directory`, diğer komutlara yapıştırabileceğiniz kimlikleri bulmanıza yardımcı olmak içindir (özellikle `openclaw message send --target ...`).
- Birçok kanal için sonuçlar, canlı bir sağlayıcı dizini yerine yapılandırma desteklidir (izin listeleri / yapılandırılmış gruplar).
- Yüklü kanal Plugin'leri yine de dizin desteğini atlayabilir; bu durumda komut, Plugin'i yeniden yüklemek yerine desteklenmeyen dizin işlemini bildirir.
- Varsayılan çıktı, sekmeyle ayrılmış `id` (ve bazen `name`) değeridir; betiklerde kullanmak için `--json` kullanın.

## Sonuçları `message send` ile kullanma

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Kimlik biçimleri (kanala göre)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (grup), `120363123456789@newsletter` (Kanal/Bülten giden hedefi)
- Telegram: `@username` veya sayısal sohbet kimliği; gruplar sayısal kimliklerdir
- Slack: `user:U…` ve `channel:C…`
- Discord: `user:<id>` ve `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server` veya `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` ve `conversation:<id>`
- Zalo (Plugin): kullanıcı kimliği (Bot API)
- Zalo Personal / `zalouser` (Plugin): `zca` üzerinden iş parçacığı kimliği (DM/grup) (`me`, `friend list`, `group list`)

## Kendisi ("ben")

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
