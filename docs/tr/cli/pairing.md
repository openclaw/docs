---
read_when:
    - Eşleştirme modu doğrudan mesajlarını kullanıyorsunuz ve gönderenleri onaylamanız gerekiyor
summary: '`openclaw pairing` için CLI referansı (eşleştirme isteklerini onaylama/listeleme)'
title: Eşleştirme
x-i18n:
    generated_at: "2026-04-30T09:14:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: bffc70a8c08e298f42c8fbc2238fce06993572e72f333e87ad18dea3cf33fab5
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

- Birden fazla eşleştirme özellikli kanal yapılandırılmışsa, kanalı konumsal olarak veya `--channel` ile sağlamanız gerekir.
- Kanal kimliği geçerli olduğu sürece Plugin kanallarına izin verilir.

## `pairing approve`

Bekleyen bir eşleştirme kodunu onaylayın ve o gönderene izin verin.

Kullanım:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- Tam olarak bir eşleştirme özellikli kanal yapılandırıldığında `openclaw pairing approve <code>`

Seçenekler:

- `--channel <channel>`: açık kanal kimliği
- `--account <accountId>`: çok hesaplı kanallar için hesap kimliği
- `--notify`: istekte bulunana aynı kanaldan onay gönder

Sahip önyüklemesi:

- Bir eşleştirme kodunu onayladığınızda `commands.ownerAllowFrom` boşsa, OpenClaw onaylanan göndereni `telegram:123456789` gibi kanal kapsamlı bir giriş kullanarak komut sahibi olarak da kaydeder.
- Bu yalnızca ilk sahibi önyükler. Sonraki eşleştirme onayları `commands.ownerAllowFrom` değerini değiştirmez veya genişletmez.
- Komut sahibi, yalnızca sahip komutlarını çalıştırmasına ve `/diagnostics`, `/export-trajectory`, `/config` ve exec onayları gibi tehlikeli eylemleri onaylamasına izin verilen insan operatör hesabıdır.

## Notlar

- Kanal girişi: konumsal olarak (`pairing list telegram`) veya `--channel <channel>` ile iletin.
- `pairing list`, çok hesaplı kanallar için `--account <accountId>` destekler.
- `pairing approve`, `--account <accountId>` ve `--notify` destekler.
- Yalnızca bir eşleştirme özellikli kanal yapılandırılmışsa, `pairing approve <code>` kullanımına izin verilir.
- Bu önyükleme var olmadan önce bir göndereni onayladıysanız `openclaw doctor` çalıştırın; komut sahibi yapılandırılmadığında uyarı verir ve bunu düzeltmek için `openclaw config set commands.ownerAllowFrom ...` komutunu gösterir.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Kanal eşleştirme](/tr/channels/pairing)
