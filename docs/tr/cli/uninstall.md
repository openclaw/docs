---
read_when:
    - Gateway hizmetini ve/veya yerel durumu kaldırmak istiyorsunuz
    - Önce bir dry-run istiyorsunuz
summary: '`openclaw uninstall` için CLI başvurusu (Gateway hizmetini + yerel verileri kaldırma)'
title: Kaldırma
x-i18n:
    generated_at: "2026-04-24T09:04:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: b774fc006e989068b9126aff2a72888fd808a2e0e3d5ea8b57e6ab9d9f1b63ee
    source_path: cli/uninstall.md
    workflow: 15
---

# `openclaw uninstall`

Gateway hizmetini + yerel verileri kaldırın (CLI kalır).

Seçenekler:

- `--service`: Gateway hizmetini kaldır
- `--state`: durumu ve yapılandırmayı kaldır
- `--workspace`: çalışma alanı dizinlerini kaldır
- `--app`: macOS uygulamasını kaldır
- `--all`: hizmeti, durumu, çalışma alanını ve uygulamayı kaldır
- `--yes`: onay istemlerini atla
- `--non-interactive`: istemleri devre dışı bırakır; `--yes` gerektirir
- `--dry-run`: dosyaları kaldırmadan eylemleri yazdır

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
- `--all`, hizmeti, durumu, çalışma alanını ve uygulamayı birlikte kaldırmanın kısa yoludur.
- `--non-interactive`, `--yes` gerektirir.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Kaldırma](/tr/install/uninstall)
