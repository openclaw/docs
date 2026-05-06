---
read_when:
    - Eşleştirme modu doğrudan mesajlarını kullanıyorsunuz ve göndericileri onaylamanız gerekiyor
summary: '`openclaw pairing` için CLI referansı (eşleştirme isteklerini onaylama/listeleme)'
title: Eşleştirme
x-i18n:
    generated_at: "2026-05-06T17:54:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 022018239ab1134b18986be42b8e019f412a1a730a9671f422979909c4a31dc5
    source_path: cli/pairing.md
    workflow: 16
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

Bir kanal için bekleyen eşleştirme isteklerini listeleyin.

Seçenekler:

- `[channel]`: konumsal kanal kimliği
- `--channel <channel>`: açık kanal kimliği
- `--account <accountId>`: çok hesaplı kanallar için hesap kimliği
- `--json`: makine tarafından okunabilir çıktı

Notlar:

- Birden fazla eşleştirme destekli kanal yapılandırılmışsa, kanalı konumsal olarak veya `--channel` ile belirtmeniz gerekir.
- Kanal kimliği geçerli olduğu sürece uzantı kanallarına izin verilir.

## `pairing approve`

Bekleyen bir eşleştirme kodunu onaylayın ve bu gönderene izin verin.

Kullanım:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- Tam olarak bir eşleştirme destekli kanal yapılandırılmışsa `openclaw pairing approve <code>`

Seçenekler:

- `--channel <channel>`: açık kanal kimliği
- `--account <accountId>`: çok hesaplı kanallar için hesap kimliği
- `--notify`: istekte bulunana aynı kanal üzerinden bir onay gönder

Sahip önyüklemesi:

- Bir eşleştirme kodunu onayladığınızda `commands.ownerAllowFrom` boşsa, OpenClaw onaylanan göndereni `telegram:123456789` gibi kanal kapsamlı bir giriş kullanarak komut sahibi olarak da kaydeder.
- Bu yalnızca ilk sahibi önyükler. Daha sonraki eşleştirme onayları `commands.ownerAllowFrom` değerini değiştirmez veya genişletmez.
- Komut sahibi, yalnızca sahibin çalıştırmasına izin verilen komutları çalıştırmasına ve `/diagnostics`, `/export-trajectory`, `/config` ve yürütme onayları gibi tehlikeli eylemleri onaylamasına izin verilen insan operatör hesabıdır.

## Notlar

- Kanal girişi: konumsal olarak (`pairing list telegram`) veya `--channel <channel>` ile geçirin.
- `pairing list`, çok hesaplı kanallar için `--account <accountId>` desteği sunar.
- `pairing approve`, `--account <accountId>` ve `--notify` desteği sunar.
- Yalnızca bir eşleştirme destekli kanal yapılandırılmışsa, `pairing approve <code>` kullanımına izin verilir.
- Bu önyükleme mevcut olmadan önce bir göndereni onayladıysanız, `openclaw doctor` komutunu çalıştırın; komut sahibi yapılandırılmadığında uyarı verir ve bunu düzeltmek için `openclaw config set commands.ownerAllowFrom ...` komutunu gösterir.

## İlgili

- [CLI referansı](/tr/cli)
- [Kanal eşleştirmesi](/tr/channels/pairing)
