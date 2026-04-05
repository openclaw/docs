---
read_when:
    - Menambahkan atau memodifikasi config Skills
    - Menyesuaikan allowlist bundled atau perilaku instalasi
summary: Skema config Skills dan contoh
title: Config Skills
x-i18n:
    generated_at: "2026-04-05T14:09:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7839f39f68c1442dcf4740b09886e0ef55762ce0d4b9f7b4f493a8c130c84579
    source_path: tools/skills-config.md
    workflow: 15
---

# Config Skills

Sebagian besar konfigurasi loader/install Skills berada di bawah `skills` di
`~/.openclaw/openclaw.json`. Visibilitas skill khusus agen berada di bawah
`agents.defaults.skills` dan `agents.list[].skills`.

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
      nodeManager: "npm", // npm | pnpm | yarn | bun (runtime Gateway tetap Node; bun tidak direkomendasikan)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // atau string plaintext
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

Untuk pembuatan/pengeditan gambar bawaan, gunakan
`agents.defaults.imageGenerationModel` plus tool core `image_generate`.
`skills.entries.*` hanya untuk alur kerja skill kustom atau pihak ketiga.

Jika Anda memilih provider/model gambar tertentu, konfigurasikan juga
auth/API key provider tersebut. Contoh umum: `GEMINI_API_KEY` atau `GOOGLE_API_KEY` untuk
`google/*`, `OPENAI_API_KEY` untuk `openai/*`, dan `FAL_KEY` untuk `fal/*`.

Contoh:

- Setup gaya Nano Banana native: `agents.defaults.imageGenerationModel.primary: "google/gemini-3.1-flash-image-preview"`
- Setup fal native: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Allowlist skill agen

Gunakan config agen saat Anda menginginkan root skill mesin/workspace yang sama, tetapi
set skill yang terlihat berbeda untuk setiap agen.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // mewarisi default -> github, weather
      { id: "docs", skills: ["docs-search"] }, // mengganti default
      { id: "locked-down", skills: [] }, // tanpa skill
    ],
  },
}
```

Aturan:

- `agents.defaults.skills`: baseline allowlist bersama untuk agen yang tidak menyertakan
  `agents.list[].skills`.
- Hilangkan `agents.defaults.skills` agar skill tetap tidak dibatasi secara default.
- `agents.list[].skills`: set skill final eksplisit untuk agen tersebut; tidak
  digabungkan dengan default.
- `agents.list[].skills: []`: tidak mengekspos skill apa pun untuk agen tersebut.

## Field

- Root skill bawaan selalu mencakup `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills`, dan `<workspace>/skills`.
- `allowBundled`: allowlist opsional hanya untuk Skills **bundled**. Jika disetel, hanya
  skill bundled dalam daftar yang memenuhi syarat (skill managed, agen, dan workspace tidak terpengaruh).
- `load.extraDirs`: direktori skill tambahan untuk dipindai (precedence terendah).
- `load.watch`: pantau folder skill dan segarkan snapshot Skills (default: true).
- `load.watchDebounceMs`: debounce untuk event watcher skill dalam milidetik (default: 250).
- `install.preferBrew`: pilih installer brew bila tersedia (default: true).
- `install.nodeManager`: preferensi installer node (`npm` | `pnpm` | `yarn` | `bun`, default: npm).
  Ini hanya memengaruhi **instalasi skill**; runtime Gateway tetap harus Node
  (Bun tidak direkomendasikan untuk WhatsApp/Telegram).
  - `openclaw setup --node-manager` lebih sempit dan saat ini menerima `npm`,
    `pnpm`, atau `bun`. Setel `skills.install.nodeManager: "yarn"` secara manual jika Anda
    ingin instalasi skill berbasis Yarn.
- `entries.<skillKey>`: override per skill.
- `agents.defaults.skills`: allowlist skill default opsional yang diwarisi oleh agen
  yang tidak menyertakan `agents.list[].skills`.
- `agents.list[].skills`: allowlist skill final per agen yang opsional; daftar eksplisit
  menggantikan default yang diwarisi alih-alih menggabungkannya.

Field per skill:

- `enabled`: setel `false` untuk menonaktifkan skill meskipun sudah bundled/terinstal.
- `env`: variabel lingkungan yang disuntikkan untuk eksekusi agen (hanya jika belum disetel).
- `apiKey`: kemudahan opsional untuk skill yang mendeklarasikan variabel env utama.
  Mendukung string plaintext atau objek SecretRef (`{ source, provider, id }`).

## Catatan

- Key di bawah `entries` secara default dipetakan ke nama skill. Jika sebuah skill mendefinisikan
  `metadata.openclaw.skillKey`, gunakan key itu sebagai gantinya.
- Urutan precedence pemuatan adalah `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills bundled →
  `skills.load.extraDirs`.
- Perubahan pada skill akan diambil pada giliran agen berikutnya saat watcher diaktifkan.

### Skill sandboxed + env vars

Saat sebuah sesi **sandboxed**, proses skill berjalan di dalam Docker. Sandbox
**tidak** mewarisi host `process.env`.

Gunakan salah satu dari:

- `agents.defaults.sandbox.docker.env` (atau `agents.list[].sandbox.docker.env` per agen)
- bake env tersebut ke dalam image sandbox kustom Anda

`env` global dan `skills.entries.<skill>.env/apiKey` hanya berlaku untuk eksekusi **host**.
