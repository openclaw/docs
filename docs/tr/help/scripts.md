---
read_when:
    - Depodaki betikleri çalıştırırken
    - '`./scripts` altına betik eklerken veya değiştirirken'
summary: 'Depo betikleri: amaç, kapsam ve güvenlik notları'
title: Betikler
x-i18n:
    generated_at: "2026-04-05T13:55:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: de53d64d91c564931bdd4e8b9f4a8e88646332a07cc2a6bf1d517b89debb29cd
    source_path: help/scripts.md
    workflow: 15
---

# Betikler

`scripts/` dizini yerel iş akışları ve operasyon görevleri için yardımcı betikler içerir.
Görev açıkça bir betiğe bağlıysa bunları kullanın; aksi halde CLI'yi tercih edin.

## Kurallar

- Dokümanlarda veya sürüm kontrol listelerinde referans verilmediği sürece betikler **isteğe bağlıdır**.
- Mevcut olduklarında CLI yüzeylerini tercih edin (örnek: auth izleme `openclaw models status --check` kullanır).
- Betiklerin ana makineye özgü olduğunu varsayın; yeni bir makinede çalıştırmadan önce okuyun.

## Auth izleme betikleri

Auth izleme [Kimlik Doğrulama](/gateway/authentication) içinde ele alınır. `scripts/` altındaki betikler systemd/Termux telefon iş akışları için isteğe bağlı eklerdir.

## Betik eklerken

- Betikleri odaklı ve belgelenmiş tutun.
- İlgili dokümana kısa bir girdi ekleyin (veya eksikse oluşturun).
