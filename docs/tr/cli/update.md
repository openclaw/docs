---
read_when:
    - Bir kaynak çalışma kopyasını güvenli şekilde güncellemek istiyorsunuz
    - '`--update` kısaltma davranışını anlamanız gerekir'
summary: '`openclaw update` için CLI referansı (görece güvenli kaynak güncellemesi + Gateway otomatik yeniden başlatma)'
title: Güncelleme
x-i18n:
    generated_at: "2026-04-30T09:14:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cd4be6be8f6ae7df501f8bce3d208dd507ae5a1539f9772101cd844dcd93976
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw’ı güvenle güncelleyin ve stable/beta/dev kanalları arasında geçiş yapın.

**npm/pnpm/bun** ile yüklediyseniz (global yükleme, git metadatası yok),
güncellemeler [Updating](/tr/install/updating) içindeki paket yöneticisi akışı üzerinden gerçekleşir.

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

- `--no-restart`: başarılı bir güncellemeden sonra Gateway hizmetini yeniden başlatmayı atlar. Gateway’i yeniden başlatan paket yöneticisi güncellemeleri, komut başarılı olmadan önce yeniden başlatılan hizmetin beklenen güncellenmiş sürümü bildirdiğini doğrular.
- `--channel <stable|beta|dev>`: güncelleme kanalını ayarlar (git + npm; yapılandırmada kalıcı olur).
- `--tag <dist-tag|version|spec>`: paket hedefini yalnızca bu güncelleme için geçersiz kılar. Paket yüklemeleri için `main`, `github:openclaw/openclaw#main` değerine eşlenir.
- `--dry-run`: yapılandırma yazmadan, yükleme yapmadan, Plugin’leri senkronize etmeden veya yeniden başlatmadan planlanan güncelleme eylemlerini (kanal/etiket/hedef/yeniden başlatma akışı) önizler.
- `--json`: güncelleme sonrası Plugin senkronizasyonu sırasında npm Plugin yapıtı kayması algılandığında
  `postUpdate.plugins.integrityDrifts` dahil olmak üzere makine tarafından okunabilir
  `UpdateRunResult` JSON çıktısı yazdırır.
- `--timeout <seconds>`: adım başına zaman aşımı (varsayılan 1800 sn).
- `--yes`: onay istemlerini atlar (örneğin sürüm düşürme onayı).

<Warning>
Sürüm düşürmeler onay gerektirir çünkü eski sürümler yapılandırmayı bozabilir.
</Warning>

## `update status`

Etkin güncelleme kanalını + git etiketini/dalını/SHA değerini (kaynak checkout’lar için) ve güncelleme kullanılabilirliğini gösterir.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Seçenekler:

- `--json`: makine tarafından okunabilir durum JSON çıktısı yazdırır.
- `--timeout <seconds>`: kontroller için zaman aşımı (varsayılan 3 sn).

## `update wizard`

Bir güncelleme kanalı seçmek ve güncellemeden sonra Gateway’in yeniden başlatılıp başlatılmayacağını
onaylamak için etkileşimli akış (varsayılan yeniden başlatmaktır). Git checkout olmadan `dev` seçerseniz,
bir tane oluşturmayı teklif eder.

Seçenekler:

- `--timeout <seconds>`: her güncelleme adımı için zaman aşımı (varsayılan `1800`)

## Ne yapar

Kanalları açıkça değiştirdiğinizde (`--channel ...`), OpenClaw yükleme yöntemini de
uyumlu tutar:

- `dev` → bir git checkout olmasını sağlar (varsayılan: `~/openclaw`, `OPENCLAW_GIT_DIR` ile geçersiz kılınır),
  bunu günceller ve global CLI’ı bu checkout’tan yükler.
- `stable` → `latest` kullanarak npm’den yükler.
- `beta` → npm dist-tag `beta` değerini tercih eder, ancak beta eksikse veya mevcut stable sürümden
  daha eskiyse `latest` değerine geri döner.

Gateway çekirdek otomatik güncelleyicisi (yapılandırma üzerinden etkinleştirildiğinde) aynı güncelleme yolunu yeniden kullanır.

Paket yöneticisi yüklemelerinde `openclaw update`, paket yöneticisini çağırmadan önce hedef paket
sürümünü çözümler. npm global yüklemeleri aşamalı yükleme kullanır: OpenClaw yeni paketi geçici bir npm prefix içine yükler, paketlenmiş `dist` envanterini orada doğrular, ardından bu temiz paket ağacını gerçek global prefix içine değiştirir. Doğrulama başarısız olursa, güncelleme sonrası doctor, Plugin senkronizasyonu ve yeniden başlatma işi şüpheli ağaçtan çalıştırılmaz. Yüklü sürüm hedefle zaten eşleşse bile komut global paket yüklemesini yeniler, ardından Plugin senkronizasyonu, çekirdek komut tamamlama yenilemesi ve yeniden başlatma işi çalıştırır. Bu, tam Plugin komut tamamlama yeniden derlemelerini açık `openclaw completion --write-state` çalıştırmalarına bırakırken paketlenmiş yardımcı bileşenleri ve kanala ait Plugin kayıtlarını yüklü OpenClaw derlemesiyle uyumlu tutar.

