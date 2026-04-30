---
read_when:
    - Çalışma alanınızda yeni bir özel beceri oluşturuyorsunuz
    - SKILL.md tabanlı Skills için hızlı bir başlangıç iş akışına ihtiyacınız var
summary: Özel çalışma alanı Skills'lerini SKILL.md ile oluşturun ve test edin
title: Skills oluşturma
x-i18n:
    generated_at: "2026-04-30T09:47:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 201718f4088f4243b0dabe12fb4fce4b8a7e64df9a4b7d651356ab4ae0dd3579
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills, araca araçların nasıl ve ne zaman kullanılacağını öğretir. Her skill, YAML frontmatter ve markdown yönergeleri içeren bir `SKILL.md` dosyası barındıran bir dizindir.

Skills’in nasıl yüklendiği ve önceliklendirildiği için bkz. [Skills](/tr/tools/skills).

## İlk skill’inizi oluşturun

<Steps>
  <Step title="Skill dizinini oluştur">
    Skills çalışma alanınızda bulunur. Yeni bir klasör oluşturun:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="SKILL.md yaz">
    Bu dizinin içinde `SKILL.md` oluşturun. Frontmatter, metadata’yı tanımlar;
    markdown gövdesi ise aracı için yönergeler içerir.

    ```markdown
    ---
    name: hello-world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

    Skill `name` için küçük harfler, rakamlar ve kısa çizgilerle hyphen-case
    kullanın. Klasör adı ile frontmatter `name` değerini uyumlu tutun.

  </Step>

  <Step title="Araçlar ekle (isteğe bağlı)">
    Frontmatter içinde özel araç şemaları tanımlayabilir veya araca mevcut
    sistem araçlarını (`exec` ya da `browser` gibi) kullanmasını söyleyebilirsiniz. Skills ayrıca
    belgeledikleri araçlarla birlikte plugins içinde de gönderilebilir.

  </Step>

  <Step title="Skill’i yükle">
    OpenClaw’ın skill’i algılaması için yeni bir oturum başlatın:

    ```bash
    # From chat
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

    Skill’in yüklendiğini doğrulayın:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="Test et">
    Skill’i tetiklemesi gereken bir mesaj gönderin:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Ya da yalnızca araçla sohbet edip bir selamlama isteyin.

  </Step>
</Steps>

## Skill metadata referansı

YAML frontmatter şu alanları destekler:

| Alan                                | Zorunlu | Açıklama                                                     |
| ----------------------------------- | ------- | ------------------------------------------------------------ |
| `name`                              | Evet    | Küçük harfler, rakamlar ve kısa çizgiler kullanan benzersiz tanımlayıcı |
| `description`                       | Evet    | Araca gösterilen tek satırlık açıklama                       |
| `metadata.openclaw.os`              | Hayır   | İşletim sistemi filtresi (`["darwin"]`, `["linux"]` vb.)     |
| `metadata.openclaw.requires.bins`   | Hayır   | PATH üzerinde gerekli ikili dosyalar                         |
| `metadata.openclaw.requires.config` | Hayır   | Gerekli config anahtarları                                   |

## En iyi uygulamalar

- **Kısa ve öz olun** — modele bir yapay zeka olarak nasıl davranacağını değil, _ne_ yapacağını söyleyin
- **Önce güvenlik** — skill’iniz `exec` kullanıyorsa, istemlerin güvenilmeyen girdiden rastgele komut enjeksiyonuna izin vermediğinden emin olun
- **Yerelde test edin** — paylaşmadan önce test etmek için `openclaw agent --message "..."` kullanın
- **ClawHub kullanın** — Skills’e [ClawHub](https://clawhub.ai) üzerinden göz atın ve katkıda bulunun

## Skills’in bulunduğu yerler

| Konum                           | Öncelik    | Kapsam                    |
| ------------------------------- | ---------- | ------------------------- |
| `\<workspace\>/skills/`         | En yüksek  | Aracı başına              |
| `\<workspace\>/.agents/skills/` | Yüksek     | Çalışma alanı aracı başına |
| `~/.agents/skills/`             | Orta       | Paylaşılan aracı profili  |
| `~/.openclaw/skills/`           | Orta       | Paylaşılan (tüm aracılar) |
| Paketli (OpenClaw ile gönderilir) | Düşük    | Genel                     |
| `skills.load.extraDirs`         | En düşük   | Özel paylaşılan klasörler |

## İlgili

- [Skills referansı](/tr/tools/skills) — yükleme, öncelik ve kapılama kuralları
- [Skills config](/tr/tools/skills-config) — `skills.*` config şeması
- [ClawHub](/tr/tools/clawhub) — herkese açık skill kayıt yeri
- [Plugin Oluşturma](/tr/plugins/building-plugins) — plugins skills gönderebilir
