---
read_when:
    - Skills veya Plugin arama, yükleme ya da güncelleme
    - Skills veya Plugin'leri kayıt defterinde yayımlama
    - clawhub CLI'sini veya ortam geçersiz kılmalarını yapılandırma
sidebarTitle: ClawHub
summary: 'ClawHub: OpenClaw Skills ve Plugin''leri, yerel kurulum akışları ve clawhub CLI için herkese açık kayıt'
title: ClawHub
x-i18n:
    generated_at: "2026-05-02T09:07:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 353b224ccfb8096c270b7896e640e9e419fcb50c265298102a5ce0173566933e
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub, **OpenClaw Skills ve Plugin'leri** için herkese açık kayıt deposudur.

- Skills aramak, yüklemek ve güncellemek ve ClawHub'dan Plugin yüklemek için yerel `openclaw` komutlarını kullanın.
- Kayıt deposu kimlik doğrulaması, yayımlama, silme/geri alma ve eşitleme iş akışları için ayrı `clawhub` CLI'ını kullanın.

Site: [clawhub.ai](https://clawhub.ai)

## Hızlı başlangıç

<Steps>
  <Step title="Ara">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="Yükle">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="Kullan">
    Yeni bir OpenClaw oturumu başlatın — yeni Skill'i algılar.
  </Step>
  <Step title="Yayımla (isteğe bağlı)">
    Kayıt deposu kimlik doğrulamalı iş akışları (yayımlama, eşitleme, yönetme) için
    ayrı `clawhub` CLI'ını yükleyin:

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## Yerel OpenClaw akışları

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Yerel `openclaw` komutları, etkin çalışma alanınıza yükler ve
    daha sonraki `update` çağrılarının ClawHub'da kalabilmesi için kaynak üst verilerini
    kalıcı olarak saklar.

  </Tab>
  <Tab title="Plugin'ler">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search`, ClawHub Plugin kataloğunu sorgular ve yüklemeye hazır
    paket adlarını yazdırır. Düz npm uyumlu Plugin tanımları da npm'den
    önce ClawHub üzerinde denenir:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    ClawHub araması olmadan yalnızca npm çözümlemesi istediğinizde
    `npm:<package>` kullanın:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Plugin yüklemeleri, arşiv yüklemesi çalışmadan önce duyurulan `pluginApi` ve
    `minGatewayVersion` uyumluluğunu doğrular; böylece uyumsuz ana makineler
    paketi kısmen yüklemek yerine erken ve kapalı şekilde başarısız olur.
    Bir paket sürümü ClawPack yapıtı yayımladığında, OpenClaw bu yapıtı tercih eder,
    ClawHub özet başlığını ve indirilen baytları doğrular ve daha sonraki
    güncellemeler için ClawPack özet üst verilerini kaydeder. ClawPack üst verisi
    olmayan eski paket sürümleri hâlâ eski paket arşivi doğrulama yolunu kullanır.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` yalnızca yüklenebilir Plugin
ailelerini kabul eder. Bir ClawHub paketi aslında Skill ise OpenClaw durur ve
bunun yerine sizi `openclaw skills install <slug>` komutuna yönlendirir.

Anonim ClawHub Plugin yüklemeleri özel paketler için de kapalı şekilde
başarısız olur. Topluluk veya diğer resmi olmayan kanallar yine de yüklenebilir,
ancak OpenClaw, operatörlerin bunları etkinleştirmeden önce kaynağı ve
doğrulamayı inceleyebilmesi için uyarır.
</Note>

## ClawHub nedir

- OpenClaw Skills ve Plugin'leri için herkese açık bir kayıt deposu.
- Skill paketleri ve üst verileri için sürümlü bir depo.
- Arama, etiketler ve kullanım sinyalleri için bir keşif yüzeyi.

Tipik bir Skill, şunları içeren sürümlü bir dosya paketidir:

- Birincil açıklama ve kullanım bilgilerini içeren bir `SKILL.md` dosyası.
- Skill tarafından kullanılan isteğe bağlı yapılandırmalar, betikler veya destekleyici dosyalar.
- Etiketler, özet ve yükleme gereksinimleri gibi üst veriler.

ClawHub, keşfi desteklemek ve Skill yeteneklerini güvenli şekilde göstermek için
üst verileri kullanır. Kayıt deposu, sıralamayı ve görünürlüğü iyileştirmek için
kullanım sinyallerini (yıldızlar, indirmeler) izler. Her yayımlama yeni bir semver
sürümü oluşturur ve kayıt deposu, kullanıcıların değişiklikleri denetleyebilmesi
için sürüm geçmişini saklar.

## Çalışma alanı ve Skill yükleme

Ayrı `clawhub` CLI'ı da Skills'i geçerli çalışma dizininizin altındaki
`./skills` içine yükler. Bir OpenClaw çalışma alanı yapılandırılmışsa,
`clawhub`, `--workdir` (veya `CLAWHUB_WORKDIR`) ile geçersiz kılmadığınız sürece
o çalışma alanına geri döner. OpenClaw, çalışma alanı Skills'ini
`<workspace>/skills` konumundan yükler ve bunları **sonraki** oturumda algılar.

Zaten `~/.openclaw/skills` veya paketlenmiş Skills kullanıyorsanız, çalışma alanı
Skills'i önceliklidir. Skills'in nasıl yüklendiği, paylaşıldığı ve kapılandığı
hakkında daha fazla ayrıntı için bkz. [Skills](/tr/tools/skills).

## Hizmet özellikleri

| Özellik                 | Notlar                                                                 |
| ----------------------- | ---------------------------------------------------------------------- |
| Herkese açık gezinme    | Skills ve `SKILL.md` içerikleri herkese açık olarak görüntülenebilir.  |
| Arama                   | Yalnızca anahtar sözcükler değil, gömme tabanlıdır (vektör arama).     |
| Sürümleme               | Semver, değişiklik günlükleri ve etiketler (`latest` dahil).           |
| İndirmeler              | Sürüm başına Zip.                                                      |
| Yıldızlar ve yorumlar   | Topluluk geri bildirimi.                                               |
| Güvenlik taraması özetleri | Ayrıntı sayfaları, yükleme veya indirmeden önce en son tarama durumunu gösterir. |
| Tarayıcı ayrıntı sayfaları | VirusTotal, ClawScan ve statik analiz sonuçları derin bağlantılara sahiptir. |
| Sahip kurtarma panosu   | Yayımcılar, tarama nedeniyle bekletilen sahip oldukları içeriği `/dashboard` üzerinden görebilir. |
| Sahip tarafından istenen yeniden taramalar | Sahipler, yanlış pozitif kurtarma için sınırlı yeniden taramalar isteyebilir. |
| Moderasyon              | Onaylar ve denetimler.                                                 |
| CLI dostu API           | Otomasyon ve betikleme için uygundur.                                  |

## Güvenlik ve moderasyon

ClawHub varsayılan olarak açıktır — herkes Skills yükleyebilir, ancak yayımlamak
için bir GitHub hesabının **en az bir haftalık** olması gerekir. Bu, meşru
katkıda bulunanları engellemeden kötüye kullanımı yavaşlatır.

<AccordionGroup>
  <Accordion title="Güvenlik taramaları">
    ClawHub, yayımlanan Skills ve Plugin sürümleri üzerinde otomatik güvenlik
    denetimleri çalıştırır. Herkese açık ayrıntı sayfaları geçerli sonucu özetler
    ve tarayıcı satırları VirusTotal, ClawScan ve statik analiz için ayrılmış
    ayrıntı sayfalarına bağlantı verir.

    Tarama nedeniyle bekletilen veya engellenen sürümler, sahiplerine
    `/dashboard` içinde görünmeye devam ederken herkese açık katalog ve yükleme
    yüzeylerinde kullanılamayabilir.

  </Accordion>
  <Accordion title="Bildirme">
    - Oturum açmış herhangi bir kullanıcı bir Skill'i bildirebilir.
    - Bildirim nedenleri zorunludur ve kaydedilir.
    - Her kullanıcının aynı anda en fazla 20 etkin bildirimi olabilir.
    - 3'ten fazla benzersiz bildirim alan Skills varsayılan olarak otomatik gizlenir.

  </Accordion>
  <Accordion title="Moderasyon">
    - Moderatörler gizli Skills'i görüntüleyebilir, gizlemeyi kaldırabilir, silebilir veya kullanıcıları yasaklayabilir.
    - Bildirme özelliğini kötüye kullanmak hesap yasaklarına yol açabilir.
    - Moderatör olmak mı istiyorsunuz? OpenClaw Discord'da sorun ve bir moderatör ya da bakımcı ile iletişime geçin.

  </Accordion>
</AccordionGroup>

## ClawHub CLI

Buna yalnızca yayımlama/eşitleme gibi kayıt deposu kimlik doğrulamalı iş akışları
için ihtiyacınız vardır.

### Genel seçenekler

<ParamField path="--workdir <dir>" type="string">
  Çalışma dizini. Varsayılan: geçerli dizin; OpenClaw çalışma alanına geri döner.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Skills dizini, workdir'e göre göreli.
</ParamField>
<ParamField path="--site <url>" type="string">
  Site temel URL'si (tarayıcı oturum açma).
</ParamField>
<ParamField path="--registry <url>" type="string">
  Kayıt deposu API temel URL'si.
</ParamField>
<ParamField path="--no-input" type="boolean">
  İstemleri devre dışı bırak (etkileşimsiz).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  CLI sürümünü yazdır.
</ParamField>

### Komutlar

<AccordionGroup>
  <Accordion title="Kimlik doğrulama (oturum açma / oturumu kapatma / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Oturum açma seçenekleri:

    - `--token <token>` — bir API belirteci yapıştırın.
    - `--label <label>` — tarayıcı oturum açma belirteçleri için saklanan etiket (varsayılan: `CLI token`).
    - `--no-browser` — tarayıcı açma (`--token` gerektirir).

  </Accordion>
  <Accordion title="Ara">
    ```bash
    clawhub search "query"
    ```

    Skills içinde arama yapar. Plugin/paket keşfi için `clawhub package explore` kullanın.

    - `--limit <n>` — en fazla sonuç sayısı.

  </Accordion>
  <Accordion title="Plugin'lere göz at / incele">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` ve `package inspect`, Plugin/paket keşfi ve üst veri incelemesi için ClawHub CLI yüzeyleridir. Yerel OpenClaw yüklemeleri hâlâ `openclaw plugins install clawhub:<package>` kullanır.

    Seçenekler:

    - `--family skill|code-plugin|bundle-plugin` — paket ailesine göre filtrele.
    - `--official` — yalnızca resmi paketleri göster.
    - `--executes-code` — yalnızca kod yürüten paketleri göster.
    - `--version <version>` / `--tag <tag>` — belirli bir paket sürümünü incele.
    - `--versions`, `--files`, `--file <path>` — paket geçmişini ve dosyalarını incele.
    - `--json` — makine tarafından okunabilir çıktı.

  </Accordion>
  <Accordion title="Yükle / güncelle / listele">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Seçenekler:

    - `--version <version>` — belirli bir sürüme yükle veya güncelle (`update` üzerinde yalnızca tek slug).
    - `--force` — klasör zaten varsa veya yerel dosyalar yayımlanmış herhangi bir sürümle eşleşmiyorsa üzerine yaz.
    - `clawhub list`, `.clawhub/lock.json` dosyasını okur.

  </Accordion>
  <Accordion title="Skills yayımla">
    ```bash
    clawhub skill publish <path>
    ```

    Seçenekler:

    - `--slug <slug>` — Skill slug'ı.
    - `--name <name>` — görünen ad.
    - `--version <version>` — semver sürümü.
    - `--changelog <text>` — değişiklik günlüğü metni (boş olabilir).
    - `--tags <tags>` — virgülle ayrılmış etiketler (varsayılan: `latest`).

  </Accordion>
  <Accordion title="Plugin'ler yayımla">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` yerel klasör, `owner/repo`, `owner/repo@ref` veya
    GitHub URL'si olabilir.

    Seçenekler:

    - `--dry-run` — hiçbir şey yüklemeden tam yayımlama planını oluştur.
    - `--json` — CI için makine tarafından okunabilir çıktı üret.
    - `--source-repo`, `--source-commit`, `--source-ref` — otomatik algılama yeterli olmadığında isteğe bağlı geçersiz kılmalar.

  </Accordion>
  <Accordion title="Yeniden tarama iste">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    Yeniden tarama komutları, oturum açmış bir sahip belirteci gerektirir ve
    en son yayımlanan Skill sürümünü veya Plugin sürümünü hedefler. Etkileşimsiz
    çalıştırmalarda `--yes` iletin.

    JSON yanıtları hedef türü, ad, sürüm, yeniden tarama durumu ve o sürüm veya
    yayımlama için kalan/azami istek sayılarını içerir.

  </Accordion>
  <Accordion title="Sil / geri al (sahip veya yönetici)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Eşitle (yereli tara + yeni veya güncellenmiş olanı yayımla)">
    ```bash
    clawhub sync
    ```

    Seçenekler:

    - `--root <dir...>` — ek tarama kökleri.
    - `--all` — her şeyi istem olmadan yükle.
    - `--dry-run` — neyin yükleneceğini göster.
    - `--bump <type>` — güncellemeler için `patch|minor|major` (varsayılan: `patch`).
    - `--changelog <text>` — etkileşimsiz güncellemeler için değişiklik günlüğü.
    - `--tags <tags>` — virgülle ayrılmış etiketler (varsayılan: `latest`).
    - `--concurrency <n>` — kayıt deposu denetimleri (varsayılan: `4`).

  </Accordion>
</AccordionGroup>

## Yaygın iş akışları

<Tabs>
  <Tab title="Ara">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Plugin bul">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "memory" --family code-plugin
    clawhub package inspect episodic-claw
    ```
  </Tab>
  <Tab title="Yükle">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="Tümünü güncelle">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="Tek bir skill yayımla">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Birçok skill'i eşitle">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="GitHub'dan bir Plugin yayımla">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### Plugin paketi meta verileri

Kod Plugin'leri gerekli OpenClaw meta verilerini
`package.json` içinde içermelidir:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

Yayımlanan paketler **derlenmiş JavaScript** ile gönderilmeli ve
`runtimeExtensions` bu çıktıyı göstermelidir. Git checkout yüklemeleri,
derlenmiş dosyalar olmadığında hâlâ TypeScript kaynağına geri dönebilir,
ancak derlenmiş çalışma zamanı girişleri başlangıç, doctor ve
Plugin yükleme yollarında çalışma zamanı TypeScript derlemesini önler.

## Sürümleme, lockfile ve telemetri

<AccordionGroup>
  <Accordion title="Sürümleme ve etiketler">
    - Her yayımlama yeni bir **semver** `SkillVersion` oluşturur.
    - Etiketler (`latest` gibi) bir sürüme işaret eder; etiketleri taşımak geri almanıza olanak tanır.
    - Değişiklik günlükleri sürüm başına eklenir ve güncellemeleri eşitlerken veya yayımlarken boş olabilir.

  </Accordion>
  <Accordion title="Yerel değişiklikler ve registry sürümleri">
    Güncellemeler, yerel skill içeriklerini bir içerik karması kullanarak
    registry sürümleriyle karşılaştırır. Yerel dosyalar yayımlanmış hiçbir
    sürümle eşleşmezse, CLI üzerine yazmadan önce sorar (veya etkileşimsiz
    çalıştırmalarda `--force` gerektirir).
  </Accordion>
  <Accordion title="Eşitleme taraması ve yedek kökler">
    `clawhub sync` önce geçerli çalışma dizininizi tarar. Hiç skill
    bulunmazsa bilinen eski konumlara geri döner (örneğin
    `~/openclaw/skills` ve `~/.openclaw/skills`). Bu, ek bayraklar olmadan
    eski skill yüklemelerini bulmak için tasarlanmıştır.
  </Accordion>
  <Accordion title="Depolama ve lockfile">
    - Yüklü skill'ler çalışma dizininizin altındaki `.clawhub/lock.json` içinde kaydedilir.
    - Kimlik doğrulama token'ları ClawHub CLI yapılandırma dosyasında saklanır (`CLAWHUB_CONFIG_PATH` ile geçersiz kılınabilir).

  </Accordion>
  <Accordion title="Telemetri (yükleme sayıları)">
    Oturum açmışken `clawhub sync` çalıştırdığınızda, CLI yükleme sayılarını
    hesaplamak için en küçük kapsamlı bir anlık görüntü gönderir. Bunu tamamen
    devre dışı bırakabilirsiniz:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Ortam değişkenleri

| Değişken                      | Etki                                            |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | Site URL'sini geçersiz kıl.                     |
| `CLAWHUB_REGISTRY`            | Registry API URL'sini geçersiz kıl.             |
| `CLAWHUB_CONFIG_PATH`         | CLI'nin token/yapılandırmayı sakladığı yeri geçersiz kıl. |
| `CLAWHUB_WORKDIR`             | Varsayılan çalışma dizinini geçersiz kıl.       |
| `CLAWHUB_DISABLE_TELEMETRY=1` | `sync` sırasında telemetriyi devre dışı bırak.  |

## İlgili

- [Topluluk Plugin'leri](/tr/plugins/community)
- [Plugin'ler](/tr/tools/plugin)
- [Skills](/tr/tools/skills)
