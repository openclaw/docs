---
read_when:
    - Bir kaynak checkout'unu güvenli şekilde güncellemek istiyorsunuz
    - '`--update` kısa yol davranışını anlamanız gerekiyor'
summary: '`openclaw update` için CLI başvurusu (nispeten güvenli kaynak güncellemesi + Gateway otomatik yeniden başlatma)'
title: update
x-i18n:
    generated_at: "2026-04-05T13:49:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12c8098654b644c3666981d379f6c018e84fde56a5420f295d78052f9001bdad
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

OpenClaw'ı güvenli şekilde güncelleyin ve stable/beta/dev kanalları arasında geçiş yapın.

**npm/pnpm/bun** ile yüklediyseniz (genel kurulum, git meta verisi yok),
güncellemeler [Güncelleme](/install/updating) içindeki paket yöneticisi akışı üzerinden yapılır.

## Kullanım

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## Seçenekler

- `--no-restart`: Başarılı bir güncellemeden sonra Gateway hizmetini yeniden başlatmayı atla.
- `--channel <stable|beta|dev>`: Güncelleme kanalını ayarla (git + npm; config içinde kalıcıdır).
- `--tag <dist-tag|version|spec>`: Yalnızca bu güncelleme için paket hedefini geçersiz kıl. Paket kurulumlarında `main`, `github:openclaw/openclaw#main` eşlemesine sahiptir.
- `--dry-run`: Config yazmadan, yükleme yapmadan, plugin'leri eşitlemeden veya yeniden başlatmadan planlanan güncelleme eylemlerini (kanal/etiket/hedef/yeniden başlatma akışı) önizle.
- `--json`: Makine tarafından okunabilir `UpdateRunResult` JSON çıktısı yazdır.
- `--timeout <seconds>`: Adım başına zaman aşımı (varsayılan 1200 sn).
- `--yes`: Onay istemlerini atla (örneğin sürüm düşürme onayı)

Not: Sürüm düşürmeler onay gerektirir çünkü eski sürümler yapılandırmayı bozabilir.

## `update status`

Etkin güncelleme kanalını + git etiketini/dalını/SHA'sını (kaynak checkout'ları için) ve ayrıca güncelleme kullanılabilirliğini gösterir.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Seçenekler:

- `--json`: Makine tarafından okunabilir durum JSON çıktısı yazdır.
- `--timeout <seconds>`: Denetimler için zaman aşımı (varsayılan 3 sn).

## `update wizard`

Bir güncelleme kanalı seçmek ve güncellemeden sonra Gateway'in yeniden başlatılıp başlatılmayacağını onaylamak için etkileşimli akış
(varsayılan olarak yeniden başlatılır). Git checkout olmadan `dev` seçerseniz,
bir tane oluşturmayı önerir.

Seçenekler:

- `--timeout <seconds>`: Her güncelleme adımı için zaman aşımı (varsayılan `1200`)

## Ne yapar

Kanalı açıkça değiştirdiğinizde (`--channel ...`), OpenClaw kurulum yöntemini de
uyumlu tutar:

- `dev` → bir git checkout'unun var olmasını sağlar (varsayılan: `~/openclaw`, `OPENCLAW_GIT_DIR` ile geçersiz kılınabilir),
  onu günceller ve genel CLI'yi o checkout'tan yükler.
- `stable` → npm'den `latest` kullanarak yükler.
- `beta` → npm dist-tag `beta`yı tercih eder, ancak beta yoksa veya mevcut stable sürümden daha eskiyse `latest`e geri döner.

Gateway çekirdek otomatik güncelleyicisi (config üzerinden etkinleştirildiğinde) aynı güncelleme yolunu yeniden kullanır.

## Git checkout akışı

Kanallar:

- `stable`: en son beta olmayan etiketi checkout yapar, ardından build + doctor çalıştırır.
- `beta`: en son `-beta` etiketini tercih eder, ancak beta yoksa veya daha eskiyse en son stable etikete geri döner.
- `dev`: `main` dalını checkout yapar, ardından fetch + rebase yapar.

Üst düzey akış:

1. Temiz bir worktree gerektirir (commit edilmemiş değişiklik olmamalı).
2. Seçilen kanala geçer (etiket veya dal).
3. Upstream'i fetch eder (yalnızca dev).
4. Yalnızca dev: geçici bir worktree'de ön denetim lint + TypeScript build çalıştırır; uç nokta başarısız olursa, en yeni temiz build'i bulmak için en fazla 10 commit geri gider.
5. Seçilen commit üzerine rebase yapar (yalnızca dev).
6. Bağımlılıkları yükler (`pnpm` tercih edilir; `npm` geri dönüş seçeneğidir; `bun` ikincil uyumluluk geri dönüşü olarak kullanılabilir).
7. Build + Control UI build çalıştırır.
8. Son “güvenli güncelleme” denetimi olarak `openclaw doctor` çalıştırır.
9. Plugin'leri etkin kanalla eşitler (dev, bundled extension'ları kullanır; stable/beta npm kullanır) ve npm ile yüklenen plugin'leri günceller.

## `--update` kısa yolu

`openclaw --update`, `openclaw update` olarak yeniden yazılır (kabuklar ve başlatıcı betikleri için kullanışlıdır).

## Ayrıca bkz.

- `openclaw doctor` (git checkout'larında önce update çalıştırmayı önerir)
- [Geliştirme kanalları](/install/development-channels)
- [Güncelleme](/install/updating)
- [CLI başvurusu](/cli)
