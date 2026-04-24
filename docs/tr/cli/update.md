---
read_when:
    - Bir kaynak checkout'u güvenli şekilde güncellemek istiyorsunuz
    - '`--update` kısayol davranışını anlamanız gerekiyor'
summary: '`openclaw update` için CLI başvurusu (nispeten güvenli kaynak güncellemesi + Gateway otomatik yeniden başlatma)'
title: Güncelleme
x-i18n:
    generated_at: "2026-04-24T09:04:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: c7ab28ae6fe91c094826ccbd9fa11c5d7c41849cc95d570a634a0721b82f0e3a
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

OpenClaw'ı güvenli şekilde güncelleyin ve stable/beta/dev kanalları arasında geçiş yapın.

Kurulumu **npm/pnpm/bun** ile yaptıysanız (global kurulum, git meta verisi yok),
güncellemeler [Updating](/tr/install/updating) içindeki paket yöneticisi akışıyla yapılır.

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

- `--no-restart`: başarılı bir güncellemeden sonra Gateway hizmetini yeniden başlatmayı atla.
- `--channel <stable|beta|dev>`: güncelleme kanalını ayarla (git + npm; config içinde kalıcılaştırılır).
- `--tag <dist-tag|version|spec>`: yalnızca bu güncelleme için paket hedefini geçersiz kıl. Paket kurulumlarında `main`, `github:openclaw/openclaw#main` olarak eşlenir.
- `--dry-run`: config yazmadan, kurulum yapmadan, Plugin'leri senkronize etmeden veya yeniden başlatmadan önce planlanan güncelleme eylemlerini (kanal/tag/hedef/yeniden başlatma akışı) önizle.
- `--json`: makine tarafından okunabilir `UpdateRunResult` JSON çıktısı verir; buna
  güncelleme sonrası Plugin senkronizasyonu sırasında npm Plugin yapıt kayması
  algılandığında `postUpdate.plugins.integrityDrifts` da dahildir.
- `--timeout <seconds>`: adım başına zaman aşımı (varsayılan `1200s`).
- `--yes`: onay istemlerini atla (örneğin sürüm düşürme onayı)

Not: sürüm düşürmeler onay gerektirir çünkü eski sürümler yapılandırmayı bozabilir.

## `update status`

Etkin güncelleme kanalını + git etiketi/dalı/SHA'sını (kaynak checkout'ları için) ve güncelleme kullanılabilirliğini gösterir.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Seçenekler:

- `--json`: makine tarafından okunabilir durum JSON çıktısı verir.
- `--timeout <seconds>`: kontroller için zaman aşımı (varsayılan `3s`).

## `update wizard`

Bir güncelleme kanalı seçmek ve güncellemeden sonra Gateway'in
yeniden başlatılıp başlatılmayacağını onaylamak için etkileşimli akış
(varsayılan davranış yeniden başlatmaktır). Git checkout olmadan `dev` seçerseniz,
bir tane oluşturmayı önerir.

Seçenekler:

- `--timeout <seconds>`: her güncelleme adımı için zaman aşımı (varsayılan `1200`)

## Ne yapar

Kanalları açıkça değiştirdiğinizde (`--channel ...`), OpenClaw ayrıca
kurulum yöntemini de hizalı tutar:

- `dev` → bir git checkout bulunduğundan emin olur (varsayılan: `~/openclaw`, `OPENCLAW_GIT_DIR` ile geçersiz kılınır),
  bunu günceller ve global CLI'ı bu checkout'tan kurar.
- `stable` → npm'den `latest` kullanarak kurar.
- `beta` → npm dist-tag `beta` değerini tercih eder, ancak beta
  eksikse veya geçerli stable sürümden daha eskiyse `latest` değerine fallback yapar.

Gateway çekirdeği otomatik güncelleyicisi (config ile etkinleştirildiğinde) aynı güncelleme yolunu yeniden kullanır.

Paket yöneticisi kurulumlarında `openclaw update`, paket yöneticisini çağırmadan önce hedef paket
sürümünü çözümler. Kurulu sürüm hedefle tam olarak
eşleşiyorsa ve kalıcılaştırılması gereken bir güncelleme kanalı değişikliği yoksa,
komut paket kurulumu, Plugin senkronizasyonu, tamamlama yenileme
veya gateway yeniden başlatma işleri yapılmadan önce atlandı olarak çıkar.

## Git checkout akışı

Kanallar:

- `stable`: en son beta olmayan etiketi checkout yapar, sonra derler + doctor çalıştırır.
- `beta`: en son `-beta` etiketini tercih eder, ancak beta eksikse veya daha eskiyse
  en son stable etikete fallback yapar.
- `dev`: `main` checkout yapar, sonra fetch + rebase yapar.

Üst düzey:

1. Temiz bir worktree gerektirir (commit edilmemiş değişiklik yok).
2. Seçilen kanala geçer (etiket veya dal).
3. Upstream'den fetch yapar (yalnızca dev).
4. Yalnızca dev: geçici bir worktree içinde ön uçuş lint + TypeScript derlemesi yapar; uç nokta başarısız olursa, en yeni temiz derlemeyi bulmak için en fazla 10 commit geri gider.
5. Seçilen commit üzerine rebase yapar (yalnızca dev).
6. Repo paket yöneticisi ile bağımlılıkları kurar. pnpm checkout'ları için güncelleyici, bir pnpm çalışma alanı içinde `npm run build` çalıştırmak yerine `pnpm`'i gerektiğinde önyükler (`corepack` önce, sonra geçici `npm install pnpm@10` fallback'i).
7. Derler + Control UI'ı derler.
8. Son “güvenli güncelleme” denetimi olarak `openclaw doctor` çalıştırır.
9. Plugin'leri etkin kanala senkronize eder (dev paketlenmiş Plugin'leri kullanır; stable/beta npm kullanır) ve npm ile kurulu Plugin'leri günceller.

Tam olarak sabitlenmiş bir npm Plugin güncellemesi, bütünlüğü saklanan kurulum kaydından
farklı olan bir yapıta çözülürse, `openclaw update` bu Plugin
yapıt güncellemesini kurmak yerine iptal eder. Yeni yapıta güvendiğinizi doğruladıktan sonra
Plugin'i yalnızca açıkça yeniden kurun veya güncelleyin.

pnpm önyükleme yine de başarısız olursa, güncelleyici artık checkout içinde `npm run build` denemek yerine paket yöneticisine özgü bir hatayla erken durur.

## `--update` kısayolu

`openclaw --update`, `openclaw update` olarak yeniden yazılır (kabuklar ve başlatıcı betikler için kullanışlıdır).

## İlgili

- `openclaw doctor` (git checkout'larında önce update çalıştırmayı önerir)
- [Development channels](/tr/install/development-channels)
- [Updating](/tr/install/updating)
- [CLI reference](/tr/cli)
