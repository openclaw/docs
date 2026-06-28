---
read_when:
    - macOS Skills ayarları kullanıcı arayüzü güncelleniyor
    - Skills geçiş denetimini veya yükleme davranışını değiştirme
summary: macOS Skills ayarları kullanıcı arayüzü ve Gateway destekli durum
title: Skills (macOS)
x-i18n:
    generated_at: "2026-06-28T00:49:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ecc470f1645051e03ab4f51bcb4972da4853c690354bc8ea18a89fcd387d413
    source_path: platforms/mac/skills.md
    workflow: 16
---

macOS uygulaması OpenClaw Skills öğelerini Gateway üzerinden gösterir; Skills öğelerini yerelde ayrıştırmaz.

## Veri kaynağı

- `skills.status` (Gateway), tüm Skills öğelerini uygunluk ve eksik gereksinimlerle birlikte döndürür
  (paketlenmiş Skills öğeleri için izin listesi engelleri dahil).
- Gereksinimler, her `SKILL.md` içindeki `metadata.openclaw.requires` alanından türetilir.

## Kurulum eylemleri

- `metadata.openclaw.install`, kurulum seçeneklerini (brew/node/go/uv) tanımlar.
- Uygulama, kurulum araçlarını Gateway ana makinesinde çalıştırmak için `skills.install` çağırır.
- Operatörün sahip olduğu `security.installPolicy`, kurulum aracı meta verileri çalışmadan önce Gateway destekli skill
  kurulumlarını engelleyebilir. Kurulum zamanındaki yerleşik tehlikeli kod
  engelleme, skill kurulum akışının parçası değildir.
- Her kurulum seçeneği `download` ise Gateway tüm indirme
  seçeneklerini gösterir.
- Aksi halde Gateway, mevcut kurulum tercihlerini ve ana makine ikililerini kullanarak
  tercih edilen tek bir kurulum aracı seçer: `skills.install.preferBrew` etkinleştirildiğinde ve `brew` mevcut olduğunda önce Homebrew, ardından `uv`, ardından
  `skills.install.nodeManager` içinden yapılandırılmış node yöneticisi, ardından daha sonraki
  `go` veya `download` gibi yedekler.
- Node kurulum etiketleri, `yarn` dahil yapılandırılmış node yöneticisini yansıtır.

## Env/API anahtarları

- Uygulama anahtarları `~/.openclaw/openclaw.json` içinde `skills.entries.<skillKey>` altında saklar.
- `skills.update`, `enabled`, `apiKey` ve `env` alanlarına yama uygular.

## Uzak mod

- Kurulum ve yapılandırma güncellemeleri Gateway ana makinesinde gerçekleşir (yerel Mac üzerinde değil).

## İlgili

- [Skills](/tr/tools/skills)
- [macOS uygulaması](/tr/platforms/macos)
