---
read_when:
    - Gateway hizmetini ve/veya yerel durumu kaldırmak istiyorsunuz
    - Önce bir deneme çalıştırması istiyorsunuz
summary: '`openclaw uninstall` için CLI başvurusu (gateway hizmetini + yerel verileri kaldır)'
title: Kaldır
x-i18n:
    generated_at: "2026-06-28T00:25:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f90fa8cf513e2e8cd422c3b8a880e7fd20fb71131a3ec88260e765daa2ace543
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Gateway hizmetini + yerel verileri kaldırın (CLI kalır).

Seçenekler:

- `--service`: Gateway hizmetini kaldırır
- `--state`: durum ve yapılandırmayı kaldırır
- `--workspace`: çalışma alanı dizinlerini kaldırır
- `--app`: macOS uygulamasını kaldırır
- `--all`: hizmeti, durumu, çalışma alanını ve uygulamayı kaldırır
- `--yes`: onay istemlerini atlar
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
- `--state`, `--workspace` de seçilmediği sürece yapılandırılmış çalışma alanı dizinlerini korur.
- `--all`, hizmeti, durumu, çalışma alanını ve uygulamayı birlikte kaldırmanın kısaltmasıdır.
- `--non-interactive`, `--yes` gerektirir.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Kaldırma](/tr/install/uninstall)
