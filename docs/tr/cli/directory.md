---
read_when:
    - Bir kanal için kişi/grup/kendi kimliklerinizi aramak istiyorsunuz
    - Bir kanal dizini bağdaştırıcısı geliştiriyorsunuz
summary: '`openclaw directory` (kendisi, eşler, gruplar) için CLI başvurusu'
title: Dizin
x-i18n:
    generated_at: "2026-07-12T12:10:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e1a952525f79dcb6eedb87eb433be7cb378fa19de5f252521e287d2c52275c
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Destekleyen kanallar için dizin sorgulamaları: kişiler/eşler, gruplar ve "ben" (kendi).

Sonuçlar, özellikle `openclaw message send --target ...` olmak üzere diğer komutlara yapıştırılmak üzere tasarlanmıştır.

## Ortak bayraklar

- `--channel <name>`: kanal kimliği/takma adı (birden fazla kanal yapılandırıldığında gereklidir; yalnızca bir kanal yapılandırıldığında otomatik olarak seçilir)
- `--account <id>`: hesap kimliği (varsayılan: kanalın varsayılan hesabı)
- `--json`: JSON çıktısı üretir

Varsayılan (JSON olmayan) çıktı, sekmeyle ayrılmış `id` (ve bazen `name`) biçimindedir.

## Notlar

- Birçok kanalda sonuçlar, canlı bir sağlayıcı dizini yerine yapılandırmaya (izin listelerine/yapılandırılmış gruplara) dayanır.
- Önceden yüklenmiş bir kanal plugini dizin desteğine sahip olmayabilir. Bu durumda komut, desteklenmeyen işlemi bildirir; destek eklemek için plugini yeniden yüklemeyi veya yükseltmeyi denemez.

## Sonuçları `message send` ile kullanma

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Kanala göre kimlik biçimleri

| Kanal                               | Hedef kimlik biçimi                                                                                                               |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| WhatsApp                            | `+15551234567` (özel mesaj), `1234567890-1234567890@g.us` (grup), `120363123456789@newsletter` (Kanal/Bülten, yalnızca giden)      |
| Signal                              | Yapılandırılmış takma adlar, E.164/UUID özel mesaj hedeflerine veya `group:<id>` grup hedeflerine çözümlenir                       |
| Telegram                            | `@username` veya sayısal sohbet kimliği; gruplar sayısal kimlikler kullanır                                                        |
| Slack                               | `user:U…` ve `channel:C…`                                                                                                          |
| Discord                             | `user:<id>` ve `channel:<id>`                                                                                                      |
| Matrix (plugin)                     | `user:@user:server`, `room:!roomId:server` veya `#alias:server`                                                                    |
| Microsoft Teams (plugin)            | `user:<id>` ve `conversation:<id>`                                                                                                 |
| Zalo (plugin)                       | Kullanıcı kimliği (Bot API)                                                                                                        |
| Zalo Personal / `zalouser` (plugin) | `zca` üzerinden (`me`, `friend list`, `group list`) alınan ileti dizisi kimliği (özel mesaj/grup)                                  |

## Kendi ("ben")

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
