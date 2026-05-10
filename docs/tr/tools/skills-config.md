---
read_when:
    - Skills yapılandırmasını ekleme veya değiştirme
    - Paketlenen izin listesini veya kurulum davranışını ayarlama
summary: Skills yapılandırma şeması ve örnekleri
title: Skills yapılandırması
x-i18n:
    generated_at: "2026-05-10T19:58:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7dad312d69c93544d8e7f9537fdd50f02345166ea629291160a30f19f0a8b340
    source_path: tools/skills-config.md
    workflow: 16
---

Skills yükleyici/kurulum yapılandırmasının çoğu
`~/.openclaw/openclaw.json` içindeki `skills` altında bulunur. Aracıya özel skill görünürlüğü
`agents.defaults.skills` ve `agents.list[].skills` altında bulunur.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
      allowUploadedArchives: false,
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

Yerleşik görüntü oluşturma/düzenleme için `agents.defaults.imageGenerationModel`
ile temel `image_generate` aracını tercih edin. `skills.entries.*` yalnızca özel veya
üçüncü taraf skill iş akışları içindir.

Belirli bir görüntü sağlayıcısı/modeli seçerseniz, o sağlayıcının
kimlik doğrulamasını/API anahtarını da yapılandırın. Tipik örnekler: `google/*` için
`GEMINI_API_KEY` veya `GOOGLE_API_KEY`, `openai/*` için `OPENAI_API_KEY` ve `fal/*` için `FAL_KEY`.

Örnekler:

- Yerel Nano Banana Pro tarzı kurulum: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Yerel fal kurulumu: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Aracı skill izin listeleri

Aynı makine/çalışma alanı skill köklerini, ancak aracı başına
farklı bir görünür skill kümesini istediğinizde aracı yapılandırmasını kullanın.

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

- `agents.defaults.skills`: `agents.list[].skills` değerini atlayan aracılar için paylaşılan temel izin listesi.
- Skills varsayılan olarak sınırsız kalsın istiyorsanız `agents.defaults.skills` değerini atlayın.
- `agents.list[].skills`: bu aracı için açık nihai skill kümesi; varsayılanlarla birleştirmez.
- `agents.list[].skills: []`: bu aracı için hiçbir skill göstermez.

## Alanlar

- Yerleşik skill kökleri her zaman `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` ve `<workspace>/skills` içerir.
- `allowBundled`: yalnızca **paketlenmiş** skill'ler için isteğe bağlı izin listesi. Ayarlandığında, yalnızca
  listedeki paketlenmiş skill'ler uygun olur (yönetilen, aracı ve çalışma alanı skill'leri etkilenmez).
- `load.extraDirs`: taranacak ek skill dizinleri (en düşük öncelik).
- `load.allowSymlinkTargets`: sembolik bağlantılı skill klasörlerinin,
  sembolik bağlantı o hedef kökün dışında bulunsa bile çözümlenebileceği güvenilir gerçek hedef dizinler. Bunu
  `~/.agents/skills/manager -> ~/Projects/manager/skills` gibi kasıtlı kardeş repo düzenleri için kullanın.
- `load.watch`: skill klasörlerini izleyin ve Skills anlık görüntüsünü yenileyin (varsayılan: true).
- `load.watchDebounceMs`: skill izleyici olayları için milisaniye cinsinden bekletme (varsayılan: 250).
- `install.preferBrew`: mevcut olduğunda brew kurucularını tercih edin (varsayılan: true).
- `install.nodeManager`: node kurucu tercihi (`npm` | `pnpm` | `yarn` | `bun`, varsayılan: npm).
  Bu yalnızca **skill kurulumlarını** etkiler; Gateway çalışma zamanı hâlâ Node olmalıdır
  (Bun, WhatsApp/Telegram için önerilmez).
  - `openclaw setup --node-manager` daha dardır ve şu anda `npm`,
    `pnpm` veya `bun` kabul eder. Yarn destekli skill kurulumları istiyorsanız
    `skills.install.nodeManager: "yarn"` değerini elle ayarlayın.
