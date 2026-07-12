---
read_when:
    - Gateway hizmetini ve/veya yerel durumu kaldırmak istiyorsunuz
    - Önce bir deneme çalıştırması yapmak istiyorsunuz
summary: '`openclaw uninstall` için CLI başvurusu (Gateway hizmetini + yerel verileri kaldırma)'
title: Kaldırma
x-i18n:
    generated_at: "2026-07-12T12:13:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1e2e3996cf6d5c0fd11e5054c8fe60f7f8d25047193bb13944ca170bf77b581a
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Gateway hizmetini ve/veya yerel verileri kaldırın. CLI'nin kendisi
kaldırılmaz; onu npm/pnpm aracılığıyla ayrı olarak kaldırın.

## Seçenekler

| Bayrak              | Varsayılan | Açıklama                                             |
| ------------------- | ---------- | ---------------------------------------------------- |
| `--service`         | `false`    | Gateway hizmetini kaldırır.                          |
| `--state`           | `false`    | Durumu ve yapılandırmayı kaldırır.                    |
| `--workspace`       | `false`    | Çalışma alanı dizinlerini kaldırır.                   |
| `--app`             | `false`    | macOS uygulamasını kaldırır.                          |
| `--all`             | `false`    | `--service --state --workspace --app` için kısayol.  |
| `--yes`             | `false`    | Onay istemlerini atlar.                               |
| `--non-interactive` | `false`    | İstemleri devre dışı bırakır; `--yes` gerektirir.     |
| `--dry-run`         | `false`    | Dosyaları kaldırmadan planlanan işlemleri yazdırır.   |

Kapsam bayrağı belirtilmezse etkileşimli bir çoklu seçim istemi, kaldırılacak
bileşenleri sorar (hizmet, durum ve çalışma alanı varsayılan olarak önceden seçilidir).

## Örnekler

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

## Notlar

- Durumu veya çalışma alanlarını kaldırmadan önce geri yüklenebilir bir anlık
  görüntü oluşturmak için ilk olarak `openclaw backup create` komutunu çalıştırın.
- `--workspace` seçeneği de seçilmediği sürece `--state`, yapılandırılmış çalışma
  alanı dizinlerini korur.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Kaldırma](/tr/install/uninstall)
