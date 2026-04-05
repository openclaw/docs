---
read_when:
    - macOS Skills ayarları UI'si güncellenirken
    - skills geçitlemesi veya yükleme davranışı değiştirilirken
summary: macOS Skills ayarları UI'si ve gateway destekli durum
title: Skills (macOS)
x-i18n:
    generated_at: "2026-04-05T14:00:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ffd6744646d2c8770fa12a5e511f84a40b5ece67181139250ec4cc4301b49b8
    source_path: platforms/mac/skills.md
    workflow: 15
---

# Skills (macOS)

macOS uygulaması OpenClaw Skills'i gateway üzerinden sunar; skills'i yerel olarak ayrıştırmaz.

## Veri kaynağı

- `skills.status` (gateway), tüm skills'i uygunluk ve eksik gereksinimlerle birlikte döndürür
  (paketlenmiş skills için izin listesi engelleri dahil).
- Gereksinimler, her `SKILL.md` içindeki `metadata.openclaw.requires` alanından türetilir.

## Yükleme eylemleri

- `metadata.openclaw.install`, yükleme seçeneklerini tanımlar (brew/node/go/uv).
- Uygulama, yükleyicileri gateway host üzerinde çalıştırmak için `skills.install` çağrısı yapar.
- Yerleşik dangerous-code `critical` bulguları varsayılan olarak `skills.install` işlemini engeller; suspicious bulguları ise yalnızca uyarı vermeye devam eder. Dangerous override, gateway isteğinde mevcuttur, ancak varsayılan uygulama akışı güvenli varsayılanla kapalı kalır.
- Her yükleme seçeneği `download` ise gateway tüm indirme
  seçeneklerini sunar.
- Aksi takdirde gateway, geçerli yükleme tercihlerini ve host ikili dosyalarını kullanarak tercih edilen bir yükleyici seçer: `skills.install.preferBrew` etkinse ve `brew` mevcutsa önce Homebrew, ardından `uv`, sonra `skills.install.nodeManager` içindeki yapılandırılmış node yöneticisi, ardından `go` veya `download` gibi sonraki geri dönüş seçenekleri.
- Node yükleme etiketleri, `yarn` dahil olmak üzere yapılandırılmış node yöneticisini yansıtır.

## Ortam/API anahtarları

- Uygulama anahtarları `~/.openclaw/openclaw.json` içinde `skills.entries.<skillKey>` altında depolar.
- `skills.update`, `enabled`, `apiKey` ve `env` alanlarını yama olarak uygular.

## Uzak mod

- Yükleme + yapılandırma güncellemeleri yerel Mac'te değil, gateway host üzerinde gerçekleşir.
