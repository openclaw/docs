---
read_when:
    - Skills yapılandırmasını ekleme veya değiştirme
    - Paketlenmiş izin listesini veya kurulum davranışını ayarlama
summary: Skills yapılandırma şeması ve örnekleri
title: Skills yapılandırması
x-i18n:
    generated_at: "2026-05-06T09:35:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8996b3df73a9f0176b541c5d3f9670615f9a879a41838cf5d35d0a455e9f5088
    source_path: tools/skills-config.md
    workflow: 16
---

Çoğu Skills yükleyici/kurulum yapılandırması `skills` altında,
`~/.openclaw/openclaw.json` içinde bulunur. Ajana özgü Skills görünürlüğü
`agents.defaults.skills` ve `agents.list[].skills` altında bulunur.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

Yerleşik görüntü üretimi/düzenleme için `agents.defaults.imageGenerationModel`
ile birlikte çekirdek `image_generate` aracını tercih edin. `skills.entries.*`
yalnızca özel veya üçüncü taraf Skills iş akışları içindir.

Belirli bir görüntü sağlayıcısı/modeli seçerseniz, o sağlayıcının kimlik
doğrulamasını/API anahtarını da yapılandırın. Tipik örnekler: `google/*` için
`GEMINI_API_KEY` veya `GOOGLE_API_KEY`, `openai/*` için `OPENAI_API_KEY` ve
`fal/*` için `FAL_KEY`.

Örnekler:

- Yerel Nano Banana Pro tarzı kurulum: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Yerel fal kurulumu: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Ajan Skills izin listeleri

Aynı makine/çalışma alanı Skills köklerini, ancak her ajan için farklı bir
görünür Skills kümesini istediğinizde ajan yapılandırmasını kullanın.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits defaults -> github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

Kurallar:

- `agents.defaults.skills`: `agents.list[].skills` değerini atlayan ajanlar için
  paylaşılan temel izin listesi.
- Skills'ın varsayılan olarak kısıtlanmaması için `agents.defaults.skills` değerini atlayın.
- `agents.list[].skills`: o ajan için açık nihai Skills kümesi; varsayılanlarla
  birleştirilmez.
- `agents.list[].skills: []`: o ajan için hiçbir Skills göstermez.

## Alanlar

- Yerleşik Skills kökleri her zaman `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` ve `<workspace>/skills` değerlerini içerir.
- `allowBundled`: yalnızca **paketlenmiş** Skills için isteğe bağlı izin listesi. Ayarlandığında, yalnızca
  listedeki paketlenmiş Skills uygun olur (yönetilen, ajan ve çalışma alanı Skills'ları etkilenmez).
- `load.extraDirs`: taranacak ek Skills dizinleri (en düşük öncelik).
- `load.watch`: Skills klasörlerini izler ve Skills anlık görüntüsünü yeniler (varsayılan: true).
- `load.watchDebounceMs`: Skills izleyici olayları için milisaniye cinsinden debounce (varsayılan: 250).
- `install.preferBrew`: mevcut olduğunda brew yükleyicilerini tercih eder (varsayılan: true).
- `install.nodeManager`: node yükleyici tercihi (`npm` | `pnpm` | `yarn` | `bun`, varsayılan: npm).
  Bu yalnızca **Skills kurulumlarını** etkiler; Gateway çalışma zamanı yine Node
  olmalıdır (Bun, WhatsApp/Telegram için önerilmez).
  - `openclaw setup --node-manager` daha dardır ve şu anda `npm`,
    `pnpm` veya `bun` kabul eder. Yarn destekli Skills kurulumları istiyorsanız
    `skills.install.nodeManager: "yarn"` değerini elle ayarlayın.
- `entries.<skillKey>`: Skills başına geçersiz kılmalar.
- `agents.defaults.skills`: `agents.list[].skills` değerini atlayan ajanlar tarafından
  devralınan isteğe bağlı varsayılan Skills izin listesi.
- `agents.list[].skills`: ajan başına isteğe bağlı nihai Skills izin listesi; açık
  listeler, devralınan varsayılanları birleştirmek yerine onların yerini alır.

Skills başına alanlar:

- `enabled`: paketlenmiş/yüklü olsa bile bir Skills'ı devre dışı bırakmak için `false` olarak ayarlayın.
- `env`: ajan çalıştırması için enjekte edilen ortam değişkenleri (yalnızca zaten ayarlanmamışsa).
- `apiKey`: birincil env var bildiren Skills için isteğe bağlı kolaylık.
  Düz metin dizesini veya SecretRef nesnesini (`{ source, provider, id }`) destekler.

## Notlar

- `entries` altındaki anahtarlar varsayılan olarak Skills adına eşlenir. Bir Skills
  `metadata.openclaw.skillKey` tanımlıyorsa bunun yerine o anahtarı kullanın.
- Yükleme önceliği şöyledir: `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → paketlenmiş Skills →
  `skills.load.extraDirs`.
- İzleyici etkin olduğunda Skills değişiklikleri bir sonraki ajan turunda alınır.

### Sandbox içindeki Skills ve env var'lar

Bir oturum **sandbox içinde** olduğunda, Skills süreçleri yapılandırılmış sandbox arka ucu içinde çalışır. Sandbox, ana makine `process.env` değerini devralmaz.

<Warning>
  Global `env` ve `skills.entries.<skill>.env`/`apiKey` yalnızca **ana makine** çalıştırmaları için geçerlidir. Sandbox içinde etkileri yoktur; bu nedenle `GEMINI_API_KEY` değerine bağlı bir Skills, sandbox'a değişken ayrıca verilmediği sürece `apiKey not configured` hatasıyla başarısız olur.
</Warning>

Şunlardan birini kullanın:

- Docker arka ucu için `agents.defaults.sandbox.docker.env` (veya ajan başına `agents.list[].sandbox.docker.env`).
- Env'i özel sandbox görüntünüze veya uzak sandbox ortamınıza gömün.

## İlgili

<CardGroup cols={2}>
  <Card title="Skills" href="/tr/tools/skills" icon="puzzle-piece">
    Skills'ın ne olduğu ve nasıl yüklendiği.
  </Card>
  <Card title="Creating skills" href="/tr/tools/creating-skills" icon="hammer">
    Özel Skills paketleri yazma.
  </Card>
  <Card title="Slash commands" href="/tr/tools/slash-commands" icon="terminal">
    Yerel komut kataloğu ve sohbet yönergeleri.
  </Card>
  <Card title="Configuration reference" href="/tr/gateway/configuration-reference" icon="gear">
    Tam `skills` ve `agents.skills` şeması.
  </Card>
</CardGroup>
