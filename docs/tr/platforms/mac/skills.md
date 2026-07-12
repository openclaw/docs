---
read_when:
    - macOS Skills ayarları kullanıcı arayüzünü güncelleme
    - Skills erişim denetimini veya yükleme davranışını değiştirme
summary: macOS Skills ayarları kullanıcı arayüzü ve Gateway destekli durum
title: Skills (macOS)
x-i18n:
    generated_at: "2026-07-12T11:56:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd9d8f1190320889029335e008c3605bd4bf0194f83398cedd4ae658fd90065c
    source_path: platforms/mac/skills.md
    workflow: 16
---

macOS uygulaması, OpenClaw Skills'ı Gateway aracılığıyla sunar; Skills'ı yerel olarak ayrıştırmaz.

## Veri kaynağı

- `skills.status` (Gateway), paketle gelen Skills için izin listesi engelleri de dahil olmak üzere tüm Skills'ı, uygunluk durumlarını ve eksik gereksinimlerini döndürür.
- Gereksinimler, her `SKILL.md` dosyasındaki `metadata.openclaw.requires` alanından gelir.

## Kurulum işlemleri

- `metadata.openclaw.install`, kurulum seçeneklerini (brew/node/go/uv/download) tanımlar.
- Uygulama, kurucuları Gateway ana makinesinde çalıştırmak için `skills.install` çağrısını yapar.
- Operatörün yönettiği `security.installPolicy` (`enabled`, `targets`, `exec`), kurucu meta verileri işlenmeden önce Gateway destekli Skills kurulumlarını engelleyebilir. Yerleşik tehlikeli kod taraması (Plugin kurulumlarında kullanılır), Skills kurulum akışına bağlı değildir.
- Her kurulum seçeneği `download` ise Gateway tüm indirme seçeneklerini sunar.
- Aksi takdirde Gateway, geçerli kurulum tercihlerini (`skills.install.preferBrew`, `skills.install.nodeManager`) ve ana makinedeki ikili dosyaları kullanarak tercih edilen bir kurucu seçer: `preferBrew` etkinse ve `brew` mevcutsa önce Homebrew, ardından `uv`, sonra yapılandırılmış Node yöneticisi, daha sonra kullanılabiliyorsa (`preferBrew` olmasa bile) tekrar Homebrew, ardından `go` ve son olarak `download`.
- Node kurulum etiketleri, `yarn` dahil olmak üzere yapılandırılmış Node yöneticisini yansıtır.

## Ortam/API anahtarları

- Uygulama, anahtarları `~/.openclaw/openclaw.json` dosyasında `skills.entries.<skillKey>` altında saklar.
- `skills.update`; `enabled`, `apiKey` ve `env` alanlarına yama uygular.

## Uzak mod

- Kurulum ve yapılandırma güncellemeleri yerel Mac'te değil, Gateway ana makinesinde gerçekleşir.

## İlgili

- [Skills](/tr/tools/skills)
- [macOS uygulaması](/tr/platforms/macos)
