---
read_when:
    - .prose iş akışı dosyalarını çalıştırmak veya yazmak istiyorsunuz
    - OpenProse Pluginini etkinleştirmek istiyorsunuz
    - OpenProse'un OpenClaw temel bileşenleriyle nasıl eşleştiğini anlamanız gerekir
sidebarTitle: OpenProse
summary: OpenProse, çoklu ajanlı yapay zekâ oturumları için Markdown öncelikli bir iş akışı biçimidir. OpenClaw'da `/prose` eğik çizgi komutu ve bir Skills paketi içeren bir Plugin olarak sunulur.
title: OpenProse
x-i18n:
    generated_at: "2026-07-12T12:41:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b04eb23bf827fbec6db11c1e95993e7f6c617451c5f4fda771ad078674c12bc
    source_path: prose.md
    workflow: 16
---

OpenProse, yapay zekâ oturumlarını düzenlemek için kullanılan, taşınabilir ve markdown öncelikli bir iş akışı biçimidir. OpenClaw'da, bir OpenProse Skills paketi ve `/prose` eğik çizgi komutu yükleyen bir Plugin olarak sunulur. Programlar `.prose` dosyalarında bulunur ve açık denetim akışıyla birden fazla alt ajan başlatabilir.

<CardGroup cols={3}>
  <Card title="Yükleme" icon="download" href="#install">
    OpenProse Plugin'ini etkinleştirin ve Gateway'i yeniden başlatın.
  </Card>
  <Card title="Program çalıştırma" icon="play" href="#slash-command">
    Bir `.prose` dosyasını veya uzak programı yürütmek için `/prose run` kullanın.
  </Card>
  <Card title="Program yazma" icon="pencil" href="#example-parallel-research-and-synthesis">
    Paralel ve sıralı adımlarla çok ajanlı iş akışları oluşturun.
  </Card>
</CardGroup>

## Yükleme

<Steps>
  <Step title="Plugin'i etkinleştirin">
    OpenProse paketle birlikte gelir ancak varsayılan olarak devre dışıdır. Etkinleştirmek için:

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="Gateway'i yeniden başlatın">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="Doğrulayın">
    ```bash
    openclaw plugins list | grep prose
    ```

    `open-prose` öğesinin etkin olduğunu görmelisiniz. `/prose` Skills komutu artık sohbette kullanılabilir.

  </Step>
</Steps>

Bir depo çalışma kopyasından Plugin'i doğrudan yükleyebilirsiniz:
`openclaw plugins install ./extensions/open-prose`

## Eğik çizgi komutu

OpenProse, `/prose` komutunu kullanıcı tarafından çağrılabilen bir Skills komutu olarak kaydeder:

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

Üst düzey uzak çalıştırmalar açıktır. Bir `.prose` programındaki uzak içe aktarmalar geçişli kod bağımlılıklarıdır: OpenProse herhangi bir uzak `use` hedefini getirmeden önce çözümlenen içe aktarma listesini gösterir ve operatörün bu çalıştırma için tam olarak `approve remote prose imports` yanıtını vermesini gerektirir.

## Yapabilecekleri

- Açık paralellik ile çok ajanlı araştırma ve sentez.
- Tekrarlanabilir ve onay açısından güvenli iş akışları (kod incelemesi, olay sınıflandırması, içerik işlem hatları).
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

OpenProse programları OpenClaw temel bileşenleriyle eşleşir:

| OpenProse kavramı             | OpenClaw aracı                                  |
| ----------------------------- | ----------------------------------------------- |
| Oturum başlatma / Görev aracı | `sessions_spawn`                                |
| Dosya okuma / yazma           | `read` / `write`                                |
| Web'den getirme               | `web_fetch` (POST gerektiğinde `exec` + curl)   |

<Warning>
  Araç izin listeniz `sessions_spawn`, `read`, `write` veya `web_fetch` araçlarını engelliyorsa OpenProse programları başarısız olur. [Araç izin listesi yapılandırmanızı](/tr/gateway/config-tools) kontrol edin.
</Warning>

## Dosya konumları

OpenProse, çalışma alanınızdaki durumu `.prose/` altında tutar:

```text
.prose/
├── .env                      # config (key=value), e.g. OPENPROSE_POSTGRES_URL
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose     # copy of the running program
│       ├── state.md          # execution state
│       ├── bindings/
│       ├── imports/          # nested remote program runs
│       └── agents/
└── agents/                   # project-scoped persistent agents
```

Projeler arasında paylaşılan, kullanıcı düzeyindeki kalıcı ajanlar şurada bulunur:

```text
~/.prose/agents/
```

## Durum arka uçları

<AccordionGroup>
  <Accordion title="filesystem (varsayılan)">
    Durum, çalışma alanındaki `.prose/runs/...` konumuna yazılır. Ek bağımlılık gerekmez.
  </Accordion>
  <Accordion title="in-context">
    Geçici durum bağlam penceresinde tutulur; `--in-context` ile seçin.
    Küçük ve kısa ömürlü programlar için uygundur.
  </Accordion>
  <Accordion title="sqlite (deneysel)">
    `--state=sqlite` ile seçin. `PATH` üzerinde `sqlite3` ikili dosyasını gerektirir
    (bulunmadığında dosya sistemine geri döner); durum
    `.prose/runs/{id}/state.db` konumuna yazılır.
  </Accordion>
  <Accordion title="postgres (deneysel)">
    `--state=postgres` ile seçin. `psql` ve `OPENPROSE_POSTGRES_URL` içinde bir bağlantı dizesi gerektirir (bunu `.prose/.env` içinde ayarlayın).

    <Warning>
      Postgres kimlik bilgileri alt ajan günlüklerine aktarılır. Yalnızca gerekli ayrıcalıklara sahip, özel bir veritabanı kullanın.
    </Warning>

  </Accordion>
</AccordionGroup>

## Güvenlik

`.prose` dosyalarını kod gibi değerlendirin. Uzak `use` içe aktarmaları dâhil olmak üzere çalıştırmadan önce inceleyin. Üst düzey `/prose run https://...` istekleri açıktır ancak geçişli uzak içe aktarmalar, getirilmeden veya yürütülmeden önce her çalıştırma için onay gerektirir. Yan etkileri denetlemek için OpenClaw araç izin listelerini ve onay geçitlerini kullanın. Belirlenimci ve onay geçitli iş akışları için [Lobster](/tr/tools/lobster) ile karşılaştırın.

## İlgili içerikler

<CardGroup cols={2}>
  <Card title="Skills referansı" href="/tr/tools/skills" icon="puzzle-piece">
    OpenProse Skills paketinin nasıl yüklendiği ve hangi geçitlerin uygulandığı.
  </Card>
  <Card title="Alt ajanlar" href="/tr/tools/subagents" icon="users">
    OpenClaw'ın yerel çok ajanlı koordinasyon katmanı.
  </Card>
  <Card title="Metinden konuşmaya" href="/tr/tools/tts" icon="volume-high">
    İş akışlarınıza ses çıktısı ekleyin.
  </Card>
  <Card title="Eğik çizgi komutları" href="/tr/tools/slash-commands" icon="terminal">
    `/prose` dâhil kullanılabilir tüm sohbet komutları.
  </Card>
</CardGroup>

Resmî site: [https://www.prose.md](https://www.prose.md)
