---
read_when:
    - OpenClaw'ı Güncelleme
    - Bir güncellemeden sonra bir şey bozulursa
summary: OpenClaw’ı güvenle güncelleme (global kurulum veya kaynak koddan kurulum), ayrıca geri alma stratejisi
title: Güncelleme
x-i18n:
    generated_at: "2026-05-02T08:59:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84bf4462a4ee041b0d22e433d1e9f44cfd799a5c327ba94f9df96595d92bdb3c
    source_path: install/updating.md
    workflow: 16
---

OpenClaw’ı güncel tutun.

## Önerilen: `openclaw update`

Güncellemenin en hızlı yolu. Kurulum türünüzü (npm veya git) algılar, en son sürümü getirir, `openclaw doctor` çalıştırır ve Gateway’i yeniden başlatır.

```bash
openclaw update
```

Kanalları değiştirmek veya belirli bir sürümü hedeflemek için:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # uygulamadan önizle
```

`--channel beta` beta’yı tercih eder, ancak beta etiketi eksikse veya en son kararlı sürümden eskiyse çalışma zamanı kararlı/latest sürümüne geri döner. Tek seferlik paket güncellemesi için ham npm beta dist-tag’ini istiyorsanız `--tag beta` kullanın.

Kanal semantiği için [Geliştirme kanalları](/tr/install/development-channels) bölümüne bakın.

## npm ve git kurulumları arasında geçiş yapın

Kurulum türünü değiştirmek istediğinizde kanalları kullanın. Güncelleyici `~/.openclaw` içindeki durumunuzu, yapılandırmanızı, kimlik bilgilerinizi ve çalışma alanınızı korur; yalnızca CLI ve Gateway’in kullandığı OpenClaw kod kurulumunu değiştirir.

```bash
# npm paket kurulumu -> düzenlenebilir git checkout
openclaw update --channel dev

# git checkout -> npm paket kurulumu
openclaw update --channel stable
```

Tam kurulum modu geçişini önizlemek için önce `--dry-run` ile çalıştırın:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` kanalı bir git checkout olmasını sağlar, onu derler ve genel CLI’ı bu checkout’tan kurar. `stable` ve `beta` kanalları paket kurulumlarını kullanır. Gateway zaten kuruluysa, `--no-restart` iletmediğiniz sürece `openclaw update` servis meta verilerini yeniler ve yeniden başlatır.

## Alternatif: yükleyiciyi yeniden çalıştırın

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

İlk kurulumu atlamak için `--no-onboard` ekleyin. Yükleyici üzerinden belirli bir kurulum türünü zorlamak için `--install-method git --no-onboard` veya `--install-method npm --no-onboard` iletin.

`openclaw update`, npm paket kurulumu aşamasından sonra başarısız olursa yükleyiciyi yeniden çalıştırın. Yükleyici eski güncelleyiciyi çağırmaz; genel paket kurulumunu doğrudan çalıştırır ve kısmen güncellenmiş bir npm kurulumunu kurtarabilir.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Kurtarmayı belirli bir sürüme veya dist-tag’e sabitlemek için `--version` ekleyin:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternatif: manuel npm, pnpm veya bun

```bash
npm i -g openclaw@latest
```

`openclaw update` genel bir npm kurulumunu yönettiğinde, önce hedefi geçici bir npm önekine kurar, paketlenmiş `dist` envanterini doğrular, ardından temiz paket ağacını gerçek genel öneke taşır. Bu, npm’in yeni bir paketi eski paketten kalan bayat dosyaların üzerine bindirmesini önler. Kurulum komutu başarısız olursa OpenClaw `--omit=optional` ile bir kez daha dener. Bu yeniden deneme, yerel isteğe bağlı bağımlılıkların derlenemediği ana makinelerde yardımcı olurken, geri dönüş de başarısız olursa özgün hatayı görünür tutar.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Gelişmiş npm kurulum konuları