Yerel yönetilen bir Gateway hizmeti yüklü olduğunda ve yeniden başlatma etkin olduğunda,
paket yöneticisi güncellemeleri paket ağacını değiştirmeden önce çalışan hizmeti durdurur, ardından hizmet metadatasını güncellenmiş yüklemeden yeniler, hizmeti yeniden başlatır ve yeniden başlatılan Gateway’in beklenen sürümü bildirdiğini doğrular. `--no-restart` ile paket değiştirme yine çalışır ancak yönetilen hizmet durdurulmaz veya yeniden başlatılmaz; bu nedenle çalışan Gateway siz manuel olarak yeniden başlatana kadar eski kodu kullanmaya devam edebilir.

## Git checkout akışı

### Kanal seçimi

- `stable`: en son beta olmayan etiketi checkout yapar, ardından derler ve doctor çalıştırır.
- `beta`: en son `-beta` etiketini tercih eder, ancak beta eksikse veya daha eskiyse en son stable etikete geri döner.
- `dev`: `main` checkout yapar, ardından fetch ve rebase yapar.

### Güncelleme adımları

<Steps>
  <Step title="Temiz worktree doğrula">
    Commit edilmemiş değişiklik olmamasını gerektirir.
  </Step>
  <Step title="Kanal değiştir">
    Seçilen kanala (etiket veya dal) geçer.
  </Step>
  <Step title="Upstream fetch et">
    Yalnızca dev.
  </Step>
  <Step title="Ön kontrol derlemesi (yalnızca dev)">
    Geçici bir worktree içinde lint ve TypeScript derlemesi çalıştırır. Uç başarısız olursa, en yeni temiz derlemeyi bulmak için 10 commit’e kadar geriye gider.
  </Step>
  <Step title="Rebase">
    Seçilen commit üzerine rebase yapar (yalnızca dev).
  </Step>
  <Step title="Bağımlılıkları yükle">
    Repo paket yöneticisini kullanır. pnpm checkout’ları için güncelleyici, pnpm workspace içinde `npm run build` çalıştırmak yerine gerektiğinde `pnpm`’i bootstrap eder (önce `corepack` üzerinden, ardından geçici `npm install pnpm@10` geri dönüşüyle).
  </Step>
  <Step title="Control UI derle">
    Gateway’i ve Control UI’ı derler.
  </Step>
  <Step title="Doctor çalıştır">
    Son güvenli güncelleme kontrolü olarak `openclaw doctor` çalışır.
  </Step>
  <Step title="Plugin’leri senkronize et">
    Plugin’leri etkin kanala senkronize eder. Dev paketlenmiş Plugin’leri kullanır; stable ve beta npm kullanır. npm ile yüklenmiş Plugin’leri günceller.
  </Step>
</Steps>

<Warning>
Tam olarak sabitlenmiş bir npm Plugin güncellemesi, bütünlüğü saklanan yükleme kaydından farklı olan bir yapıta çözümlenirse, `openclaw update` bu Plugin yapıtı güncellemesini yüklemek yerine iptal eder. Yeni yapıta güvendiğinizi doğruladıktan sonra Plugin’i açıkça yeniden yükleyin veya güncelleyin.
</Warning>

<Note>
Güncelleme sonrası Plugin senkronizasyonu hataları güncelleme sonucunu başarısız yapar ve yeniden başlatma takip işini durdurur. Plugin yükleme veya güncelleme hatasını düzeltin, ardından `openclaw update` komutunu yeniden çalıştırın.

Güncellenmiş Gateway başladığında, etkinleştirilmiş paketlenmiş Plugin çalışma zamanı bağımlılıkları Plugin aktivasyonundan önce aşamalandırılır. Güncelleme tarafından tetiklenen yeniden başlatmalar, Gateway kapatılmadan önce etkin çalışma zamanı bağımlılığı aşamalandırmasını boşaltır; böylece hizmet yöneticisi yeniden başlatmaları devam eden bir npm yüklemesini kesintiye uğratmaz.

pnpm bootstrap yine başarısız olursa, güncelleyici checkout içinde `npm run build` denemek yerine paket yöneticisine özgü bir hatayla erken durur.
</Note>

## `--update` kısaltması

`openclaw --update`, `openclaw update` olarak yeniden yazılır (shell’ler ve başlatıcı script’leri için kullanışlıdır).

## İlgili

- `openclaw doctor` (git checkout’larında önce güncelleme çalıştırmayı teklif eder)
- [Geliştirme kanalları](/tr/install/development-channels)
- [Updating](/tr/install/updating)
- [CLI referansı](/tr/cli)
