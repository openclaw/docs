---
read_when:
    - .prose iş akışı dosyalarını çalıştırmak veya yazmak istiyorsunuz
    - OpenProse eklentisini etkinleştirmek istiyorsunuz
    - OpenProse'un OpenClaw temel yapılarına nasıl eşlendiğini anlamanız gerekir
sidebarTitle: OpenProse
summary: OpenProse, çok aracılı AI oturumları için markdown öncelikli bir iş akışı biçimidir. OpenClaw'da /prose slash komutu ve bir skill paketiyle Plugin olarak sunulur.
title: OpenProse
x-i18n:
    generated_at: "2026-06-28T01:07:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde819215f99055c2a83ec32ed6e0700994654ca2d1d9c9dda98b71545f8a012
    source_path: prose.md
    workflow: 16
---

OpenProse, AI oturumlarını düzenlemek için taşınabilir, markdown öncelikli bir iş akışı biçimidir. OpenClaw içinde, bir OpenProse beceri paketi ve `/prose` slash komutu kuran bir Plugin olarak sunulur. Programlar `.prose` dosyalarında bulunur ve açık denetim akışıyla birden çok alt ajan başlatabilir.

<CardGroup cols={3}>
  <Card title="Install" icon="download" href="#install">
    OpenProse Plugin'ini etkinleştirin ve Gateway'i yeniden başlatın.
  </Card>
  <Card title="Run a program" icon="play" href="#slash-command">
    Bir `.prose` dosyasını veya uzak programı yürütmek için `/prose run` kullanın.
  </Card>
  <Card title="Write programs" icon="pencil" href="#example">
    Paralel ve sıralı adımlarla çok ajanlı iş akışları yazın.
  </Card>
</CardGroup>

## Kurulum

<Steps>
  <Step title="Enable the plugin">
    Paketle gelen Plugin'ler varsayılan olarak devre dışıdır. OpenProse'u etkinleştirin:

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="Verify">
    ```bash
    openclaw plugins list | grep prose
    ```

    `open-prose` öğesini etkin olarak görmelisiniz. `/prose` beceri komutu artık
    sohbet içinde kullanılabilir.

  </Step>
</Steps>

Yerel bir checkout için: `openclaw plugins install ./path/to/local/open-prose-plugin`

## Slash komutu

OpenProse, `/prose` komutunu kullanıcının çağırabileceği bir beceri komutu olarak kaydeder:

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

`/prose run <handle/slug>`, `https://p.prose.md/<handle>/<slug>` adresine çözümlenir.
Doğrudan URL'ler `web_fetch` aracı kullanılarak olduğu gibi getirilir.

Üst düzey uzak çalıştırmalar açıktır. Bir `.prose` programının içindeki uzak içe aktarmalar
geçişli kod bağımlılıklarıdır: OpenProse herhangi bir uzak `use` hedefini getirmeden önce,
çözümlenen içe aktarma listesini gösterir ve operatörün o çalıştırma için tam olarak
`approve remote prose imports` yanıtını vermesini gerektirir.

## Neler yapabilir

- Açık paralellikle çok ajanlı araştırma ve sentez.
- Tekrarlanabilir, onay açısından güvenli iş akışları (kod inceleme, olay triyajı, içerik işlem hatları).
- Desteklenen ajan çalışma zamanlarında çalıştırabileceğiniz yeniden kullanılabilir `.prose` programları.

## Örnek: paralel araştırma ve sentez

```prose
# Research + synthesis with two agents running in parallel.

input topic: "What should we research?"

agent researcher:
  model: sonnet
  prompt: "You research thoroughly and cite sources."

agent writer:
  model: opus
  prompt: "You write a concise summary."

parallel:
  findings = session: researcher
    prompt: "Research {topic}."
  draft = session: writer
    prompt: "Summarize {topic}."

session "Merge the findings + draft into a final answer."
context: { findings, draft }
```

## OpenClaw çalışma zamanı eşlemesi

OpenProse programları OpenClaw temel yapılarına eşlenir:

| OpenProse kavramı         | OpenClaw aracı    |
| ------------------------- | ---------------- |
| Oturum başlatma / Task aracı | `sessions_spawn` |
| Dosya okuma / yazma         | `read` / `write` |
| Web getirme                 | `web_fetch`      |

<Warning>
  Araç izin listeniz `sessions_spawn`, `read`, `write` veya
  `web_fetch` öğelerini engelliyorsa OpenProse programları başarısız olur.
  [araçlar izin listesi yapılandırmanızı](/tr/gateway/config-tools) kontrol edin.
</Warning>

## Dosya konumları

OpenProse, durumu çalışma alanınızda `.prose/` altında tutar:

```text
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

Kullanıcı düzeyindeki kalıcı ajanlar şurada bulunur:

```text
~/.prose/agents/
```

## Durum arka uçları

<AccordionGroup>
  <Accordion title="filesystem (default)">
    Durum, çalışma alanında `.prose/runs/...` konumuna yazılır. Ek bağımlılık
    gerekmez.
  </Accordion>
  <Accordion title="in-context">
    Bağlam penceresinde tutulan geçici durum. Küçük, kısa ömürlü
    programlar için uygundur.
  </Accordion>
  <Accordion title="sqlite (experimental)">
    `PATH` üzerinde `sqlite3` ikilisini gerektirir.
  </Accordion>
  <Accordion title="postgres (experimental)">
    `psql` ve bir bağlantı dizesi gerektirir.

    <Warning>
      Postgres kimlik bilgileri alt ajan günlüklerine akar. Ayrılmış,
      en az ayrıcalıklı bir veritabanı kullanın.
    </Warning>

  </Accordion>
</AccordionGroup>

## Güvenlik

`.prose` dosyalarını kod gibi ele alın. Uzak `use` içe aktarmaları dahil, çalıştırmadan
önce inceleyin. Üst düzey `/prose run https://...` istekleri açıktır, ancak
geçişli uzak içe aktarmalar getirilmeden veya yürütülmeden önce çalıştırma başına
onay gerektirir. Yan etkileri denetlemek için OpenClaw araç izin listelerini ve
onay kapılarını kullanın. Belirleyici, onay kapılı iş akışları için
[Lobster](/tr/tools/lobster) ile karşılaştırın.

## İlgili

<CardGroup cols={2}>
  <Card title="Skills reference" href="/tr/tools/skills" icon="puzzle-piece">
    OpenProse'un beceri paketinin nasıl yüklendiği ve hangi kapıların uygulandığı.
  </Card>
  <Card title="Subagents" href="/tr/tools/subagents" icon="users">
    OpenClaw'un yerel çok ajanlı koordinasyon katmanı.
  </Card>
  <Card title="Text-to-speech" href="/tr/tools/tts" icon="volume-high">
    İş akışlarınıza ses çıktısı ekleyin.
  </Card>
  <Card title="Slash commands" href="/tr/tools/slash-commands" icon="terminal">
    /prose dahil tüm kullanılabilir sohbet komutları.
  </Card>
</CardGroup>

Resmi site: [https://www.prose.md](https://www.prose.md)
