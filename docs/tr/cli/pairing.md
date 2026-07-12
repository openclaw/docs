---
read_when:
    - Eşleştirme modu özel mesajlarını kullanıyorsunuz ve gönderenleri onaylamanız gerekiyor
summary: '`openclaw pairing` için CLI başvurusu (eşleştirme isteklerini onaylama/listeleme)'
title: Eşleştirme
x-i18n:
    generated_at: "2026-07-12T11:35:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca83ad9d9e55cfffd49301cb529b28df370c2dcff03484880f7cfc85ec2d6440
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Eşleştirmeyi destekleyen kanallardaki DM eşleştirme isteklerini onaylayın veya inceleyin (yalnızca sohbet DM'leri; Node/cihaz eşleştirmesi için `openclaw devices` kullanılır).

İlgili: [Eşleştirme akışı](/tr/channels/pairing)

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

| Seçenek                 | Açıklama                                  |
| ----------------------- | ----------------------------------------- |
| `[channel]`             | konumsal kanal kimliği                    |
| `--channel <channel>`   | açıkça belirtilen kanal kimliği           |
| `--account <accountId>` | çok hesaplı kanallar için hesap kimliği   |
| `--json`                | makine tarafından okunabilir çıktı        |

Eşleştirme özelliğine sahip birden fazla kanal yapılandırılmışsa kanalı konumsal olarak veya `--channel` ile belirtin. Kanal kimliği geçerli olduğu sürece eklenti kanalları da çalışır.

## `pairing approve`

Bekleyen bir eşleştirme kodunu onaylayın ve ilgili göndericiye izin verin.

Kullanım:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- Yalnızca bir eşleştirme özellikli kanal yapılandırıldığında `openclaw pairing approve <code>`

Seçenekler: `--channel <channel>`, `--account <accountId>`, `--notify` (aynı kanal üzerinden istekte bulunana bir onay gönderir).

### Sahip önyüklemesi

Bir eşleştirme kodunu onayladığınızda `commands.ownerAllowFrom` boşsa OpenClaw, onaylanan göndericiyi `telegram:123456789` gibi kanal kapsamlı bir girdi kullanarak komut sahibi olarak da kaydeder. Bu işlem yalnızca ilk sahibi oluşturur; sonraki eşleştirme onayları `commands.ownerAllowFrom` değerini hiçbir zaman değiştirmez veya genişletmez.

Komut sahibi; yalnızca sahiplerin kullanabildiği komutları çalıştırmasına ve `/diagnostics`, `/export-trajectory`, `/config` ile çalıştırma onayları gibi tehlikeli eylemleri onaylamasına izin verilen insan operatör hesabıdır. Eşleştirme, yalnızca bir göndericinin ajanla konuşmasına izin verir; bu tek seferlik önyükleme dışında kendiliğinden sahip ayrıcalıkları vermez.

Bu önyükleme özelliği eklenmeden önce bir göndericiyi onayladıysanız `openclaw doctor` komutunu çalıştırın; hiçbir komut sahibi yapılandırılmadığında sizi uyarır ve sorunu düzeltmek için tam olarak çalıştırmanız gereken `openclaw config set commands.ownerAllowFrom ...` komutunu gösterir.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Kanal eşleştirmesi](/tr/channels/pairing)
