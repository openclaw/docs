---
read_when:
    - Skills yapılandırmasını ekleme veya değiştirme
    - Paketli izin listesini veya kurulum davranışını ayarlama
summary: Skills yapılandırma şeması ve örnekleri
title: Skills yapılandırması
x-i18n:
    generated_at: "2026-04-24T09:36:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d5e156adb9b88d7ade1976005c11faffe5107661e4f3da5d878cc0ac648bcbb
    source_path: tools/skills-config.md
    workflow: 15
---

Skills yükleyici/kurulum yapılandırmasının çoğu `~/.openclaw/openclaw.json`
içinde `skills` altında bulunur. Ajana özgü Skill görünürlüğü ise
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
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway çalışma zamanı hâlâ Node; bun önerilmez)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // veya düz metin dize
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

Yerleşik görsel oluşturma/düzenleme için `agents.defaults.imageGenerationModel`
ve çekirdek `image_generate` aracını tercih edin. `skills.entries.*` yalnızca özel veya
üçüncü taraf Skill iş akışları içindir.

Belirli bir görsel sağlayıcısı/modeli seçerseniz, ilgili sağlayıcının
kimlik doğrulama/API anahtarını da yapılandırın. Tipik örnekler:
`google/*` için `GEMINI_API_KEY` veya `GOOGLE_API_KEY`,
`openai/*` için `OPENAI_API_KEY` ve `fal/*` için `FAL_KEY`.

Örnekler:

- Yerel Nano Banana Pro tarzı kurulum: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Yerel fal kurulumu: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Ajan Skill izin listeleri

Aynı makine/çalışma alanı Skill köklerini, ancak
ajan başına farklı görünür Skill kümesini istediğinizde ajan yapılandırmasını kullanın.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // varsayılanları devralır -> github, weather
      { id: "docs", skills: ["docs-search"] }, // varsayılanların yerini alır
      { id: "locked-down", skills: [] }, // Skill yok
    ],
  },
}
```

Kurallar:

- `agents.defaults.skills`: `agents.list[].skills`
  içermeyen ajanlar için paylaşılan temel izin listesi.
- Skills’i varsayılan olarak kısıtsız bırakmak için `agents.defaults.skills` değerini atlayın.
- `agents.list[].skills`: o ajan için açık son Skill kümesi; varsayılanlarla
  birleştirilmez.
- `agents.list[].skills: []`: o ajan için hiç Skill açığa çıkarmaz.

## Alanlar

- Yerleşik Skill kökleri her zaman `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` ve `<workspace>/skills` değerlerini içerir.
- `allowBundled`: yalnızca **paketlenmiş** Skills için isteğe bağlı izin listesi. Ayarlandığında, yalnızca
  listedeki paketlenmiş Skills uygundur (yönetilen, ajan ve çalışma alanı Skills’i etkilenmez).
- `load.extraDirs`: taranacak ek Skill dizinleri (en düşük öncelik).
- `load.watch`: Skill klasörlerini izle ve Skills anlık görüntüsünü yenile (varsayılan: true).
- `load.watchDebounceMs`: milisaniye cinsinden Skill izleyici olayları için debounce süresi (varsayılan: 250).
- `install.preferBrew`: varsa brew yükleyicilerini tercih et (varsayılan: true).
- `install.nodeManager`: node yükleyici tercihi (`npm` | `pnpm` | `yarn` | `bun`, varsayılan: npm).
  Bu yalnızca **Skill kurulumlarını** etkiler; Gateway çalışma zamanı yine de Node
  olmalıdır (WhatsApp/Telegram için Bun önerilmez).
  - `openclaw setup --node-manager` daha dardır ve şu anda `npm`,
    `pnpm` veya `bun` kabul eder. Yarn destekli Skill kurulumları istiyorsanız
    `skills.install.nodeManager: "yarn"` değerini elle ayarlayın.
- `entries.<skillKey>`: Skill başına geçersiz kılmalar.
- `agents.defaults.skills`: `agents.list[].skills`
  içermeyen ajanlar tarafından devralınan isteğe bağlı varsayılan Skill izin listesi.
- `agents.list[].skills`: isteğe bağlı ajan başına son Skill izin listesi; açık
  listeler, devralınan varsayılanlarla birleşmek yerine onların yerini alır.

Skill başına alanlar:

- `enabled`: Skill paketli/kurulu olsa bile devre dışı bırakmak için `false` ayarlayın.
- `env`: ajan çalıştırmasına eklenen ortam değişkenleri (yalnızca zaten ayarlanmamışsa).
- `apiKey`: birincil ortam değişkeni bildiren Skills için isteğe bağlı kolaylık.
  Düz metin dizeyi veya SecretRef nesnesini (`{ source, provider, id }`) destekler.

## Notlar

- `entries` altındaki anahtarlar varsayılan olarak Skill adına eşlenir. Bir Skill
  `metadata.openclaw.skillKey` tanımlıyorsa bunun yerine o anahtarı kullanın.
- Yükleme önceliği `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → paketlenmiş Skills →
  `skills.load.extraDirs` şeklindedir.
- Skills üzerindeki değişiklikler, izleyici etkinken bir sonraki ajan turunda alınır.

### Sandbox içindeki Skills + ortam değişkenleri

Bir oturum **sandbox içindeyse**, Skill süreçleri yapılandırılmış
sandbox arka ucunda çalışır. Sandbox, ana makinenin `process.env` değerini devralmaz.

Şunlardan birini kullanın:

- Docker arka ucu için `agents.defaults.sandbox.docker.env` (veya ajan başına `agents.list[].sandbox.docker.env`)
- ortam değişkenlerini özel sandbox imajınıza veya uzak sandbox ortamınıza gömün

Genel `env` ve `skills.entries.<skill>.env/apiKey` yalnızca **ana makine** çalıştırmaları için uygulanır.

## İlgili

- [Skills](/tr/tools/skills)
- [Skills oluşturma](/tr/tools/creating-skills)
- [Slash komutları](/tr/tools/slash-commands)
