---
read_when:
    - Yeni bir özel skill oluşturuyorsunuz
    - SKILL.md tabanlı Skills için hızlı bir başlangıç iş akışına ihtiyacınız var
    - Temsilci incelemesi için bir Skills önermek üzere Skill Workshop'u kullanmak istiyorsunuz
sidebarTitle: Creating skills
summary: OpenClaw ajanlarınız için özel SKILL.md çalışma alanı Skills'lerini oluşturun, test edin ve yayımlayın.
title: Skills oluşturma
x-i18n:
    generated_at: "2026-07-12T12:47:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cba2aa863ebd083d4592e8a764dbdc2c30a0dd8aff49d273927e82df0069bc81
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills, ajana araçları nasıl ve ne zaman kullanacağını öğretir. Her Skill, YAML ön maddesi ve Markdown talimatları içeren bir `SKILL.md` dosyasının bulunduğu bir dizindir.
OpenClaw, Skills öğelerini tanımlı bir [öncelik sırasına](/tr/tools/skills#loading-order) göre çeşitli köklerden yükler.

## İlk Skill'inizi oluşturun

<Steps>
  <Step title="Skill dizinini oluşturun">
    Skills, çalışma alanınızdaki `skills/` klasöründe bulunur:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    Düzen sağlamak için Skills öğelerini alt klasörlerde gruplayabilirsiniz; Skill yine de
    klasör yoluna göre değil, `SKILL.md` ön maddesine göre adlandırılır:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # Skill adı yine "hello-world" olur ve /hello-world olarak çağrılır
    ```

  </Step>

  <Step title="SKILL.md dosyasını yazın">
    Ön madde, meta verileri tanımlar; gövde ise ajana talimatları verir.

    ```markdown
    ---
    name: hello-world
    description: Selamlama yazdıran basit bir Skill.
    ---

    # Merhaba Dünya

    Kullanıcı selamlama istediğinde şunu çalıştırmak için `exec` aracını kullanın:

    ```bash
    echo "Özel Skill'inizden merhaba!"
    ```
    ```

    Adlandırma kuralları:
    - `name` için küçük harfler, rakamlar ve kısa çizgiler kullanın.
    - Dizin adıyla ön maddedeki `name` değerini aynı tutun.
    - `description`, ajana ve eğik çizgi komutu keşfinde gösterilir;
      tek satır ve 160 karakterden kısa tutun.

  </Step>

  <Step title="Skill'in yüklendiğini doğrulayın">
    ```bash
    openclaw skills list
    ```

    OpenClaw, Skills kökleri altındaki `SKILL.md` dosyalarını varsayılan olarak izler. İzleyici
    devre dışıysa veya mevcut bir oturuma devam ediyorsanız ajanın yenilenen listeyi
    alması için yeni bir oturum başlatın:

    ```bash
    # Sohbetten — mevcut oturumu arşivleyip yeni bir oturum başlatın
    /new

    # Veya Gateway'i yeniden başlatın
    openclaw gateway restart
    ```

  </Step>

  <Step title="Test edin">
    ```bash
    openclaw agent --message "bana bir selamlama ver"
    ```

    Alternatif olarak bir sohbet açıp doğrudan ajandan isteyin. Adıyla açıkça
    çağırmak için `/skill hello-world` kullanın.

  </Step>
</Steps>

## SKILL.md başvurusu

### Zorunlu alanlar

| Alan          | Açıklama                                                               |
| ------------- | ---------------------------------------------------------------------- |
| `name`        | Küçük harfler, rakamlar ve kısa çizgiler kullanan benzersiz kısa ad    |
| `description` | Ajana ve keşif çıktısında gösterilen tek satırlık açıklama              |

### İsteğe bağlı ön madde anahtarları

| Alan                       | Varsayılan | Açıklama                                                                                         |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `user-invocable`           | `true`     | Skill'i kullanıcı eğik çizgi komutu olarak kullanıma sunar                                       |
| `disable-model-invocation` | `false`    | Skill'i ajanın sistem isteminin dışında tutar (`/skill` aracılığıyla yine çalışır)                |
| `command-dispatch`         | —          | Modeli atlayarak eğik çizgi komutunu doğrudan bir araca yönlendirmek için `tool` olarak ayarlanır |
| `command-tool`             | —          | `command-dispatch: tool` ayarlandığında çağrılacak araç adı                                      |
| `command-arg-mode`         | `raw`      | Araç yönlendirmesinde ham bağımsız değişken dizesini araca iletir                                 |
| `homepage`                 | —          | macOS Skills arayüzünde "Website" olarak gösterilen URL                                           |

Geçiş koşulu alanları (`requires.bins`, `requires.env` vb.) için
[Skills — Geçiş Koşulları](/tr/tools/skills#gating) bölümüne bakın.

### `{baseDir}` kullanımı

Yolları sabit kodlamadan Skill dizini içindeki dosyalara başvurun; ajan
`{baseDir}` değerini Skill'in kendi dizinine göre çözümler:

```markdown
`{baseDir}/scripts/run.sh` konumundaki yardımcı betiği çalıştırın.
```

## Koşullu etkinleştirme ekleme

Skill'inizi yalnızca bağımlılıkları kullanılabilir olduğunda yüklenecek şekilde koşullandırın:

```markdown
---
name: gemini-search
description: Gemini CLI kullanarak arama yapar.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="Geçiş koşulu seçenekleri">
    | Anahtar | Açıklama |
    | --- | --- |
    | `requires.bins` | Tüm ikili dosyalar `PATH` üzerinde bulunmalıdır |
    | `requires.anyBins` | En az bir ikili dosya `PATH` üzerinde bulunmalıdır |
    | `requires.env` | Her ortam değişkeni süreçte veya yapılandırmada bulunmalıdır |
    | `requires.config` | Her `openclaw.json` yolu doğruluk değeri taşımalıdır |
    | `os` | Platform filtresi: `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | Tüm geçiş koşullarını atlayıp Skill'i her zaman dahil etmek için `true` olarak ayarlayın |

    Tam başvuru: [Skills — Geçiş Koşulları](/tr/tools/skills#gating).

  </Accordion>
  <Accordion title="Ortam ve API anahtarları">
    Bir API anahtarını `openclaw.json` içindeki bir Skill girdisine bağlayın:

    ```json5
    {
      skills: {
        entries: {
          "gemini-search": {
            enabled: true,
            apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
          },
        },
      },
    }
    ```

    Anahtar yalnızca ilgili ajan turu için ana sürece eklenir.
    Korumalı alana ulaşmaz; bkz.
    [korumalı alan ortam değişkenleri](/tr/tools/skills-config#sandboxed-skills-and-env-vars).

  </Accordion>
</AccordionGroup>

## Skill Workshop aracılığıyla önerin

Ajan tarafından taslak hâline getirilen Skills için veya bir Skill kullanıma
alınmadan önce operatör incelemesi istediğinizde doğrudan `SKILL.md` yazmak yerine
[Skill Workshop](/tr/tools/skill-workshop) önerilerini kullanın.

```bash
# Yepyeni bir Skill önerin
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "Selamlama yazdıran basit bir Skill." \
  --proposal ./PROPOSAL.md

# Mevcut bir Skill için güncelleme önerin
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "Güncellenmiş selamlama Skill'i"
```

Öneri destek dosyaları içeriyorsa `--proposal-dir` kullanın:

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "Selamlama yazdıran basit bir Skill." \
  --proposal-dir ./hello-world-proposal/
```

Dizinin kökünde `PROPOSAL.md` bulunmalıdır. Destek dosyaları
`assets/`, `examples/`, `references/`, `scripts/` veya `templates/` altında yer alır.

İncelemeden sonra:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Önerinin tam yaşam döngüsü için [Skill Workshop](/tr/tools/skill-workshop) bölümüne bakın.

## ClawHub'da yayımlama

<Steps>
  <Step title="SKILL.md dosyanızın eksiksiz olduğundan emin olun">
    `name`, `description` ve tüm `metadata.openclaw` geçiş koşulu alanlarının
    ayarlandığından emin olun. Bir proje sayfanız varsa `homepage` URL'si ekleyin.
  </Step>
  <Step title="Bağımsız ClawHub CLI'yi yükleyip oturum açın">
    ```bash
    npm i -g clawhub
    clawhub login
    ```
  </Step>
  <Step title="Yayımlayın">
    ```bash
    clawhub skill publish ./path/to/hello-world
    ```

    Çıkarılan sürümü geçersiz kılmak veya belirli bir sahip altında yayımlamak için
    `--version <version>` ya da `--owner <owner>` ekleyin. Tam akış, sahip kapsamı ve
    diğer bakım komutları (`clawhub sync`, `clawhub skill rename`, ...) için
    [ClawHub — Yayımlama](/tr/clawhub/publishing) ve
    [ClawHub CLI](/tr/clawhub/cli) bölümlerine bakın.

  </Step>
</Steps>

## En iyi uygulamalar

<Tip>
  - **Kısa ve öz olun** — modele yapay zekâ olmayı değil, *ne* yapacağını açıklayın.
  - **Önce güvenlik** — Skill'iniz `exec` kullanıyorsa istemlerin güvenilmeyen girdilerden
    rastgele komut eklenmesine izin vermediğinden emin olun.
  - **Yerel olarak test edin** — paylaşmadan önce `openclaw agent --message "..."` kullanın.
  - **ClawHub'ı kullanın** — sıfırdan geliştirmeden önce topluluk Skills öğelerine
    [clawhub.ai](https://clawhub.ai) adresinden göz atın.
</Tip>

## İlgili konular

<CardGroup cols={2}>
  <Card title="Skills başvurusu" href="/tr/tools/skills" icon="puzzle-piece">
    Yükleme sırası, geçiş koşulları, izin listeleri ve SKILL.md biçimi.
  </Card>
  <Card title="Skill Workshop" href="/tr/tools/skill-workshop" icon="flask">
    Ajan tarafından taslak hâline getirilen Skills için öneri kuyruğu.
  </Card>
  <Card title="Skills yapılandırması" href="/tr/tools/skills-config" icon="gear">
    Eksiksiz `skills.*` yapılandırma şeması.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Herkese açık kayıt defterinde Skills öğelerine göz atın ve bunları yayımlayın.
  </Card>
  <Card title="Plugin geliştirme" href="/tr/plugins/building-plugins" icon="plug">
    Plugin'ler, belgeledikleri araçlarla birlikte Skills sunabilir.
  </Card>
</CardGroup>
