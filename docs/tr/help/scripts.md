---
read_when:
    - Betikleri depodan çalıştırma
    - ./scripts altında betik ekleme veya değiştirme
summary: 'Depo betikleri: amaç, kapsam ve güvenlik notları'
title: Betikler
x-i18n:
    generated_at: "2026-05-06T09:16:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01f2e064891940959acf23c003d7e842386f67ac6c869d0677b802738ac04bdf
    source_path: help/scripts.md
    workflow: 16
    postprocess_version: locale-links-v1
---

`scripts/` dizini, yerel iş akışları ve operasyon görevleri için yardımcı betikler içerir.
Bir görev açıkça bir betiğe bağlı olduğunda bunları kullanın; aksi halde CLI'ı tercih edin.

## Kurallar

- Dokümanlarda veya sürüm kontrol listelerinde atıfta bulunulmadıkça betikler **isteğe bağlıdır**.
- Var olduklarında CLI yüzeylerini tercih edin (örnek: kimlik doğrulama izleme `openclaw models status --check` kullanır).
- Betiklerin ana makineye özgü olduğunu varsayın; yeni bir makinede çalıştırmadan önce onları okuyun.

## Kimlik doğrulama izleme betikleri

Kimlik doğrulama izleme [Kimlik Doğrulama](/tr/gateway/authentication) bölümünde ele alınır. `scripts/` altındaki betikler, systemd/Termux telefon iş akışları için isteğe bağlı ek araçlardır.

## GitHub okuma yardımcısı

Normal `gh` komutunu yazma eylemleri için kişisel oturumunuzda bırakırken, repo kapsamlı okuma çağrıları için `gh` komutunun bir GitHub App kurulum belirteci kullanmasını istediğinizde `scripts/gh-read` kullanın.

Gerekli env:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

İsteğe bağlı env:

- Repo tabanlı kurulum aramasını atlamak istediğinizde `OPENCLAW_GH_READ_INSTALLATION_ID`
- İstenecek okuma izni alt kümesini geçersiz kılmak için virgülle ayrılmış değer olarak `OPENCLAW_GH_READ_PERMISSIONS`

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
- İlgili dokümana kısa bir giriş ekleyin (veya eksikse bir tane oluşturun).

## İlgili

- [Test Etme](/tr/help/testing)
- [Canlı test etme](/tr/help/testing-live)
