---
read_when:
    - Bir kaynak çalışma kopyasını güvenli şekilde güncellemek istiyorsunuz
    - '`--update` kısaltma davranışını anlamanız gerekir'
summary: '`openclaw update` için CLI referansı (nispeten güvenli kaynak güncellemesi + Gateway otomatik yeniden başlatma)'
title: Güncelle
x-i18n:
    generated_at: "2026-05-02T20:43:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35df8c6d8b1adb9597377f6e2b4844352577992c12636a88b3f3c1854dc0666b
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw'ı güvenli şekilde güncelleyin ve stable/beta/dev kanalları arasında geçiş yapın.

**npm/pnpm/bun** ile kurduysanız (global kurulum, git metadata'sı yok),
güncellemeler [Güncelleme](/tr/install/updating) içindeki paket yöneticisi akışıyla gerçekleşir.

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
- `--tag <dist-tag|version|spec>`: yalnızca bu güncelleme için paket hedefini geçersiz kıl. Paket kurulumları için `main`, `github:openclaw/openclaw#main` ile eşleşir.
- `--dry-run`: yapılandırma yazmadan, kurulum yapmadan, Plugin'leri senkronize etmeden veya yeniden başlatmadan planlanan güncelleme eylemlerini (kanal/etiket/hedef/yeniden başlatma akışı) önizle.
- `--json`: npm Plugin artifact sapması güncelleme sonrası Plugin senkronizasyonu sırasında algılandığında
  `postUpdate.plugins.integrityDrifts` dahil makine tarafından okunabilir
  `UpdateRunResult` JSON yazdır.
- `--timeout <seconds>`: adım başına zaman aşımı (varsayılan 1800s).
- `--yes`: onay istemlerini atla (örneğin sürüm düşürme onayı).

<Warning>
Sürüm düşürmeler onay gerektirir, çünkü eski sürümler yapılandırmayı bozabilir.
</Warning>

## `update status`

Etkin güncelleme kanalını + git etiketi/dalı/SHA'sını (source checkout'ları için) ve güncelleme uygunluğunu göster.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Seçenekler:

- `--json`: makine tarafından okunabilir durum JSON'u yazdır.
- `--timeout <seconds>`: kontroller için zaman aşımı (varsayılan 3s).

## `update wizard`

Güncelleme kanalı seçmek ve güncellemeden sonra Gateway'in yeniden başlatılıp başlatılmayacağını
onaylamak için etkileşimli akış (varsayılan yeniden başlatmaktır). Git checkout olmadan `dev` seçerseniz,
bir tane oluşturmayı teklif eder.

Seçenekler:

- `--timeout <seconds>`: her güncelleme adımı için zaman aşımı (varsayılan `1800`)

## Ne yapar

Kanalları açıkça değiştirdiğinizde (`--channel ...`), OpenClaw kurulum
yöntemini de hizalı tutar:

- `dev` → bir git checkout olduğundan emin olur (varsayılan: `~/openclaw`, `OPENCLAW_GIT_DIR` ile geçersiz kılınır),
  onu günceller ve global CLI'yi bu checkout'tan kurar.
- `stable` → npm'den `latest` kullanarak kurar.
- `beta` → npm dist-tag `beta` tercih eder, ancak beta yoksa veya mevcut stable sürümden
  daha eskiyse `latest`'e geri döner.

Gateway core otomatik güncelleyici (yapılandırma üzerinden etkinleştirildiğinde), canlı Gateway istek işleyicisinin
dışında CLI güncelleme yolunu başlatır. Control-plane `update.run` paket yöneticisi
güncellemeleri, paket değişiminden sonra ertelenmeyen ve cooldown uygulanmayan bir güncelleme yeniden başlatmasını zorlar,
çünkü eski Gateway sürecinde yeni paket tarafından kaldırılmış dosyalara işaret eden
bellek içi parçalar hâlâ bulunabilir.

Paket yöneticisi kurulumları için `openclaw update`, paket yöneticisini çağırmadan önce hedef paket
sürümünü çözümler. npm global kurulumları aşamalı
kurulum kullanır: OpenClaw yeni paketi geçici bir npm prefix'ine kurar, oradaki
paketlenmiş `dist` envanterini doğrular, ardından bu temiz paket ağacını gerçek
global prefix'e taşır. Doğrulama başarısız olursa güncelleme sonrası doctor, Plugin senkronizasyonu ve
yeniden başlatma işleri şüpheli ağaçtan çalıştırılmaz. Kurulu sürüm
zaten hedefle eşleşse bile komut global paket kurulumunu yeniler,
ardından Plugin senkronizasyonu, core-command tamamlama yenilemesi ve yeniden başlatma işlerini çalıştırır. Bu,
paketlenmiş sidecar'ları ve kanalın sahip olduğu Plugin kayıtlarını kurulu
OpenClaw derlemesiyle hizalı tutarken tam Plugin-command tamamlama yeniden derlemelerini
açık `openclaw completion --write-state` çalıştırmalarına bırakır.

