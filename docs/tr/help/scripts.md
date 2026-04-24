---
read_when:
    - Repodaki betikleri çalıştırma
    - '`./scripts` altına betik ekleme veya değiştirme'
summary: 'Repo betikleri: amaç, kapsam ve güvenlik notları'
title: Betikler
x-i18n:
    generated_at: "2026-04-24T09:13:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d76777402670abe355b9ad2a0337f96211af1323e36f2ab1ced9f04f87083f5
    source_path: help/scripts.md
    workflow: 15
---

`scripts/` dizini, yerel iş akışları ve operasyon görevleri için yardımcı betikler içerir.
Bir görev açıkça bir betiğe bağlıysa bunları kullanın; aksi halde CLI'yi tercih edin.

## Kurallar

- Belgelerde veya sürüm kontrol listelerinde başvurulmadıkça betikler **isteğe bağlıdır**.
- Varsa CLI yüzeylerini tercih edin (örnek: auth izleme için `openclaw models status --check` kullanılır).
- Betiklerin host'a özgü olduğunu varsayın; yeni bir makinede çalıştırmadan önce okuyun.

## Auth izleme betikleri

Auth izleme [Authentication](/tr/gateway/authentication) içinde ele alınır. `scripts/` altındaki betikler, systemd/Termux telefon iş akışları için isteğe bağlı ekstralardır.

## GitHub okuma yardımcısı

Repo kapsamlı okuma çağrıları için `gh`'nin bir GitHub App kurulum token'ı kullanmasını isterken, yazma işlemleri için normal `gh`'yi kişisel girişinizde bırakmak istiyorsanız `scripts/gh-read` kullanın.

Gerekli ortam değişkenleri:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

İsteğe bağlı ortam değişkenleri:

- Repo tabanlı kurulum aramasını atlamak istiyorsanız `OPENCLAW_GH_READ_INSTALLATION_ID`
- İstenecek okuma izin alt kümesini virgülle ayrılmış şekilde geçersiz kılmak için `OPENCLAW_GH_READ_PERMISSIONS`

Repo çözümleme sırası:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

Örnekler:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## Betik eklerken

- Betikleri odaklı ve belgelenmiş tutun.
- İlgili belgeye kısa bir giriş ekleyin (veya eksikse oluşturun).

## İlgili

- [Testing](/tr/help/testing)
- [Testing live](/tr/help/testing-live)
