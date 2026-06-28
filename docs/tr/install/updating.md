---
read_when:
    - OpenClaw’ı Güncelleme
    - Güncellemeden sonra bir şey bozuluyor
summary: OpenClaw'ı güvenli şekilde güncelleme (global kurulum veya kaynak), ayrıca geri alma stratejisi
title: Güncelleniyor
x-i18n:
    generated_at: "2026-06-28T00:45:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a96c5b9b12040fe9bb8b1623c88a9c305d58dc6fcee7003f500e897ded9e7b4a
    source_path: install/updating.md
    workflow: 16
---

OpenClaw'ı güncel tutun.

## Önerilen: `openclaw update`

Güncellemenin en hızlı yolu. Kurulum türünüzü (npm veya git) algılar, en son sürümü getirir, `openclaw doctor` çalıştırır ve Gateway'i yeniden başlatır.

```bash
openclaw update
```

Kanalları değiştirmek veya belirli bir sürümü hedeflemek için:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --dry-run   # preview without applying
```

`openclaw update`, `--verbose` kabul etmez. Güncelleme tanılama bilgileri için planlanan işlemleri önizlemek üzere `--dry-run`, yapılandırılmış sonuçlar için `--json` veya kanal ve kullanılabilirlik durumunu incelemek için `openclaw update status --json` kullanın. Kurucunun kendi `--verbose` bayrağı vardır, ancak bu bayrak `openclaw update` parçası değildir.

`--channel beta` betayı tercih eder, ancak beta etiketi eksikse veya en son kararlı sürümden eskiyse çalışma zamanı kararlı/en son sürüme geri döner. Tek seferlik bir paket güncellemesi için ham npm beta dist-tag'ini istiyorsanız `--tag beta` kullanın.

Kalıcı, hareketli bir GitHub `main` checkout'u için `--channel dev` kullanın. Paket güncellemeleri için `--tag main`, tek bir çalıştırma için `github:openclaw/openclaw#main` ile eşleşir ve GitHub/git kaynak tanımları, aşamalı npm kurulumundan önce geçici bir tarball içine paketlenir.

Yönetilen Plugin'ler için beta kanalı geri dönüşü bir uyarıdır: Bir Plugin betası mevcut olmadığından, bir Plugin kayıtlı varsayılan/en son sürümünü kullanırken çekirdek güncelleme yine de başarılı olabilir.

Kanal anlamları için [Geliştirme kanalları](/tr/install/development-channels) sayfasına bakın.

## npm ve git kurulumları arasında geçiş yapma

Kurulum türünü değiştirmek istediğinizde kanalları kullanın. Güncelleyici, `~/.openclaw` içindeki durumunuzu, yapılandırmanızı, kimlik bilgilerinizi ve çalışma alanınızı korur; yalnızca CLI ve Gateway'in hangi OpenClaw kod kurulumunu kullandığını değiştirir.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

