---
read_when:
    - Skills veya Plugin arama, yükleme ya da güncelleme
    - Skills veya Plugin’leri kayıt defterinde yayımlama
    - ClawHub CLI'sini veya ortam geçersiz kılmalarını yapılandırma
sidebarTitle: ClawHub
summary: 'ClawHub: OpenClaw Skills ve Plugin''leri için herkese açık kayıt defteri, yerel kurulum akışları ve clawhub CLI'
title: ClawHub
x-i18n:
    generated_at: "2026-05-02T21:01:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd422cb3e7e53fcc6d2b8a557ebc569debb0b470d5fcf141d90499c03fb4d7b3
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub, **OpenClaw Skills ve Plugin'leri** için herkese açık kayıttır.

- Skills aramak, kurmak ve güncellemek ve ClawHub'dan Plugin kurmak için yerel `openclaw` komutlarını kullanın.
- Kayıt kimlik doğrulaması, yayımlama, silme/silmeyi geri alma ve eşitleme iş akışları için ayrı `clawhub` CLI'ını kullanın.

Site: [clawhub.ai](https://clawhub.ai)

## Hızlı başlangıç

<Steps>
  <Step title="Ara">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="Kur">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="Kullan">
    Yeni bir OpenClaw oturumu başlatın; yeni skill'i algılar.
  </Step>
  <Step title="Yayımla (isteğe bağlı)">
    Kayıt kimliği doğrulanmış iş akışları (yayımlama, eşitleme, yönetme) için
    ayrı `clawhub` CLI'ını kurun:

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

    Yerel `openclaw` komutları etkin çalışma alanınıza kurulum yapar ve
    kaynak meta verilerini kalıcı hale getirir; böylece sonraki `update`
    çağrıları ClawHub üzerinde kalabilir.

  </Tab>
  <Tab title="Plugin'ler">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search`, ClawHub Plugin kataloğunu sorgular ve kuruluma hazır
    paket adlarını yazdırır. ClawHub çözümlemesi istediğinizde
    `clawhub:<package>` kullanın. Çıplak npm-güvenli Plugin tanımları,
    lansman geçişi sırasında npm'den kurulur:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    `npm:<package>` de yalnızca npm içindir ve bir tanım aksi halde belirsiz
    olabilecekse kullanışlıdır:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Plugin kurulumları, arşiv kurulumu çalışmadan önce duyurulan `pluginApi`
    ve `minGatewayVersion` uyumluluğunu doğrular; böylece uyumsuz ana makineler
    paketi kısmen kurmak yerine erken aşamada kapalı hata verir. Bir paket
    sürümü ClawPack yapıtı yayımladığında OpenClaw, tam olarak yüklenen npm-pack
    `.tgz` dosyasını tercih eder, ClawHub özet başlığını ve indirilen baytları
    doğrular ve sonraki güncellemeler için yapıt türünü, npm bütünlüğünü, npm
    shasum değerini, tarball adını ve ClawPack özet meta verilerini kaydeder.
    ClawPack meta verisi olmayan eski paket sürümleri, hâlâ eski paket arşivi
    doğrulama yolunu kullanır.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` yalnızca kurulabilir Plugin
ailelerini kabul eder. Bir ClawHub paketi aslında bir skill ise OpenClaw durur
ve bunun yerine sizi `openclaw skills install <slug>` komutuna yönlendirir.

Anonim ClawHub Plugin kurulumları özel paketler için de kapalı hata verir.
Topluluk veya diğer resmi olmayan kanallar yine de kurulabilir, ancak OpenClaw
operatörlerin bunları etkinleştirmeden önce kaynağı ve doğrulamayı
inceleyebilmesi için uyarır.
</Note>

## ClawHub nedir

- OpenClaw Skills ve Plugin'leri için herkese açık bir kayıt.
- Skill paketlerinin ve meta verilerinin sürümlü bir deposu.
- Arama, etiketler ve kullanım sinyalleri için bir keşif yüzeyi.

Tipik bir skill, şunları içeren sürümlü bir dosya paketidir:

- Birincil açıklama ve kullanım bilgilerini içeren bir `SKILL.md` dosyası.
- Skill tarafından kullanılan isteğe bağlı yapılandırmalar, betikler veya destekleyici dosyalar.
- Etiketler, özet ve kurulum gereksinimleri gibi meta veriler.

ClawHub, keşfi desteklemek ve skill yeteneklerini güvenli biçimde
sunmak için meta verileri kullanır. Kayıt, sıralamayı ve görünürlüğü
iyileştirmek için kullanım sinyallerini (yıldızlar, indirmeler) izler.
Her yayımlama yeni bir semver sürümü oluşturur ve kayıt, kullanıcıların
değişiklikleri denetleyebilmesi için sürüm geçmişini saklar.

## Çalışma alanı ve skill yükleme

Ayrı `clawhub` CLI'ı, Skills'i geçerli çalışma dizininizin altındaki
`./skills` konumuna da kurar. Bir OpenClaw çalışma alanı yapılandırılmışsa
`clawhub`, `--workdir` (veya `CLAWHUB_WORKDIR`) ile geçersiz kılmadığınız sürece
bu çalışma alanına geri döner. OpenClaw, çalışma alanı Skills'ini
`<workspace>/skills` içinden yükler ve bunları **sonraki** oturumda algılar.

Zaten `~/.openclaw/skills` veya paketle gelen Skills kullanıyorsanız, çalışma
alanı Skills'i önceliklidir. Skills'in nasıl yüklendiği, paylaşıldığı ve
geçitlerden geçirildiği hakkında daha fazla ayrıntı için [Skills](/tr/tools/skills)
sayfasına bakın.

## Hizmet özellikleri

| Özellik                  | Notlar                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| Herkese açık gezinme     | Skills ve `SKILL.md` içerikleri herkese açık olarak görüntülenebilir. |
| Arama                    | Yalnızca anahtar kelimeler değil, embedding destekli (vektör arama). |
| Sürümleme                | Semver, değişiklik günlükleri ve etiketler (`latest` dahil).         |
| İndirmeler               | Sürüm başına zip.                                                    |
| Yıldızlar ve yorumlar    | Topluluk geri bildirimi.                                             |
| Güvenlik taraması özetleri | Ayrıntı sayfaları, kurulum veya indirmeden önce en son tarama durumunu gösterir. |
| Tarayıcı ayrıntı sayfaları | VirusTotal, ClawScan ve statik analiz sonuçlarında derin bağlantılar bulunur. |
| Sahip kurtarma panosu    | Yayımcılar, taramada tutulan kendilerine ait içeriği `/dashboard` üzerinden görebilir. |
| Sahip tarafından istenen yeniden taramalar | Sahipler, yanlış pozitif kurtarma için sınırlı yeniden taramalar isteyebilir. |
| Moderasyon               | Onaylar ve denetimler.                                               |
| CLI dostu API            | Otomasyon ve betik yazımı için uygundur.                             |

## Güvenlik ve moderasyon

ClawHub varsayılan olarak açıktır; herkes Skills yükleyebilir, ancak yayımlamak
için bir GitHub hesabının **en az bir haftalık** olması gerekir. Bu, meşru
katkıda bulunanları engellemeden kötüye kullanımı yavaşlatır.

<AccordionGroup>
  <Accordion title="Güvenlik taramaları">
    ClawHub, yayımlanan Skills ve Plugin sürümleri üzerinde otomatik güvenlik
    denetimleri çalıştırır. Herkese açık ayrıntı sayfaları geçerli sonucu
    özetler ve tarayıcı satırları VirusTotal, ClawScan ve statik analiz için
    ayrılmış ayrıntı sayfalarına bağlantı verir.

    Taramada tutulan veya engellenen sürümler, sahibine `/dashboard` içinde
    görünmeye devam ederken herkese açık katalog ve kurulum yüzeylerinde
    kullanılamayabilir.

  </Accordion>
  <Accordion title="Raporlama">
    - Oturum açmış herhangi bir kullanıcı bir skill'i raporlayabilir.
    - Rapor nedenleri zorunludur ve kaydedilir.
    - Her kullanıcının aynı anda en fazla 20 etkin raporu olabilir.
    - 3'ten fazla benzersiz raporu olan Skills varsayılan olarak otomatik gizlenir.

  </Accordion>
  <Accordion title="Moderasyon">
    - Moderatörler gizli Skills'i görüntüleyebilir, yeniden görünür yapabilir, silebilir veya kullanıcıları yasaklayabilir.
    - Raporlama özelliğinin kötüye kullanılması hesap yasaklarına neden olabilir.
    - Moderatör olmak ister misiniz? OpenClaw Discord'da sorun ve bir moderatör veya bakımcıyla iletişime geçin.

  </Accordion>
</AccordionGroup>

## ClawHub CLI

Buna yalnızca yayımlama/eşitleme gibi kayıt kimliği doğrulanmış iş akışları için
ihtiyacınız vardır.

### Genel seçenekler

<ParamField path="--workdir <dir>" type="string">
  Çalışma dizini. Varsayılan: geçerli dizin; OpenClaw çalışma alanına geri döner.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Workdir'e göreli Skills dizini.
</ParamField>
<ParamField path="--site <url>" type="string">
  Site temel URL'si (tarayıcıyla oturum açma).
</ParamField>
<ParamField path="--registry <url>" type="string">
  Kayıt API temel URL'si.
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

    - `--token <token>` — bir API token'ı yapıştırın.
    - `--label <label>` — tarayıcı oturum açma token'ları için saklanan etiket (varsayılan: `CLI token`).
    - `--no-browser` — tarayıcı açma (`--token` gerektirir).

  </Accordion>
  <Accordion title="Arama">
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

    `package explore` ve `package inspect`, Plugin/paket keşfi ve meta veri incelemesi için ClawHub CLI yüzeyleridir. Yerel OpenClaw kurulumları yine `openclaw plugins install clawhub:<package>` kullanır.

    Seçenekler:

    - `--family skill|code-plugin|bundle-plugin` — paket ailesine göre filtrele.
    - `--official` — yalnızca resmi paketleri göster.
    - `--executes-code` — yalnızca kod çalıştıran paketleri göster.
    - `--version <version>` / `--tag <tag>` — belirli bir paket sürümünü incele.
    - `--versions`, `--files`, `--file <path>` — paket geçmişini ve dosyalarını incele.
    - `--json` — makine tarafından okunabilir çıktı.

  </Accordion>
  <Accordion title="Kur / güncelle / listele">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Seçenekler:

    - `--version <version>` — belirli bir sürümü kur veya o sürüme güncelle (`update` üzerinde yalnızca tek slug).
    - `--force` — klasör zaten varsa veya yerel dosyalar yayımlanmış herhangi bir sürümle eşleşmiyorsa üzerine yaz.
    - `clawhub list`, `.clawhub/lock.json` dosyasını okur.

  </Accordion>
  <Accordion title="Skills yayımla">
    ```bash
    clawhub skill publish <path>
    ```

    Seçenekler:

    - `--slug <slug>` — skill slug'ı.
    - `--name <name>` — görünen ad.
    - `--version <version>` — semver sürümü.
    - `--changelog <text>` — değişiklik günlüğü metni (boş olabilir).
    - `--tags <tags>` — virgülle ayrılmış etiketler (varsayılan: `latest`).

  </Accordion>
  <Accordion title="Plugin'leri yayımla">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` yerel bir klasör, `owner/repo`, `owner/repo@ref` veya bir
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

    Yeniden tarama komutları, oturum açmış bir sahip token'ı gerektirir ve en son
    yayımlanan skill sürümünü veya Plugin sürümünü hedefler. Etkileşimsiz
    çalıştırmalarda `--yes` geçin.

    JSON yanıtları; hedef türünü, adı, sürümü, yeniden tarama durumunu ve
    o sürüm veya yayın için kalan/azami istek sayılarını içerir.

  </Accordion>
  <Accordion title="Sil / silmeyi geri al (sahip veya yönetici)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Eşitle (yereli tara + yeni veya güncellenmiş olanları yayımla)">
    ```bash
    clawhub sync
    ```

    Seçenekler:

    - `--root <dir...>` — ek tarama kökleri.
    - `--all` — istem olmadan her şeyi yükle.
    - `--dry-run` — neyin yükleneceğini göster.
    - `--bump <type>` — güncellemeler için `patch|minor|major` (varsayılan: `patch`).
    - `--changelog <text>` — etkileşimsiz güncellemeler için değişiklik günlüğü.
    - `--tags <tags>` — virgülle ayrılmış etiketler (varsayılan: `latest`).
    - `--concurrency <n>` — kayıt denetimleri (varsayılan: `4`).

  </Accordion>
</AccordionGroup>

## Yaygın iş akışları

<Tabs>
  <Tab title="Ara">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Bir Plugin bul">
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
  <Tab title="Birçok skill eşitle">
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
derlenmiş dosya bulunmadığında hâlâ TypeScript kaynağına geri dönebilir;
ancak derlenmiş çalışma zamanı girişleri başlangıç, doctor ve
Plugin yükleme yollarında çalışma zamanı TypeScript derlemesini önler.

## Sürümleme, lockfile ve telemetri

<AccordionGroup>
  <Accordion title="Sürümleme ve etiketler">
    - Her yayımlama yeni bir **semver** `SkillVersion` oluşturur.
    - Etiketler (`latest` gibi) bir sürümü gösterir; etiketleri taşımak geri almanıza olanak tanır.
    - Değişiklik günlükleri sürüm bazında eklenir ve güncellemeleri eşitlerken veya yayımlarken boş olabilir.

  </Accordion>
  <Accordion title="Yerel değişiklikler ve registry sürümleri">
    Güncellemeler, yerel skill içeriklerini bir içerik karması kullanarak
    registry sürümleriyle karşılaştırır. Yerel dosyalar yayımlanmış
    hiçbir sürümle eşleşmezse CLI üzerine yazmadan önce sorar (veya
    etkileşimsiz çalıştırmalarda `--force` gerektirir).
  </Accordion>
  <Accordion title="Eşitleme taraması ve fallback kökleri">
    `clawhub sync` önce geçerli çalışma dizininizi tarar. Hiç skill
    bulunamazsa bilinen eski konumlara (örneğin `~/openclaw/skills` ve
    `~/.openclaw/skills`) geri döner. Bu, ek bayraklar olmadan eski
    skill yüklemelerini bulmak için tasarlanmıştır.
  </Accordion>
  <Accordion title="Depolama ve lockfile">
    - Yüklü skills, çalışma dizininizin altında `.clawhub/lock.json` içinde kaydedilir.
    - Kimlik doğrulama token'ları ClawHub CLI yapılandırma dosyasında saklanır (`CLAWHUB_CONFIG_PATH` ile geçersiz kılınabilir).

  </Accordion>
  <Accordion title="Telemetri (yükleme sayıları)">
    Oturum açmışken `clawhub sync` çalıştırdığınızda CLI, yükleme
    sayılarını hesaplamak için minimal bir anlık görüntü gönderir. Bunu
    tamamen devre dışı bırakabilirsiniz:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Ortam değişkenleri

| Değişken                      | Etki                                            |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | Site URL'sini geçersiz kılar.                  |
| `CLAWHUB_REGISTRY`            | Registry API URL'sini geçersiz kılar.          |
| `CLAWHUB_CONFIG_PATH`         | CLI'nin token/yapılandırmayı nerede saklayacağını geçersiz kılar. |
| `CLAWHUB_WORKDIR`             | Varsayılan çalışma dizinini geçersiz kılar.    |
| `CLAWHUB_DISABLE_TELEMETRY=1` | `sync` sırasında telemetriyi devre dışı bırakır. |

## İlgili

- [Topluluk Plugin'leri](/tr/plugins/community)
- [Plugin'ler](/tr/tools/plugin)
- [Skills](/tr/tools/skills)
