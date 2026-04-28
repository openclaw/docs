---
read_when:
    - Skills veya Plugin arama, kurma ya da güncelleme
    - Skills veya Plugin'leri kayıt defterine yayımlama
    - clawhub CLI'yi veya ortam geçersiz kılmalarını yapılandırma
sidebarTitle: ClawHub
summary: 'ClawHub: OpenClaw Skills ve Plugin''leri için herkese açık kayıt defteri, yerel kurulum akışları ve clawhub CLI'
title: ClawHub
x-i18n:
    generated_at: "2026-04-26T11:41:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e002bb56b643bfdfb5715ac3632d854df182475be632ebe36c46d04008cf6e5
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHub, **OpenClaw Skills ve Plugin'leri** için herkese açık kayıt defteridir.

- Skills aramak, kurmak ve güncellemek; ayrıca ClawHub'dan Plugin kurmak için yerel `openclaw` komutlarını kullanın.
- Kayıt defteri auth'u, yayımlama, silme/geri alma ve eşzamanlama iş akışları için ayrı `clawhub` CLI'yi kullanın.

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
    Yeni bir OpenClaw oturumu başlatın — yeni skill'i alır.
  </Step>
  <Step title="Yayımla (isteğe bağlı)">
    Kayıt defteri kimlik doğrulamalı iş akışları için (yayımlama, eşzamanlama, yönetim),
    ayrı `clawhub` CLI'yi kurun:

    ```bash
    npm i -g clawhub
    # veya
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
    kaynak meta verilerini kalıcı olarak yazar; böylece daha sonraki `update` çağrıları ClawHub üzerinde kalabilir.

  </Tab>
  <Tab title="Plugin'ler">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    Düz npm-güvenli Plugin spec değerleri de npm'den önce ClawHub'a karşı denenir:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    Plugin kurulumları, arşiv kurulumu çalışmadan önce ilan edilen `pluginApi` ve
    `minGatewayVersion` uyumluluğunu doğrular; böylece uyumsuz hostlar
    paketi kısmen kurmak yerine erkenden kapalı kalacak şekilde başarısız olur.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` yalnızca kurulabilir Plugin
ailelerini kabul eder. Bir ClawHub paketi aslında bir skill ise OpenClaw durur ve
sizi bunun yerine `openclaw skills install <slug>` komutuna yönlendirir.

Anonim ClawHub Plugin kurulumları özel paketler için de kapalı kalacak şekilde başarısız olur.
Topluluk veya diğer resmî olmayan kanallar yine de kurulabilir, ancak OpenClaw
operatörlerin etkinleştirmeden önce kaynağı ve doğrulamayı inceleyebilmesi için uyarır.
</Note>

## ClawHub nedir

- OpenClaw Skills ve Plugin'leri için herkese açık bir kayıt defteri.
- Skill paketleri ve meta verileri için sürümlü bir depo.
- Arama, etiketler ve kullanım sinyalleri için bir keşif yüzeyi.

Tipik bir skill, şu öğeleri içeren sürümlü bir dosya paketidir:

- Birincil açıklama ve kullanım için bir `SKILL.md` dosyası.
- Skill tarafından kullanılan isteğe bağlı yapılandırmalar, betikler veya destekleyici dosyalar.
- Etiketler, özet ve kurulum gereksinimleri gibi meta veriler.

ClawHub, keşfi desteklemek ve skill
yeteneklerini güvenli biçimde açığa çıkarmak için meta verileri kullanır. Kayıt defteri sıralamayı ve görünürlüğü
iyileştirmek için kullanım sinyallerini (yıldızlar, indirmeler) izler. Her yayımlama yeni bir semver
sürümü oluşturur ve kayıt defteri sürüm geçmişini tutar, böylece kullanıcılar
değişiklikleri denetleyebilir.

## Çalışma alanı ve skill yükleme

Ayrı `clawhub` CLI ayrıca mevcut çalışma dizininiz altında
`./skills` içine de Skills kurar. Bir OpenClaw çalışma alanı yapılandırılmışsa,
`clawhub`, siz `--workdir`
(veya `CLAWHUB_WORKDIR`) ile geçersiz kılmadıkça o çalışma alanına geri döner. OpenClaw çalışma alanı Skills'ini
`<workspace>/skills` içinden yükler ve bunları **bir sonraki** oturumda alır.

