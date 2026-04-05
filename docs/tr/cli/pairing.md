---
read_when:
    - Eşleme modundaki DM'leri kullanıyorsunuz ve göndericileri onaylamanız gerekiyor
summary: '`openclaw pairing` için CLI başvurusu (eşleme isteklerini onaylama/listeleme)'
title: pairing
x-i18n:
    generated_at: "2026-04-05T13:48:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 122a608ef83ec2b1011fdfd1b59b94950a4dcc8b598335b0956e2eedece4958f
    source_path: cli/pairing.md
    workflow: 15
---

# `openclaw pairing`

DM eşleme isteklerini onaylayın veya inceleyin (eşlemeyi destekleyen kanallar için).

İlgili:

- Eşleme akışı: [Pairing](/tr/channels/pairing)

## Komutlar

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve <code>
openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## `pairing list`

Bir kanal için bekleyen eşleme isteklerini listeleyin.

Seçenekler:

- `[channel]`: konumsal kanal kimliği
- `--channel <channel>`: açık kanal kimliği
- `--account <accountId>`: çok hesaplı kanallar için hesap kimliği
- `--json`: makine tarafından okunabilir çıktı

Notlar:

- Birden fazla eşleme destekli kanal yapılandırılmışsa, kanalı konumsal olarak veya `--channel` ile belirtmelisiniz.
- Kanal kimliği geçerli olduğu sürece extension kanallarına izin verilir.

## `pairing approve`

Bekleyen bir eşleme kodunu onaylayın ve o göndericiye izin verin.

Kullanım:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- Tam olarak bir eşleme destekli kanal yapılandırılmışsa `openclaw pairing approve <code>`

Seçenekler:

- `--channel <channel>`: açık kanal kimliği
- `--account <accountId>`: çok hesaplı kanallar için hesap kimliği
- `--notify`: aynı kanalda istekte bulunan kişiye bir onay geri bildirimi gönder

## Notlar

- Kanal girdisi: bunu konumsal olarak (`pairing list telegram`) veya `--channel <channel>` ile geçin.
- `pairing list`, çok hesaplı kanallar için `--account <accountId>` desteği sunar.
- `pairing approve`, `--account <accountId>` ve `--notify` desteği sunar.
- Yalnızca bir eşleme destekli kanal yapılandırılmışsa `pairing approve <code>` kullanılabilir.