Tam kurulum modu geçişini önizlemek için önce `--dry-run` ile çalıştırın:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` kanalı bir git checkout'u sağlar, bunu derler ve global CLI'yi bu checkout'tan kurar. `stable` ve `beta` kanalları paket kurulumlarını kullanır. Gateway zaten kuruluysa, `openclaw update` hizmet meta verilerini yeniler ve `--no-restart` iletmediğiniz sürece yeniden başlatır.

Yönetilen Gateway hizmetine sahip paket kurulumlarında `openclaw update`, bu hizmetin kullandığı paket kökünü hedefler. Kabuk `openclaw` komutu farklı bir kurulumdan geliyorsa, güncelleyici her iki kökü ve yönetilen hizmet Node yolunu yazdırır. Paket güncellemesi, hizmet kökünün sahibi olan paket yöneticisini kullanır ve paketi değiştirmeden önce yönetilen hizmet Node'unu hedef sürüm motoruna göre kontrol eder.

## Alternatif: kurucuyu yeniden çalıştırma

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

İlk katılımı atlamak için `--no-onboard` ekleyin. Kurucu üzerinden belirli bir kurulum türünü zorlamak için `--install-method git --no-onboard` veya `--install-method npm --no-onboard` iletin.

`openclaw update`, npm paket kurulumu aşamasından sonra başarısız olursa kurucuyu yeniden çalıştırın. Kurucu eski güncelleyiciyi çağırmaz; global paket kurulumunu doğrudan çalıştırır ve kısmen güncellenmiş bir npm kurulumunu kurtarabilir.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Kurtarmayı belirli bir sürüme veya dist-tag'e sabitlemek için `--version` ekleyin:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternatif: manuel npm, pnpm veya bun

```bash
npm i -g openclaw@latest
```

Denetimli kurulumlar için `openclaw update` tercih edin, çünkü paket değişimini çalışan Gateway hizmetiyle koordine edebilir. Denetimli bir kurulumu manuel güncelliyorsanız, paket yöneticisi başlamadan önce yönetilen Gateway'i durdurun. Paket yöneticileri dosyaları yerinde değiştirir ve çalışan bir Gateway aksi halde paket ağacı geçici olarak yarı değiştirilmişken çekirdek veya Plugin dosyalarını yüklemeye çalışabilir. Paket yöneticisi bittikten sonra Gateway'i yeniden başlatın, böylece hizmet yeni kurulumu alır.

Root'a ait Linux sistem genelinde bir kurulum için, `openclaw update` `EACCES` ile başarısız olursa ve sistem npm ile kurtarırsanız, manuel paket değiştirme boyunca Gateway'i durdurulmuş tutun. Normalde o Gateway için kullandığınız aynı `openclaw` profil bayraklarını veya ortamı kullanın. `/usr/bin/npm` yerine ana makinenizde root'a ait global prefix'in sahibi olan sistem npm'ini kullanın:

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

Ardından hizmeti doğrulayın:

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

`openclaw update` global bir npm kurulumunu yönettiğinde, hedefi önce geçici bir npm prefix'ine kurar, paketlenmiş `dist` envanterini doğrular, ardından temiz paket ağacını gerçek global prefix'e geçirir. Bu, npm'in yeni paketi eski paketten kalan bayat dosyaların üzerine bindirmesini önler. Kurulum komutu başarısız olursa OpenClaw, `--omit=optional` ile bir kez daha dener. Bu yeniden deneme, yerel isteğe bağlı bağımlılıkların derlenemediği ana makinelerde yardımcı olurken, geri dönüş de başarısız olursa özgün hatayı görünür tutar.

OpenClaw tarafından yönetilen npm güncelleme ve Plugin güncelleme komutları, alt npm işlemi için npm `min-release-age` karantinasını da temizler. npm bu politikayı türetilmiş bir `before` kesme noktası olarak bildirebilir; ikisi de genel tedarik zinciri karantina politikaları için kullanışlıdır, ancak açık bir OpenClaw güncellemesi "seçilen OpenClaw sürümünü şimdi kur" anlamına gelir.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Gelişmiş npm kurulum konuları

<AccordionGroup>
  <Accordion title="Salt okunur paket ağacı">
    OpenClaw, global paket dizini geçerli kullanıcı tarafından yazılabilir olsa bile paketlenmiş global kurulumları çalışma zamanında salt okunur kabul eder. Plugin paket kurulumları, kullanıcı yapılandırma dizini altındaki OpenClaw'a ait npm/git köklerinde bulunur ve Gateway başlangıcı OpenClaw paket ağacını değiştirmez.

    Bazı Linux npm kurulumları global paketleri `/usr/lib/node_modules/openclaw` gibi root'a ait dizinlerin altına kurar. OpenClaw bu düzeni destekler, çünkü Plugin kurulum/güncelleme komutları o global paket dizininin dışına yazar.

  </Accordion>
  <Accordion title="Sertleştirilmiş systemd birimleri">
    Açık Plugin kurulumlarının, Plugin güncellemelerinin ve doctor temizliğinin değişikliklerini kalıcı hale getirebilmesi için OpenClaw'a yapılandırma/durum köklerine yazma erişimi verin:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Disk alanı ön kontrolü">
    Paket güncellemelerinden ve açık Plugin kurulumlarından önce OpenClaw, hedef birim için en iyi çabayla bir disk alanı kontrolü denemesi yapar. Düşük alan, kontrol edilen yolla birlikte bir uyarı üretir, ancak güncellemeyi engellemez; çünkü dosya sistemi kotaları, anlık görüntüler ve ağ birimleri kontrolden sonra değişebilir. Asıl paket yöneticisi kurulumu ve kurulum sonrası doğrulama yetkili kaynak olarak kalır.
  </Accordion>
</AccordionGroup>

## Otomatik güncelleyici

Otomatik güncelleyici varsayılan olarak kapalıdır. `~/.openclaw/openclaw.json` içinde etkinleştirin:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Kanal    | Davranış                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | `stableDelayHours` kadar bekler, ardından `stableJitterHours` boyunca deterministik jitter ile uygular (yayılmış dağıtım). |
| `beta`   | Her `betaCheckIntervalHours` aralığında kontrol eder (varsayılan: saatlik) ve hemen uygular.                  |
| `dev`    | Otomatik uygulama yoktur. `openclaw update` komutunu manuel kullanın.                                         |

Gateway ayrıca başlangıçta bir güncelleme ipucu günlüğe yazar (`update.checkOnStart: false` ile devre dışı bırakın).
Sürüm düşürme veya olay kurtarma için, `update.auto.enabled` yapılandırılmış olsa bile otomatik uygulamaları engellemek üzere Gateway ortamında `OPENCLAW_NO_AUTO_UPDATE=1` ayarlayın. `update.checkOnStart` ayrıca devre dışı bırakılmadıkça başlangıç güncelleme ipuçları yine de çalışabilir.

Canlı Gateway kontrol düzlemi işleyicisi üzerinden istenen paket yöneticisi güncellemeleri, çalışan Gateway işleminin içindeki paket ağacını değiştirmez. Yönetilen hizmet kurulumlarında Gateway ayrık bir devir işlemi başlatır, çıkar ve normal `openclaw update --yes --json` CLI yolunun hizmeti durdurmasına, paketi değiştirmesine, hizmet meta verilerini yenilemesine, yeniden başlatmasına, Gateway sürümünü ve erişilebilirliğini doğrulamasına ve mümkün olduğunda kurulmuş ama yüklenmemiş bir macOS LaunchAgent'ı kurtarmasına izin verir. Gateway bu devri güvenli şekilde yapamazsa, `update.run` paket yöneticisini işlem içinde çalıştırmak yerine güvenli bir kabuk komutu bildirir.

## Güncellemeden sonra

<Steps>

### Doctor'ı çalıştırma

```bash
openclaw doctor
```

Yapılandırmayı taşır, DM politikalarını denetler ve Gateway sağlığını kontrol eder. Ayrıntılar: [Doctor](/tr/gateway/doctor)

### Gateway'i yeniden başlatma

```bash
openclaw gateway restart
```

### Doğrulama

```bash
openclaw health
```

</Steps>

## Geri alma

### Bir sürümü sabitleme (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` geçerli yayımlanmış sürümü gösterir.
</Tip>

### Bir commit'i sabitleme (kaynak)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

En son sürüme dönmek için: `git checkout main && git pull`.

## Takılırsanız

- `openclaw doctor` komutunu yeniden çalıştırın ve çıktıyı dikkatle okuyun.
- Kaynak checkout'larında `openclaw update --channel dev` için güncelleyici gerektiğinde `pnpm` önyüklemesini otomatik yapar. Bir pnpm/corepack önyükleme hatası görürseniz, `pnpm`'i manuel kurun (veya `corepack`'i yeniden etkinleştirin) ve güncellemeyi yeniden çalıştırın.
- Kontrol edin: [Sorun giderme](/tr/gateway/troubleshooting)
- Discord'da sorun: [https://discord.gg/clawd](https://discord.gg/clawd)

## İlgili

- [Kurulum genel bakışı](/tr/install): tüm kurulum yöntemleri.
- [Doctor](/tr/gateway/doctor): güncellemelerden sonra sağlık kontrolleri.
- [Geçiş](/tr/install/migrating): ana sürüm geçiş kılavuzları.