Zaten `~/.openclaw/skills` veya paketlenmiş Skills kullanıyorsanız,
çalışma alanı Skills'i önceliklidir. Skills'in nasıl yüklendiği,
paylaşıldığı ve geçitlendiği hakkında daha fazla ayrıntı için bkz. [Skills](/tr/tools/skills).

## Hizmet özellikleri

| Özellik            | Notlar                                                     |
| ------------------ | ---------------------------------------------------------- |
| Herkese açık gezinti | Skills ve bunların `SKILL.md` içerikleri herkese açıktır. |
| Arama              | Yalnızca anahtar sözcük değil, embedding desteklidir (vektör arama). |
| Sürümleme          | Semver, changelog'lar ve etiketler (`latest` dahil).      |
| İndirmeler         | Sürüm başına Zip.                                         |
| Yıldızlar ve yorumlar | Topluluk geri bildirimi.                               |
| Moderasyon         | Onaylar ve denetimler.                                    |
| CLI dostu API      | Otomasyon ve betikleme için uygundur.                     |

## Güvenlik ve moderasyon

ClawHub varsayılan olarak açıktır — herkes Skills yükleyebilir, ancak yayımlama için GitHub
hesabının **en az bir haftalık** olması gerekir. Bu, meşru katkıcıları engellemeden
kötüye kullanımı yavaşlatır.

<AccordionGroup>
  <Accordion title="Bildirme">
    - Oturum açmış her kullanıcı bir skill'i bildirebilir.
    - Bildirim nedenleri zorunludur ve kaydedilir.
    - Her kullanıcının aynı anda en fazla 20 etkin bildirimi olabilir.
    - 3'ten fazla benzersiz bildirimi olan Skills varsayılan olarak otomatik gizlenir.

  </Accordion>
  <Accordion title="Moderasyon">
    - Moderatörler gizli Skills'i görebilir, görünür yapabilir, silebilir veya kullanıcıları yasaklayabilir.
    - Bildirim özelliğini kötüye kullanmak hesap yasaklarına yol açabilir.
    - Moderatör olmakla mı ilgileniyorsunuz? OpenClaw Discord'da sorun ve bir moderatör veya bakımcıyla iletişime geçin.

  </Accordion>
</AccordionGroup>

## ClawHub CLI

Buna yalnızca yayımlama/eşzamanlama gibi kayıt defteri kimlik doğrulamalı iş akışları için ihtiyacınız vardır.

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
  Registry API temel URL'si.
</ParamField>
<ParamField path="--no-input" type="boolean">
  İstemleri devre dışı bırak (etkileşimsiz).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  CLI sürümünü yazdır.
</ParamField>

### Komutlar

<AccordionGroup>
  <Accordion title="Auth (login / logout / whoami)">
    ```bash
    clawhub login              # tarayıcı akışı
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Oturum açma seçenekleri:

    - `--token <token>` — bir API token yapıştırın.
    - `--label <label>` — tarayıcı oturum açma token'ları için saklanan etiket (varsayılan: `CLI token`).
    - `--no-browser` — tarayıcı açma (`--token` gerektirir).

  </Accordion>
  <Accordion title="Ara">
    ```bash
    clawhub search "query"
    ```

    - `--limit <n>` — en fazla sonuç.

  </Accordion>
  <Accordion title="Kur / güncelle / listele">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Seçenekler:

    - `--version <version>` — belirli bir sürüme kur veya güncelle (`update` üzerinde yalnızca tek slug için).
    - `--force` — klasör zaten varsa veya yerel dosyalar yayımlanmış hiçbir sürümle eşleşmiyorsa üzerine yaz.
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
    - `--changelog <text>` — changelog metni (boş olabilir).
    - `--tags <tags>` — virgülle ayrılmış etiketler (varsayılan: `latest`).

  </Accordion>
  <Accordion title="Plugin'ler yayımla">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` yerel bir klasör, `owner/repo`, `owner/repo@ref` veya bir
    GitHub URL'si olabilir.

    Seçenekler:

    - `--dry-run` — hiçbir şey yüklemeden tam yayımlama planını derle.
    - `--json` — CI için makine tarafından okunabilir çıktı üret.
    - `--source-repo`, `--source-commit`, `--source-ref` — otomatik algılama yeterli olmadığında isteğe bağlı geçersiz kılmalar.

  </Accordion>
  <Accordion title="Sil / geri al (sahip veya yönetici)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Eşzamanla (yereli tara + yeni veya güncellenmiş olanları yayımla)">
    ```bash
    clawhub sync
    ```

    Seçenekler:

    - `--root <dir...>` — ek tarama kökleri.
    - `--all` — istem yapmadan her şeyi yükle.
    - `--dry-run` — neyin yükleneceğini göster.
    - `--bump <type>` — güncellemeler için `patch|minor|major` (varsayılan: `patch`).
    - `--changelog <text>` — etkileşimsiz güncellemeler için changelog.
    - `--tags <tags>` — virgülle ayrılmış etiketler (varsayılan: `latest`).
    - `--concurrency <n>` — registry denetimleri (varsayılan: `4`).

  </Accordion>