<AccordionGroup>
  <Accordion title="Salt okunur paket ağacı">
    OpenClaw, genel paket dizini geçerli kullanıcı tarafından yazılabilir olsa bile, paketlenmiş genel kurulumları çalışma zamanında salt okunur kabul eder. Plugin paket kurulumları, kullanıcı yapılandırma dizini altındaki OpenClaw’a ait npm/git köklerinde bulunur ve Gateway başlangıcı OpenClaw paket ağacını değiştirmez.

    Bazı Linux npm kurulumları genel paketleri `/usr/lib/node_modules/openclaw` gibi root’a ait dizinlerin altına kurar. OpenClaw bu yerleşimi destekler çünkü Plugin kurulum/güncelleme komutları bu genel paket dizininin dışına yazar.

  </Accordion>
  <Accordion title="Güçlendirilmiş systemd birimleri">
    Açık Plugin kurulumlarının, Plugin güncellemelerinin ve doctor temizliğinin değişikliklerini kalıcı hale getirebilmesi için OpenClaw’a yapılandırma/durum köklerine yazma erişimi verin:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Disk alanı ön denetimi">
    Paket güncellemelerinden ve açık Plugin kurulumlarından önce OpenClaw, hedef birim için en iyi çabayla bir disk alanı denetimi yapmayı dener. Düşük alan, denetlenen yolu içeren bir uyarı üretir, ancak güncellemeyi engellemez çünkü dosya sistemi kotaları, anlık görüntüler ve ağ birimleri denetimden sonra değişebilir. Asıl paket yöneticisi kurulumu ve kurulum sonrası doğrulama yetkili olmaya devam eder.
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

| Kanal    | Davranış                                                                                                               |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `stable` | `stableDelayHours` kadar bekler, ardından `stableJitterHours` genelinde belirleyici jitter ile uygular (kademeli dağıtım). |
| `beta`   | Her `betaCheckIntervalHours` aralığında denetler (varsayılan: saatlik) ve hemen uygular.                               |
| `dev`    | Otomatik uygulama yoktur. `openclaw update` komutunu manuel kullanın.                                                   |

Gateway başlangıçta bir güncelleme ipucu da günlüğe yazar (`update.checkOnStart: false` ile devre dışı bırakın).
Sürüm düşürme veya olay kurtarma için, `update.auto.enabled` yapılandırılmış olsa bile otomatik uygulamaları engellemek üzere Gateway ortamında `OPENCLAW_NO_AUTO_UPDATE=1` ayarlayın. `update.checkOnStart` da devre dışı bırakılmadığı sürece başlangıç güncelleme ipuçları yine çalışabilir.

Canlı Gateway kontrol düzlemi işleyicisi üzerinden istenen paket yöneticisi güncellemeleri, paket değişiminden sonra ertelenmeyen ve bekleme süresi olmayan bir güncelleme yeniden başlatmasını zorlar. Bu, eski bir bellek içi işlemin, zaten değiştirilmiş bir paket ağacından parçaları geç yükleyecek kadar uzun süre kalmasını önler. Kabuk üzerinden `openclaw update`, denetimli kurulumlar için tercih edilen yol olmaya devam eder çünkü güncelleme sırasında servisi durdurup yeniden başlatabilir.

## Güncellemeden sonra

<Steps>

### Doctor çalıştırın

```bash
openclaw doctor
```

Yapılandırmayı taşır, DM politikalarını denetler ve Gateway sağlığını kontrol eder. Ayrıntılar: [Doctor](/tr/gateway/doctor)

### Gateway’i yeniden başlatın

```bash
openclaw gateway restart
```

### Doğrulayın

```bash
openclaw health
```

</Steps>

## Geri alma

### Bir sürümü sabitleyin (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` geçerli yayımlanmış sürümü gösterir.
</Tip>

### Bir commit’i sabitleyin (kaynak)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

En son sürüme dönmek için: `git checkout main && git pull`.

## Takılırsanız

- `openclaw doctor` komutunu tekrar çalıştırın ve çıktıyı dikkatlice okuyun.
- Kaynak checkout’larında `openclaw update --channel dev` için, güncelleyici gerektiğinde `pnpm` önyüklemesini otomatik yapar. Bir pnpm/corepack önyükleme hatası görürseniz `pnpm`’i manuel kurun (veya `corepack`’i yeniden etkinleştirin) ve güncellemeyi tekrar çalıştırın.
- Kontrol edin: [Sorun giderme](/tr/gateway/troubleshooting)
- Discord’da sorun: [https://discord.gg/clawd](https://discord.gg/clawd)

## İlgili

- [Kurulum özeti](/tr/install): tüm kurulum yöntemleri.
- [Doctor](/tr/gateway/doctor): güncellemelerden sonra sağlık kontrolleri.
- [Geçiş](/tr/install/migrating): ana sürüm geçiş kılavuzları.
