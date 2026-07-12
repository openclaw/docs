---
read_when:
    - Depodan betikleri çalıştırma
    - ./scripts altındaki betikleri ekleme veya değiştirme
summary: 'Depo betikleri: amaç, kapsam ve güvenlik notları'
title: Betikler
x-i18n:
    generated_at: "2026-07-12T12:20:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 323069190ea6647101ee7120e06f6b2a018833d0904a11787fa1b610f5b3d9e1
    source_path: help/scripts.md
    workflow: 16
---

`scripts/`, yerel iş akışları ve operasyon görevleri için yardımcı betikleri içerir. Bir görev açıkça bir betikle ilgiliyse bunları kullanın; aksi takdirde CLI'ı tercih edin.

## Kurallar

- Betikler, belgelerde veya sürüm kontrol listelerinde belirtilmediği sürece **isteğe bağlıdır**.
- Mevcut olduğunda CLI arayüzlerini tercih edin (örnek: `openclaw models status --check`).
- Betiklerin ana makineye özgü olduğunu varsayın; yeni bir makinede çalıştırmadan önce bunları okuyun.

## Kimlik doğrulama izleme betikleri

Genel model kimlik doğrulaması [Kimlik Doğrulama](/tr/gateway/authentication) bölümünde ele alınmaktadır. Aşağıdaki betikler, uzak/ekransız bir ana makinede **Claude Code CLI abonelik belirtecini** izlemek ve telefondan yeniden kimlik doğrulamak için ayrı ve isteğe bağlı bir sistemdir:

- `scripts/setup-auth-system.sh` - tek seferlik kurulum: mevcut kimlik doğrulamasını kontrol eder, uzun ömürlü bir `claude setup-token` oluşturmaya yardımcı olur ve systemd/Termux kurulum adımlarını yazdırır.
- `scripts/claude-auth-status.sh [full|json|simple]` - Claude Code + OpenClaw kimlik doğrulama durumunu kontrol eder.
- `scripts/auth-monitor.sh` - durumu düzenli olarak yoklar ve belirtecin süresinin dolması yaklaştığında bildirim gönderir (OpenClaw gönderimi ve/veya ntfy.sh aracılığıyla). Ortam değişkenleri: `WARN_HOURS` (varsayılan `2`), `NOTIFY_PHONE`, `NOTIFY_NTFY`. Paketle birlikte gelen `scripts/systemd/openclaw-auth-monitor.{service,timer}` aracılığıyla zamanlanmış olarak çalıştırın (her 30 dakikada bir).
- `scripts/mobile-reauth.sh` - `claude setup-token` komutunu yeniden çalıştırır ve Termux'tan SSH üzerinden kullanılmak üzere telefonda açılacak URL'leri yazdırır.
- `scripts/termux-quick-auth.sh`, `scripts/termux-auth-widget.sh`, `scripts/termux-sync-widget.sh` - ana makineye SSH ile bağlanan, durum bildirimini gösteren ve kimlik doğrulamanın süresi dolduğunda yeniden kimlik doğrulama konsolunu/talimatlarını açan Termux:Widget betikleri.

## GitHub okuma yardımcısı

Yazma işlemleri için normal `gh` kişisel oturum açma bilgilerinizi kullanmaya devam ederken, depo kapsamlı okuma çağrılarında `gh` aracının bir GitHub App kurulum belirteci kullanmasını istediğinizde `scripts/gh-read` betiğini kullanın.

Gerekli ortam değişkenleri:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

İsteğe bağlı ortam değişkenleri:

- Depoya dayalı kurulum aramasını atlamak istediğinizde `OPENCLAW_GH_READ_INSTALLATION_ID`
- İstenecek okuma izni alt kümesini geçersiz kılmak için virgülle ayrılmış `OPENCLAW_GH_READ_PERMISSIONS`

Depo çözümleme sırası:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

Örnekler:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## Betik eklerken

- Betikleri odaklı ve belgelenmiş tutun.
- İlgili belgeye kısa bir girdi ekleyin (veya yoksa bir belge oluşturun).

## İlgili

- [Test](/tr/help/testing)
- [Canlı test](/tr/help/testing-live)