- `install.allowUploadedArchives`: güvenilir `operator.admin` Gateway
  istemcilerinin `skills.upload.*` üzerinden hazırlanmış özel zip arşivlerini kurmasına izin verin
  (varsayılan: false). Bu yalnızca yüklenen arşiv yolunu etkinleştirir; normal ClawHub
  kurulumları bunu gerektirmez.
- `entries.<skillKey>`: skill başına geçersiz kılmalar.
- `agents.defaults.skills`: `agents.list[].skills` değerini atlayan aracılar tarafından devralınan isteğe bağlı varsayılan skill izin listesi.
- `agents.list[].skills`: isteğe bağlı, aracı başına nihai skill izin listesi; açık
  listeler devralınan varsayılanları birleştirmek yerine değiştirir.

## Sembolik bağlantılı kardeş repolar

Varsayılan olarak, her skill kökü bir kapsama sınırıdır. `~/.agents/skills` altındaki
bir skill klasörü, `~/.agents/skills` dışına çözümlenen bir sembolik bağlantıysa,
OpenClaw bunu atlar ve `Skipping escaped skill path outside its configured
root` kaydını yazar.

Sembolik bağlantı düzenini koruyun ve yalnızca güvenilir hedef köke izin verin:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

Bu yapılandırmayla,
`~/.agents/skills/manager -> ~/Projects/manager/skills` gibi bir sembolik bağlantı
realpath çözümlemesinden sonra kabul edilir. `extraDirs` kardeş repoyu doğrudan da tarar; `allowSymlinkTargets` ise mevcut aracı-skill
düzenleri için sembolik bağlantılı yolu korur. Hedef girdileri dar tutun; o kök altındaki her skill ağacına güvenilmediği sürece `~` veya
`~/Projects` gibi geniş köklere işaret etmeyin.

Skill başına alanlar:

- `enabled`: paketlenmiş/kurulu olsa bile bir skill'i devre dışı bırakmak için `false` olarak ayarlayın.
- `env`: aracı çalıştırması için enjekte edilen ortam değişkenleri (yalnızca zaten ayarlı değilse).
- `apiKey`: birincil env var bildiren skill'ler için isteğe bağlı kolaylık.
  Düz metin dizesini veya SecretRef nesnesini (`{ source, provider, id }`) destekler.

## Notlar

- `entries` altındaki anahtarlar varsayılan olarak skill adına eşlenir. Bir skill
  `metadata.openclaw.skillKey` tanımlıyorsa bunun yerine o anahtarı kullanın.
- Yükleme önceliği: `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → paketlenmiş skill'ler →
  `skills.load.extraDirs`.
- İzleyici etkin olduğunda skill değişiklikleri bir sonraki aracı turunda alınır.

### Korumalı alan skill'leri ve env var'lar

Bir oturum **korumalı alandaysa**, skill süreçleri yapılandırılmış korumalı alan arka ucunun içinde çalışır. Korumalı alan, ana makine `process.env` değerini devralmaz.

<Warning>
  Global `env` ve `skills.entries.<skill>.env`/`apiKey` yalnızca **ana makine** çalıştırmaları için geçerlidir. Korumalı alan içinde etkileri yoktur, bu nedenle `GEMINI_API_KEY` değerine bağlı bir skill'e değişken ayrıca verilmedikçe `apiKey not configured` hatasıyla başarısız olur.
</Warning>

Şunlardan birini kullanın:

- Docker arka ucu için `agents.defaults.sandbox.docker.env` (veya aracı başına `agents.list[].sandbox.docker.env`).
- Env'i özel korumalı alan imajınıza veya uzak korumalı alan ortamınıza dahil edin.

## İlgili

<CardGroup cols={2}>
  <Card title="Skills" href="/tr/tools/skills" icon="puzzle-piece">
    Skill'lerin ne olduğu ve nasıl yüklendikleri.
  </Card>
  <Card title="Creating skills" href="/tr/tools/creating-skills" icon="hammer">
    Özel skill paketleri yazma.
  </Card>
  <Card title="Slash commands" href="/tr/tools/slash-commands" icon="terminal">
    Yerel komut kataloğu ve sohbet yönergeleri.
  </Card>
  <Card title="Configuration reference" href="/tr/gateway/configuration-reference" icon="gear">
    Tam `skills` ve `agents.skills` şeması.
  </Card>
</CardGroup>
