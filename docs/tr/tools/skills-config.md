---
read_when:
    - Skills yapılandırmasını ekliyor veya değiştiriyorsunuz
    - Paketlenmiş allowlist veya kurulum davranışını ayarlıyorsunuz
summary: Skills yapılandırma şeması ve örnekleri
title: Skills Yapılandırması
x-i18n:
    generated_at: "2026-04-05T14:13:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7839f39f68c1442dcf4740b09886e0ef55762ce0d4b9f7b4f493a8c130c84579
    source_path: tools/skills-config.md
    workflow: 15
---

# Skills Yapılandırması

Çoğu Skills yükleyici/kurulum yapılandırması, `~/.openclaw/openclaw.json`
içindeki `skills` altında bulunur. Ajana özel Skills görünürlüğü
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

Yerleşik görüntü oluşturma/düzenleme için `agents.defaults.imageGenerationModel`
ve çekirdek `image_generate` aracını tercih edin. `skills.entries.*` yalnızca özel veya
üçüncü taraf Skills iş akışları içindir.

Belirli bir görüntü sağlayıcısı/modeli seçerseniz, o sağlayıcının
kimlik doğrulamasını/API anahtarını da yapılandırın. Tipik örnekler:
`google/*` için `GEMINI_API_KEY` veya `GOOGLE_API_KEY`,
`openai/*` için `OPENAI_API_KEY` ve `fal/*` için `FAL_KEY`.

Örnekler:

- Yerel Nano Banana tarzı kurulum: `agents.defaults.imageGenerationModel.primary: "google/gemini-3.1-flash-image-preview"`
- Yerel fal kurulumu: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Ajan Skills allowlist'leri

Aynı makine/çalışma alanı Skills köklerini kullanmak, ancak ajan başına
farklı bir görünür Skills kümesi istemek istediğinizde ajan yapılandırmasını kullanın.

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
  alanını atlayan ajanlar için paylaşılan temel allowlist.
- Varsayılan olarak Skills'i kısıtlamadan bırakmak için `agents.defaults.skills` alanını atlayın.
- `agents.list[].skills`: o ajan için açık nihai Skills kümesi; varsayılanlarla
  birleştirilmez.
- `agents.list[].skills: []`: o ajan için hiç Skill gösterme.

## Alanlar

- Yerleşik Skill kökleri her zaman `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` ve `<workspace>/skills` değerlerini içerir.
- `allowBundled`: yalnızca **paketlenmiş** Skills için isteğe bağlı allowlist. Ayarlandığında,
  yalnızca listedeki paketlenmiş Skills uygundur (yönetilen, ajan ve çalışma alanı Skills etkilenmez).
- `load.extraDirs`: taranacak ek Skill dizinleri (en düşük öncelik).
- `load.watch`: Skill klasörlerini izle ve Skills anlık görüntüsünü yenile (varsayılan: true).
- `load.watchDebounceMs`: milisaniye cinsinden Skill izleyici olayları için debounce değeri (varsayılan: 250).
- `install.preferBrew`: mevcut olduğunda brew kurucularını tercih et (varsayılan: true).
- `install.nodeManager`: node kurucu tercihi (`npm` | `pnpm` | `yarn` | `bun`, varsayılan: npm).
  Bu yalnızca **Skill kurulumlarını** etkiler; Gateway çalışma zamanı yine de Node olmalıdır
  (WhatsApp/Telegram için Bun önerilmez).
  - `openclaw setup --node-manager` daha dardır ve şu anda `npm`,
    `pnpm` veya `bun` kabul eder. Yarn tabanlı Skill kurulumları istiyorsanız
    `skills.install.nodeManager: "yarn"` değerini elle ayarlayın.
- `entries.<skillKey>`: Skill başına geçersiz kılmalar.
- `agents.defaults.skills`: `agents.list[].skills`
  alanını atlayan ajanlar tarafından devralınan isteğe bağlı varsayılan Skill allowlist'i.
- `agents.list[].skills`: isteğe bağlı ajan başına nihai Skill allowlist'i; açık
  listeler, devralınan varsayılanlarla birleşmek yerine onların yerini alır.

Skill başına alanlar:

- `enabled`: bir Skill paketlenmiş/kurulmuş olsa bile devre dışı bırakmak için `false` ayarlayın.
- `env`: ajan çalıştırmasına enjekte edilen ortam değişkenleri (yalnızca zaten ayarlanmamışsa).
- `apiKey`: birincil bir ortam değişkeni tanımlayan Skills için isteğe bağlı kolaylık alanı.
  Düz metin dizeyi veya SecretRef nesnesini destekler (`{ source, provider, id }`).

## Notlar

- `entries` altındaki anahtarlar varsayılan olarak Skill adıyla eşlenir. Bir Skill
  `metadata.openclaw.skillKey` tanımlıyorsa, bunun yerine o anahtarı kullanın.
- Yükleme önceliği `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → paketlenmiş Skills →
  `skills.load.extraDirs` şeklindedir.
- İzleyici etkinleştirildiğinde Skills değişiklikleri bir sonraki ajan turunda alınır.

### Sandboxed Skills + ortam değişkenleri

Bir oturum **sandboxed** olduğunda, Skill süreçleri Docker içinde çalışır. Sandbox,
ana makine `process.env` değerini **devralmaz**.

Şunlardan birini kullanın:

- `agents.defaults.sandbox.docker.env` (veya ajan başına `agents.list[].sandbox.docker.env`)
- ortam değişkenlerini özel sandbox imajınıza gömün

Genel `env` ve `skills.entries.<skill>.env/apiKey`, yalnızca **ana makine** çalıştırmaları için geçerlidir.
