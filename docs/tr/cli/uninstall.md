---
read_when:
    - Gateway hizmetini ve/veya yerel durumu kaldırmak istiyorsunuz
    - Önce bir dry-run istiyorsunuz
summary: '`openclaw uninstall` için CLI başvurusu (gateway hizmetini + yerel verileri kaldırma)'
title: uninstall
x-i18n:
    generated_at: "2026-04-05T13:49:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2123a4f9c7a070ef7e13c60dafc189053ef61ce189fa4f29449dd50987c1894c
    source_path: cli/uninstall.md
    workflow: 15
---

# `openclaw uninstall`

Gateway hizmetini + yerel verileri kaldırın (CLI kalır).

Seçenekler:

- `--service`: gateway hizmetini kaldır
- `--state`: durumu ve yapılandırmayı kaldır
- `--workspace`: çalışma alanı dizinlerini kaldır
- `--app`: macOS uygulamasını kaldır
- `--all`: hizmeti, durumu, çalışma alanını ve uygulamayı kaldır
- `--yes`: onay istemlerini atla
- `--non-interactive`: istemleri devre dışı bırakır; `--yes` gerektirir
- `--dry-run`: dosyaları kaldırmadan eylemleri yazdırır

Örnekler:

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

Notlar:

- Durumu veya çalışma alanlarını kaldırmadan önce geri yüklenebilir bir anlık görüntü istiyorsanız önce `openclaw backup create` çalıştırın.
- `--all`, hizmeti, durumu, çalışma alanını ve uygulamayı birlikte kaldırmak için kısa yoldur.
- `--non-interactive`, `--yes` gerektirir.
