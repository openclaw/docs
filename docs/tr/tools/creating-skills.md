---
read_when:
    - Çalışma alanınızda yeni bir özel Skill oluşturuyorsunuz
    - SKILL.md tabanlı Skills için hızlı bir başlangıç iş akışına ihtiyacınız var
summary: SKILL.md ile özel çalışma alanı Skills öğeleri oluşturun ve test edin
title: Skills Oluşturma
x-i18n:
    generated_at: "2026-04-05T14:10:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 747cebc5191b96311d1d6760bede1785a099acd7633a0b88de6b7882b57e1db6
    source_path: tools/creating-skills.md
    workflow: 15
---

# Skills Oluşturma

Skills, aracıya araçları nasıl ve ne zaman kullanacağını öğretir. Her Skill, YAML frontmatter ve markdown yönergeleri içeren bir `SKILL.md` dosyası barındıran bir dizindir.

Skills öğelerinin nasıl yüklendiği ve önceliklendirildiği için bkz. [Skills](/tools/skills).

## İlk Skill'inizi oluşturun

<Steps>
  <Step title="Skill dizinini oluşturun">
    Skills, çalışma alanınızda bulunur. Yeni bir klasör oluşturun:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="SKILL.md yazın">
    Bu dizin içinde `SKILL.md` oluşturun. Frontmatter meta verileri tanımlar,
    markdown gövdesi ise aracı için yönergeleri içerir.

    ```markdown
    ---
    name: hello_world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

  </Step>

  <Step title="Araçlar ekleyin (isteğe bağlı)">
    Frontmatter içinde özel araç şemaları tanımlayabilir veya aracıya mevcut sistem araçlarını (`exec` veya `browser` gibi) kullanmasını söyleyebilirsiniz. Skills ayrıca belgeledikleri araçlarla birlikte plugin'lerin içinde de dağıtılabilir.

  </Step>

  <Step title="Skill'i yükleyin">
    OpenClaw'ın Skill'i algılaması için yeni bir oturum başlatın:

    ```bash
    # Sohbetten
    /new

    # Veya gateway'i yeniden başlatın
    openclaw gateway restart
    ```

    Skill'in yüklendiğini doğrulayın:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="Test edin">
    Skill'i tetiklemesi gereken bir mesaj gönderin:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Veya aracıyla sohbet edin ve ondan bir selamlama isteyin.

  </Step>
</Steps>

## Skill meta veri başvurusu

YAML frontmatter şu alanları destekler:

| Field                               | Required | Description                                  |
| ----------------------------------- | -------- | -------------------------------------------- |
| `name`                              | Evet     | Benzersiz tanımlayıcı (`snake_case`)         |
| `description`                       | Evet     | Aracıya gösterilen tek satırlık açıklama     |
| `metadata.openclaw.os`              | Hayır    | OS filtresi (`["darwin"]`, `["linux"]` vb.)  |
| `metadata.openclaw.requires.bins`   | Hayır    | PATH üzerinde gerekli ikili dosyalar         |
| `metadata.openclaw.requires.config` | Hayır    | Gerekli yapılandırma anahtarları             |

## En iyi uygulamalar

- **Kısa olun** — modele bir AI gibi nasıl davranacağını değil, _ne_ yapacağını söyleyin
- **Önce güvenlik** — Skill'iniz `exec` kullanıyorsa, istemlerin güvenilmeyen girdiden rastgele komut enjeksiyonuna izin vermediğinden emin olun
- **Yerelde test edin** — paylaşmadan önce test etmek için `openclaw agent --message "..."` kullanın
- **ClawHub kullanın** — [ClawHub](https://clawhub.ai) üzerinde Skills öğelerine göz atın ve katkıda bulunun

## Skills nerede bulunur

| Location                        | Öncelik   | Kapsam                 |
| ------------------------------- | --------- | ---------------------- |
| `\<workspace\>/skills/`         | En yüksek | Aracı başına           |
| `\<workspace\>/.agents/skills/` | Yüksek    | Çalışma alanı aracısı başına |
| `~/.agents/skills/`             | Orta      | Paylaşılan aracı profili |
| `~/.openclaw/skills/`           | Orta      | Paylaşılan (tüm aracılar) |
| Paketlenmiş (OpenClaw ile gelir) | Düşük    | Genel                  |
| `skills.load.extraDirs`         | En düşük  | Özel paylaşılan klasörler |

## İlgili

- [Skills başvurusu](/tools/skills) — yükleme, öncelik ve geçitleme kuralları
- [Skills yapılandırması](/tools/skills-config) — `skills.*` yapılandırma şeması
- [ClawHub](/tools/clawhub) — genel Skill kayıt defteri
- [Plugin Geliştirme](/tr/plugins/building-plugins) — plugin'ler Skills dağıtabilir
