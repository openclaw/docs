---
read_when:
    - macOS Skills ayarları UI'sini güncelleme
    - Skills kapılarını veya kurulum davranışını değiştirme
summary: macOS Skills ayarları UI'si ve gateway destekli durum
title: Skills (macOS)
x-i18n:
    generated_at: "2026-04-24T09:20:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: dcd89d27220644866060d0f9954a116e6093d22f7ebd32d09dc16871c25b988e
    source_path: platforms/mac/skills.md
    workflow: 15
---

macOS uygulaması OpenClaw Skills'i gateway üzerinden gösterir; Skills'i yerelde ayrıştırmaz.

## Veri kaynağı

- `skills.status` (gateway), tüm Skills'i uygunluk ve eksik gereksinimlerle birlikte döndürür
  (paketle gelen Skills için izin listesi engelleri dahil).
- Gereksinimler, her `SKILL.md` içindeki `metadata.openclaw.requires` alanından türetilir.

## Kurulum eylemleri

- `metadata.openclaw.install`, kurulum seçeneklerini tanımlar (brew/node/go/uv).
- Uygulama, kurucuları gateway host üzerinde çalıştırmak için `skills.install` çağırır.
- Yerleşik tehlikeli kod `critical` bulguları, varsayılan olarak `skills.install` işlemini engeller; şüpheli bulgular ise yalnızca uyarı verir. Tehlikeli geçersiz kılma gateway isteğinde bulunur, ancak varsayılan uygulama akışı kapalı varsayımla kalır.
- Her kurulum seçeneği `download` ise gateway, tüm indirme
  seçeneklerini gösterir.
- Aksi halde gateway, geçerli kurulum tercihleri ve host binary'lerini kullanarak bir tercihli
  kurucu seçer: `skills.install.preferBrew` etkinse ve `brew` mevcutsa önce Homebrew,
  sonra `uv`, sonra `skills.install.nodeManager` içindeki yapılandırılmış
  Node yöneticisi, ardından `go` veya `download` gibi
  daha sonraki geri dönüşler.
- Node kurulum etiketleri, `yarn` dahil yapılandırılmış Node yöneticisini yansıtır.

## Env/API anahtarları

- Uygulama, anahtarları `~/.openclaw/openclaw.json` içinde `skills.entries.<skillKey>` altında saklar.
- `skills.update`, `enabled`, `apiKey` ve `env` alanlarını yamalar.

## Uzak mod

- Kurulum + yapılandırma güncellemeleri yerel Mac üzerinde değil, gateway host üzerinde gerçekleşir.

## İlgili

- [Skills](/tr/tools/skills)
- [macOS uygulaması](/tr/platforms/macos)
