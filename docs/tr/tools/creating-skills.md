---
read_when:
    - Yeni bir özel skill oluşturuyorsunuz
    - SKILL.md tabanlı Skills için hızlı bir başlangıç iş akışına ihtiyacınız var
    - Aracı incelemesi için bir skill önermek üzere Skill Workshop kullanmak istiyorsunuz
sidebarTitle: Creating skills
summary: OpenClaw ajanlarınız için özel SKILL.md çalışma alanı Skills'lerini oluşturun, test edin ve yayımlayın.
title: Skills oluşturma
x-i18n:
    generated_at: "2026-06-28T01:21:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a744e9010c66b8465449d24430520473717edde86711bbb59774519189b9e72
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills, ajana araçları nasıl ve ne zaman kullanacağını öğretir. Her skill, YAML frontmatter ve markdown yönergeleri içeren bir `SKILL.md` dosyasına sahip bir dizindir.
OpenClaw, skill'leri tanımlı bir [öncelik sırasına](/tr/tools/skills#loading-order) göre birkaç kökten yükler.

## İlk skill'inizi oluşturun

<Steps>
  <Step title="Create the skill directory">
    Skills, çalışma alanınızdaki `skills/` klasöründe bulunur. Yeni
    skill'iniz için bir dizin oluşturun:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    Düzen için skill'leri alt klasörlerde gruplayabilirsiniz — skill yine
    klasör yoluna göre değil, `SKILL.md` frontmatter'ındaki adla adlandırılır:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # skill name is still "hello-world", invoked as /hello-world
    ```

  </Step>

  <Step title="Write SKILL.md">
    Dizin içinde `SKILL.md` oluşturun. Frontmatter metadata'yı tanımlar;
    gövde ajana yönergeleri verir.

    ```markdown
    ---
    name: hello-world
    description: A simple skill that prints a greeting.
    ---

    # Hello World

    When the user asks for a greeting, use the `exec` tool to run:

    ```bash
    echo "Hello from your custom skill!"
    ```
    ```

    Adlandırma kuralları:
    - `name` için küçük harfler, rakamlar ve kısa çizgiler kullanın.
    - Dizin adını ve frontmatter `name` değerini uyumlu tutun.
    - `description` ajana ve slash-command keşfinde gösterilir —
      tek satır ve 160 karakterin altında tutun.

  </Step>

  <Step title="Verify the skill loaded">
    ```bash
    openclaw skills list
    ```

    OpenClaw varsayılan olarak skill kökleri altındaki `SKILL.md` dosyalarını izler. İzleyici devre dışıysa veya mevcut bir oturuma devam ediyorsanız, ajanın yenilenmiş listeyi alması için yeni bir oturum başlatın:

    ```bash
    # From chat — archive current session and start fresh
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="Test it">
    Skill'i tetiklemesi gereken bir mesaj gönderin:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Ya da bir sohbet açıp ajana doğrudan sorun. Adıyla açıkça çağırmak için
    `/skill hello-world` kullanın.

  </Step>
</Steps>

## SKILL.md başvurusu

### Zorunlu alanlar

| Alan          | Açıklama                                                       |
| ------------- | -------------------------------------------------------------- |
| `name`        | Küçük harfler, rakamlar ve kısa çizgiler kullanan benzersiz slug |
| `description` | Ajana ve keşif çıktısında gösterilen tek satırlık açıklama     |

### İsteğe bağlı frontmatter anahtarları

| Alan                       | Varsayılan | Açıklama                                                                    |
| -------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `user-invocable`           | `true`     | Skill'i kullanıcı slash command olarak gösterir                              |
| `disable-model-invocation` | `false`    | Skill'i ajanın system prompt'undan çıkarır (`/skill` ile yine çalışır)       |
| `command-dispatch`         | —          | Slash command'ı modeli atlayarak doğrudan bir araca yönlendirmek için `tool` olarak ayarlayın |
| `command-tool`             | —          | `command-dispatch: tool` ayarlandığında çağrılacak araç adı                  |
| `command-arg-mode`         | `raw`      | Araç yönlendirmesi için ham argüman dizesini araca iletir                    |
| `homepage`                 | —          | macOS Skills kullanıcı arayüzünde "Website" olarak gösterilen URL           |