Yerel yönetilen Gateway hizmeti kurulu olduğunda ve yeniden başlatma etkinleştirildiğinde,
paket yöneticisi güncellemeleri paket ağacını değiştirmeden önce çalışan hizmeti durdurur,
ardından güncellenmiş kurulumdan hizmet metadata'sını yeniler, hizmeti yeniden başlatır
ve yeniden başlatılan Gateway'in beklenen sürümü bildirdiğini doğrular. `--no-restart` ile
paket değiştirme yine çalışır, ancak yönetilen hizmet durdurulmaz veya yeniden
başlatılmaz; bu nedenle çalışan Gateway, manuel olarak yeniden başlatana kadar eski kodu tutabilir.

## Git checkout akışı

### Kanal seçimi

- `stable`: en son beta olmayan etiketi checkout et, ardından build ve doctor çalıştır.
- `beta`: en son `-beta` etiketini tercih et, ancak beta yoksa veya daha eskiyse en son stable etikete geri dön.
- `dev`: `main` checkout et, ardından fetch ve rebase yap.

### Güncelleme adımları

<Steps>
  <Step title="Temiz worktree'yi doğrula">
    Commit edilmemiş değişiklik olmamasını gerektirir.
  </Step>
  <Step title="Kanal değiştir">
    Seçilen kanala geçer (etiket veya dal).
  </Step>
  <Step title="Upstream'i fetch et">
    Yalnızca dev.
  </Step>
  <Step title="Preflight build (yalnızca dev)">
    Geçici bir worktree içinde lint ve TypeScript build çalıştırır. Uç başarısız olursa en yeni temiz build'i bulmak için en fazla 10 commit geriye gider.
  </Step>
  <Step title="Rebase">
    Seçilen commit üzerine rebase yapar (yalnızca dev).
  </Step>
  <Step title="Bağımlılıkları kur">
    Repo paket yöneticisini kullanır. pnpm checkout'ları için updater, pnpm workspace içinde `npm run build` çalıştırmak yerine `pnpm`'i gerektiğinde bootstrap eder (önce `corepack` üzerinden, ardından geçici `npm install pnpm@10` fallback'i ile).
  </Step>
  <Step title="Control UI build et">
    Gateway'i ve Control UI'yi build eder.
  </Step>
  <Step title="Doctor çalıştır">
    `openclaw doctor`, son güvenli güncelleme kontrolü olarak çalışır.
  </Step>
  <Step title="Plugin'leri senkronize et">
    Plugin'leri etkin kanala senkronize eder. Dev, bundled Plugin'leri kullanır; stable ve beta npm kullanır. İzlenen Plugin kurulumlarını günceller.
  </Step>
</Steps>

Beta güncelleme kanalında, varsayılan/latest hattını izleyen izlenen npm ve ClawHub Plugin
kurulumları önce bir Plugin `@beta` sürümünü dener. Plugin'in beta sürümü yoksa
OpenClaw, kaydedilmiş varsayılan/latest spec'e geri döner. Kesin
sürümler ve açık etiketler yeniden yazılmaz.

<Warning>
Kesin sabitlenmiş bir npm Plugin güncellemesi, bütünlüğü depolanan kurulum kaydından farklı olan bir artifact'e çözümlenirse `openclaw update`, onu kurmak yerine bu Plugin artifact güncellemesini iptal eder. Plugin'i yalnızca yeni artifact'e güvendiğinizi doğruladıktan sonra açıkça yeniden kurun veya güncelleyin.
</Warning>

<Note>
Güncelleme sonrası Plugin senkronizasyonu hataları, güncelleme sonucunu başarısız yapar ve yeniden başlatma takip işini durdurur. Plugin kurulum veya güncelleme hatasını düzeltin, ardından `openclaw update` komutunu yeniden çalıştırın.

Güncellenmiş Gateway başladığında, Plugin yükleme yalnızca doğrulama amaçlıdır: başlangıç, paket yöneticilerini çalıştırmaz veya bağımlılık ağaçlarını değiştirmez. Paket yöneticisi `update.run` yeniden başlatmaları, paket ağacı değiştirildikten sonra normal boşta ertelemesini ve yeniden başlatma cooldown'unu atlar; böylece eski süreç kaldırılmış parçaları lazy-loading ile tutamaz.

Pnpm bootstrap hâlâ başarısız olursa updater, checkout içinde `npm run build` denemek yerine paket yöneticisine özgü bir hatayla erken durur.
</Note>

## `--update` kısaltması

`openclaw --update`, `openclaw update` olarak yeniden yazılır (kabuklar ve launcher script'leri için kullanışlıdır).

## İlgili

- `openclaw doctor` (git checkout'larında önce güncelleme çalıştırmayı teklif eder)
- [Geliştirme kanalları](/tr/install/development-channels)
- [Güncelleme](/tr/install/updating)
- [CLI başvurusu](/tr/cli)
