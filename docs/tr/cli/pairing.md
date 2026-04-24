---
read_when:
    - Eşleştirme modundaki DM'leri kullanıyorsunuz ve gönderenleri onaylamanız gerekiyor
summary: '`openclaw pairing` için CLI başvurusu (eşleştirme isteklerini onaylama/listeleme)'
title: Eşleştirme
x-i18n:
    generated_at: "2026-04-24T09:03:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e81dc407138e958e41d565b0addb600ad1ba5187627bb219f0b85b92bd112d1
    source_path: cli/pairing.md
    workflow: 15
---

# `openclaw pairing`

DM eşleştirme isteklerini onaylayın veya inceleyin (eşleştirmeyi destekleyen kanallar için).

İlgili:

- Eşleştirme akışı: [Eşleştirme](/tr/channels/pairing)

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

Tek bir kanal için bekleyen eşleştirme isteklerini listeler.

Seçenekler:

- `[channel]`: konumsal kanal kimliği
- `--channel <channel>`: açık kanal kimliği
- `--account <accountId>`: çok hesaplı kanallar için hesap kimliği
- `--json`: makine tarafından okunabilir çıktı

Notlar:

- Eşleştirme destekleyen birden fazla kanal yapılandırılmışsa kanalı ya konumsal olarak ya da `--channel` ile sağlamalısınız.
- Kanal kimliği geçerli olduğu sürece uzantı kanallarına izin verilir.

## `pairing approve`

Bekleyen bir eşleştirme kodunu onaylar ve o gönderene izin verir.

Kullanım:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- Tam olarak bir eşleştirme destekli kanal yapılandırılmışsa `openclaw pairing approve <code>`

Seçenekler:

- `--channel <channel>`: açık kanal kimliği
- `--account <accountId>`: çok hesaplı kanallar için hesap kimliği
- `--notify`: aynı kanalda istekte bulunana bir onay geri bildirimi gönder

## Notlar

- Kanal girdisi: bunu konumsal olarak (`pairing list telegram`) veya `--channel <channel>` ile geçin.
- `pairing list`, çok hesaplı kanallar için `--account <accountId>` desteğine sahiptir.
- `pairing approve`, `--account <accountId>` ve `--notify` destekler.
- Yalnızca bir eşleştirme destekli kanal yapılandırılmışsa `pairing approve <code>` kullanılabilir.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Kanal eşleştirmesi](/tr/channels/pairing)