Geçit alanları (`requires.bins`, `requires.env` vb.) için
[Skills — Gating](/tr/tools/skills#gating) bölümüne bakın.

### `{baseDir}` kullanımı

Skill gövdesinde, yolları sabit yazmadan skill dizini içindeki dosyalara
başvurmak için `{baseDir}` kullanın:

```markdown
Run the helper script at `{baseDir}/scripts/run.sh`.
```

## Koşullu etkinleştirme ekleme

Skill'inizi yalnızca bağımlılıkları mevcut olduğunda yüklenecek şekilde geçide alın:

```markdown
---
name: gemini-search
description: Search using Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="Gating options">
    | Anahtar | Açıklama |
    | --- | --- |
    | `requires.bins` | Tüm ikili dosyalar `PATH` üzerinde mevcut olmalıdır |
    | `requires.anyBins` | En az bir ikili dosya `PATH` üzerinde mevcut olmalıdır |
    | `requires.env` | Her env var işlemde veya yapılandırmada mevcut olmalıdır |
    | `requires.config` | Her `openclaw.json` yolu truthy olmalıdır |
    | `os` | Platform filtresi: `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | Tüm geçitleri atlayıp skill'i her zaman dahil etmek için `true` olarak ayarlayın |

    Tam başvuru: [Skills — Gating](/tr/tools/skills#gating).

  </Accordion>
  <Accordion title="Environment and API keys">
    `openclaw.json` içinde bir API anahtarını skill girdisine bağlayın:

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

    Anahtar yalnızca o ajan turu için host işlemine enjekte edilir.
    Sandbox'a ulaşmaz — bkz.
    [sandbox env var'ları](/tr/tools/skills-config#sandboxed-skills-and-env-vars).

  </Accordion>
</AccordionGroup>

## Skill Workshop üzerinden önerin

Ajan tarafından taslaklanan skill'ler için veya bir skill canlıya alınmadan önce operatör incelemesi istediğinizde, doğrudan `SKILL.md` yazmak yerine [Skill Workshop](/tr/tools/skill-workshop) önerilerini kullanın.

```bash
# Propose a brand-new skill
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal ./PROPOSAL.md

# Propose an update to an existing skill
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "Updated greeting skill"
```

Öneri destek dosyaları içerdiğinde `--proposal-dir` kullanın:

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal-dir ./hello-world-proposal/
```

Dizin `PROPOSAL.md` içermelidir. Destek dosyaları `assets/`,
`examples/`, `references/`, `scripts/` veya `templates/` içine konabilir.

İncelemeden sonra:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Tam öneri yaşam döngüsü için [Skill Workshop](/tr/tools/skill-workshop) bölümüne bakın.

## ClawHub'a yayımlama

<Steps>
  <Step title="Ensure your SKILL.md is complete">
    `name`, `description` ve varsa `metadata.openclaw` geçit alanlarının
    ayarlandığından emin olun. Bir proje sayfanız varsa `homepage` URL'si ekleyin.
  </Step>
  <Step title="Install the ClawHub skill">
    ClawHub skill'i, geçerli yayımlama komutu biçimini ve gerekli
    metadata'yı belgeler:

    ```bash
    openclaw skills install @openclaw/clawhub-publish
    ```

  </Step>
  <Step title="Publish">
    ```bash
    clawhub publish
    ```

    Tam akış için [ClawHub — Publishing](/tr/clawhub/publishing) bölümüne bakın.

  </Step>
</Steps>

## En iyi uygulamalar

<Tip>
  - **Kısa ve öz olun** — modele bir yapay zeka olarak nasıl davranacağını değil, *ne* yapacağını söyleyin.
  - **Önce güvenlik** — skill'iniz `exec` kullanıyorsa, prompt'ların güvenilmeyen girdiden rastgele komut enjeksiyonuna izin vermediğinden emin olun.
  - **Yerelde test edin** — paylaşmadan önce `openclaw agent --message "..."` kullanın.
  - **ClawHub kullanın** — sıfırdan oluşturmadan önce [clawhub.ai](https://clawhub.ai) adresinde topluluk skill'lerine göz atın.
</Tip>

## İlgili

<CardGroup cols={2}>
  <Card title="Skills reference" href="/tr/tools/skills" icon="puzzle-piece">
    Yükleme sırası, geçitler, izin listeleri ve SKILL.md biçimi.
  </Card>
  <Card title="Skill Workshop" href="/tr/tools/skill-workshop" icon="flask">
    Ajan tarafından taslaklanan skill'ler için öneri kuyruğu.
  </Card>
  <Card title="Skills config" href="/tr/tools/skills-config" icon="gear">
    Tam `skills.*` yapılandırma şeması.
  </Card>
  <Card title="ClawHub" href="/tr/clawhub" icon="cloud">
    Genel registry'de skill'lere göz atın ve yayımlayın.
  </Card>
  <Card title="Building plugins" href="/tr/plugins/building-plugins" icon="plug">
    Plugins, belgeledikleri araçlarla birlikte skill'ler gönderebilir.
  </Card>
</CardGroup>
