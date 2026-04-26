---
read_when:
    - Bir kaynak checkout'unu güvenli şekilde güncellemek istiyorsunuz.
    - '`--update` kısayol davranışını anlamanız gerekiyor.'
summary: '`openclaw update` için CLI başvurusu (nispeten güvenli kaynak güncellemesi + gateway otomatik yeniden başlatma)'
title: Güncelleme
x-i18n:
    generated_at: "2026-04-26T11:26:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: e86e7f8ffbf3f4ccd0787ba06aead35cb96e8db98c5d32c99b18ef9fda62efd6
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

OpenClaw'ı güvenli şekilde güncelleyin ve stable/beta/dev kanalları arasında geçiş yapın.

**npm/pnpm/bun** ile yüklediyseniz (genel kurulum, git meta verisi yok),
güncellemeler [Güncelleme](/tr/install/updating) içindeki paket yöneticisi akışıyla yapılır.

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

- `--no-restart`: başarılı bir güncellemeden sonra Gateway hizmetini yeniden başlatmayı atla. Gateway'i yeniden başlatan paket yöneticisi güncellemeleri, komut başarılı olmadan önce yeniden başlatılan hizmetin beklenen güncellenmiş sürümü bildirdiğini doğrular.
- `--channel <stable|beta|dev>`: güncelleme kanalını ayarla (git + npm; yapılandırmada kalıcı olur).
- `--tag <dist-tag|version|spec>`: yalnızca bu güncelleme için paket hedefini geçersiz kıl. Paket kurulumları için `main`, `github:openclaw/openclaw#main` eşlemesine karşılık gelir.
- `--dry-run`: yapılandırma yazmadan, kurulum yapmadan, Plugin senkronizasyonu yapmadan veya yeniden başlatmadan planlanan güncelleme eylemlerini (kanal/etiket/hedef/yeniden başlatma akışı) önizle.
- `--json`: makine tarafından okunabilir `UpdateRunResult` JSON çıktısı yazdırır; buna, npm Plugin artifact sapması güncelleme sonrası Plugin senkronizasyonu sırasında algılandığında `postUpdate.plugins.integrityDrifts` de dahildir.
- `--timeout <seconds>`: adım başına zaman aşımı (varsayılan 1800 sn).
- `--yes`: onay istemlerini atla (örneğin daha eski sürüme dönme onayı)

Not: Daha eski sürüme dönmeler onay gerektirir çünkü eski sürümler yapılandırmayı bozabilir.

## `update status`

Etkin güncelleme kanalını + git etiketi/dalı/SHA'sını (kaynak checkout'ları için) ve ayrıca güncelleme kullanılabilirliğini göster.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Seçenekler:

- `--json`: makine tarafından okunabilir durum JSON çıktısı yazdır.
- `--timeout <seconds>`: denetimler için zaman aşımı (varsayılan 3 sn).

## `update wizard`

Bir güncelleme kanalı seçmek ve güncellemeden sonra Gateway'in yeniden başlatılıp başlatılmayacağını onaylamak için etkileşimli akış
(varsayılan yeniden başlatmaktır). Git checkout olmadan `dev` seçerseniz, bir tane oluşturmayı önerir.

Seçenekler:

- `--timeout <seconds>`: her güncelleme adımı için zaman aşımı (varsayılan `1800`)

## Ne yapar

Bir kanalı açıkça değiştirdiğinizde (`--channel ...`), OpenClaw kurulum yöntemini de uyumlu tutar:

- `dev` → bir git checkout bulunduğundan emin olur (varsayılan: `~/openclaw`, `OPENCLAW_GIT_DIR` ile geçersiz kılınabilir),
  bunu günceller ve bu checkout'tan genel CLI'yi kurar.
- `stable` → npm'den `latest` kullanarak kurar.
- `beta` → npm dist-tag `beta`'yı tercih eder, ancak beta eksikse veya mevcut stable sürümden eskiyse `latest`'e geri döner.

Gateway çekirdek otomatik güncelleyicisi (yapılandırma üzerinden etkinleştirildiğinde) aynı güncelleme yolunu yeniden kullanır.

Paket yöneticisi kurulumları için `openclaw update`, paket yöneticisini çağırmadan önce
hedef paket sürümünü çözümler. Kurulu sürüm zaten hedefle eşleşse bile,
komut genel paket kurulumunu yeniler, ardından Plugin senkronizasyonu, completion yenileme ve yeniden başlatma işlerini çalıştırır. Bu, paketlenmiş
sidecar'ların ve kanalın sahip olduğu Plugin kayıtlarının kurulu OpenClaw
derlemesiyle uyumlu kalmasını sağlar.

## Git checkout akışı

Kanallar:

- `stable`: en son beta olmayan etiketi checkout eder, sonra derler + doctor çalıştırır.
- `beta`: en son `-beta` etiketini tercih eder, ancak beta eksikse veya daha eskiyse
  en son stable etikete geri döner.
- `dev`: `main` dalını checkout eder, sonra fetch + rebase yapar.

Yüksek seviye:

1. Temiz bir worktree gerektirir (commit edilmemiş değişiklik yok).
2. Seçilen kanala (etiket veya dal) geçer.
3. Upstream'den fetch yapar (yalnızca dev).
4. Yalnızca dev: geçici bir worktree içinde ön denetim lint + TypeScript derlemesi yapar; uç commit başarısızsa, en yeni temiz derlemeyi bulmak için en fazla 10 commit geri gider.
5. Seçilen commit üzerine rebase yapar (yalnızca dev).
6. Repo paket yöneticisiyle bağımlılıkları kurar. pnpm checkout'ları için güncelleyici, pnpm workspace içinde `npm run build` çalıştırmak yerine `pnpm`'i gerektiğinde başlatır (`corepack` önce, ardından geçici `npm install pnpm@10` geri dönüşü).
7. Derler + Control UI'yi derler.
8. Son “güvenli güncelleme” denetimi olarak `openclaw doctor` çalıştırır.
9. Plugin'leri etkin kanalla senkronize eder (dev paketlenmiş Plugin'leri kullanır; stable/beta npm kullanır) ve npm ile kurulan Plugin'leri günceller.

Tam olarak sabitlenmiş bir npm Plugin güncellemesi, bütünlüğü saklanan kurulum kaydından farklı olan bir artifact'e çözümlenirse,
`openclaw update` bu Plugin artifact güncellemesini kurmak yerine iptal eder. Yeni artifact'e güvendiğinizi doğruladıktan sonra Plugin'i yalnızca açıkça yeniden kurun veya güncelleyin.

Güncelleme sonrası Plugin senkronizasyonu hataları, güncelleme sonucunu başarısız yapar ve yeniden başlatma sonrası işleri durdurur. Plugin kurma/güncelleme hatasını düzeltin, sonra
`openclaw update` komutunu yeniden çalıştırın.

pnpm bootstrap hâlâ başarısız olursa, güncelleyici artık checkout içinde `npm run build` denemek yerine paket yöneticisine özgü bir hatayla erkenden durur.

## `--update` kısayolu

`openclaw --update`, `openclaw update` olarak yeniden yazılır (shell'ler ve başlatıcı betikleri için kullanışlıdır).

## İlgili

- `openclaw doctor` (git checkout'larında önce güncellemeyi çalıştırmayı önerir)
- [Geliştirme kanalları](/tr/install/development-channels)
- [Güncelleme](/tr/install/updating)
- [CLI başvurusu](/tr/cli)