</AccordionGroup>

## Yaygın iş akışları

<Tabs>
  <Tab title="Ara">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Kur">
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
  <Tab title="Birçok skill'i eşzamanla">
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

### Plugin paket meta verileri

Kod Plugin'leri, gerekli OpenClaw meta verilerini
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

Yayımlanan paketler **derlenmiş JavaScript** göndermeli ve
`runtimeExtensions` değerini o çıktıya yönlendirmelidir. Git checkout kurulumları,
derlenmiş dosya yoksa yine TypeScript kaynağına geri dönebilir, ancak derlenmiş çalışma zamanı
girdileri başlangıç, doctor ve
Plugin yükleme yollarında çalışma zamanı TypeScript derlemesini önler.

## Sürümleme, lockfile ve telemetri

<AccordionGroup>
  <Accordion title="Sürümleme ve etiketler">
    - Her yayımlama yeni bir **semver** `SkillVersion` oluşturur.
    - Etiketler (`latest` gibi) bir sürümü işaret eder; etiketleri taşımak geri alma yapmanızı sağlar.
    - Changelog'lar sürüm başına eklenir ve eşzamanlama veya güncelleme yayımlarken boş olabilir.

  </Accordion>
  <Accordion title="Yerel değişiklikler ve kayıt defteri sürümleri">
    Güncellemeler, içerik karması kullanarak yerel skill içeriğini kayıt defteri sürümleriyle karşılaştırır. Yerel dosyalar yayımlanmış hiçbir sürümle eşleşmiyorsa, CLI üzerine yazmadan önce sorar (veya
    etkileşimsiz çalıştırmalarda `--force` gerektirir).
  </Accordion>
  <Accordion title="Eşzaman taraması ve geri dönüş kökleri">
    `clawhub sync` önce geçerli workdir'inizi tarar. Hiç skill
    bulunmazsa bilinen eski konumlara (örneğin
    `~/openclaw/skills` ve `~/.openclaw/skills`) geri döner. Bu, ek bayraklar olmadan
    daha eski skill kurulumlarını bulmak için tasarlanmıştır.
  </Accordion>
  <Accordion title="Depolama ve lockfile">
    - Kurulu Skills, workdir'iniz altındaki `.clawhub/lock.json` içinde kaydedilir.
    - Auth token'ları ClawHub CLI yapılandırma dosyasında saklanır (`CLAWHUB_CONFIG_PATH` ile geçersiz kılınabilir).

  </Accordion>
  <Accordion title="Telemetri (kurulum sayıları)">
    Oturum açmış halde `clawhub sync` çalıştırdığınızda, CLI kurulum sayılarını hesaplamak için en az düzeyde
    bir anlık görüntü gönderir. Bunu tamamen devre dışı bırakabilirsiniz:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Ortam değişkenleri

| Değişken                     | Etki                                                |
| ---------------------------- | --------------------------------------------------- |
| `CLAWHUB_SITE`               | Site URL'sini geçersiz kılar.                       |
| `CLAWHUB_REGISTRY`           | Registry API URL'sini geçersiz kılar.               |
| `CLAWHUB_CONFIG_PATH`        | CLI'nin token/yapılandırmayı nerede saklayacağını geçersiz kılar. |
| `CLAWHUB_WORKDIR`            | Varsayılan workdir'i geçersiz kılar.                |
| `CLAWHUB_DISABLE_TELEMETRY=1`| `sync` üzerindeki telemetriyi devre dışı bırakır.   |

## İlgili

- [Topluluk Plugin'leri](/tr/plugins/community)
- [Plugin'ler](/tr/tools/plugin)
- [Skills](/tr/tools/skills)
