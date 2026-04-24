---
read_when:
    - Çalışma alanınızda yeni bir özel Skill oluşturuyorsunuz
    - '`SKILL.md` tabanlı Skills için hızlı bir başlangıç iş akışına ihtiyacınız var'
summary: '`SKILL.md` ile özel çalışma alanı Skills’leri oluşturma ve test etme'
title: Skills oluşturma
x-i18n:
    generated_at: "2026-04-24T09:33:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: df9249e14936c65143580a6618679cf2d79a2960390e5c7afc5dbea1a9a6e045
    source_path: tools/creating-skills.md
    workflow: 15
---

Skills, ajana araçları nasıl ve ne zaman kullanacağını öğretir. Her Skill, YAML frontmatter ve Markdown talimatları içeren bir `SKILL.md` dosyası barındıran bir dizindir.

Skills’in nasıl yüklendiği ve önceliklendirildiği için bkz. [Skills](/tr/tools/skills).

## İlk Skill’inizi oluşturun

<Steps>
  <Step title="Skill dizinini oluşturun">
    Skills çalışma alanınızda bulunur. Yeni bir klasör oluşturun:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="SKILL.md yazın">
    Bu dizin içinde `SKILL.md` oluşturun. Frontmatter meta verileri tanımlar,
    Markdown gövdesi ise ajan için talimatları içerir.

    ```markdown
    ---
    name: hello_world
    description: Merhaba diyen basit bir skill.
    ---

    # Hello World Skill

    Kullanıcı bir selamlama istediğinde, `echo` aracını kullanarak
    "Özel skill’inizden merhaba!" deyin.
    ```

  </Step>

  <Step title="Araç ekleyin (isteğe bağlı)">
    Frontmatter içinde özel araç şemaları tanımlayabilir veya ajanı
    mevcut sistem araçlarını (`exec` veya `browser` gibi) kullanması için yönlendirebilirsiniz. Skills, belgeledikleri araçlarla birlikte Plugin’lerin içinde de
    gönderilebilir.

  </Step>

  <Step title="Skill’i yükleyin">
    OpenClaw’ın Skill’i algılaması için yeni bir oturum başlatın:

    ```bash
    # Sohbet içinden
    /new

    # Veya gateway’i yeniden başlatın
    openclaw gateway restart
    ```

    Skill’in yüklendiğini doğrulayın:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="Test edin">
    Skill’i tetiklemesi gereken bir mesaj gönderin:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Ya da ajanla sohbet edip bir selamlama isteyin.

  </Step>
</Steps>

## Skill meta veri referansı

YAML frontmatter şu alanları destekler:

| Alan                                | Gerekli | Açıklama                                    |
| ----------------------------------- | ------- | ------------------------------------------- |
| `name`                              | Evet    | Benzersiz tanımlayıcı (`snake_case`)        |
| `description`                       | Evet    | Ajana gösterilen tek satırlık açıklama      |
| `metadata.openclaw.os`              | Hayır   | OS filtresi (`["darwin"]`, `["linux"]` vb.) |
| `metadata.openclaw.requires.bins`   | Hayır   | PATH üzerinde gerekli ikililer              |
| `metadata.openclaw.requires.config` | Hayır   | Gerekli yapılandırma anahtarları            |

## En iyi uygulamalar

- **Kısa olun** — modele bir AI gibi nasıl davranacağını değil, _ne_ yapacağını söyleyin
- **Önce güvenlik** — Skill’iniz `exec` kullanıyorsa, istemlerin güvenilmeyen girdilerden rastgele komut eklemeye izin vermediğinden emin olun
- **Yerelde test edin** — paylaşmadan önce test etmek için `openclaw agent --message "..."` kullanın
- **ClawHub kullanın** — [ClawHub](https://clawhub.ai) üzerinde Skills’e göz atın ve katkıda bulunun

## Skills nerede bulunur

| Konum                           | Öncelik   | Kapsam                  |
| ------------------------------- | --------- | ----------------------- |
| `\<workspace\>/skills/`         | En yüksek | Ajan başına             |
| `\<workspace\>/.agents/skills/` | Yüksek    | Çalışma alanı ajanı başına |
| `~/.agents/skills/`             | Orta      | Paylaşılan ajan profili |
| `~/.openclaw/skills/`           | Orta      | Paylaşılan (tüm ajanlar) |
| Paketli (OpenClaw ile gönderilir) | Düşük   | Genel                   |
| `skills.load.extraDirs`         | En düşük  | Özel paylaşılan klasörler |

## İlgili

- [Skills referansı](/tr/tools/skills) — yükleme, öncelik ve geçitleme kuralları
- [Skills yapılandırması](/tr/tools/skills-config) — `skills.*` yapılandırma şeması
- [ClawHub](/tr/tools/clawhub) — herkese açık Skill kayıt defteri
- [Plugin oluşturma](/tr/plugins/building-plugins) — Plugin’ler Skills içerebilir
