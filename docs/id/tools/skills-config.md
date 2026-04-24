---
read_when:
    - Menambahkan atau mengubah konfigurasi Skills
    - Menyesuaikan allowlist bawaan atau perilaku instalasi
summary: Skema konfigurasi Skills dan contohnya
title: konfigurasi Skills
x-i18n:
    generated_at: "2026-04-24T09:32:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d5e156adb9b88d7ade1976005c11faffe5107661e4f3da5d878cc0ac648bcbb
    source_path: tools/skills-config.md
    workflow: 15
---

Sebagian besar konfigurasi loader/instalasi Skills berada di bawah `skills` di
`~/.openclaw/openclaw.json`. Visibilitas skill spesifik agen berada di bawah
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

Untuk pembuatan/pengeditan gambar bawaan, utamakan `agents.defaults.imageGenerationModel`
ditambah alat inti `image_generate`. `skills.entries.*` hanya untuk alur kerja skill
kustom atau pihak ketiga.

Jika Anda memilih provider/model gambar tertentu, konfigurasikan juga
auth/API key provider tersebut. Contoh umum: `GEMINI_API_KEY` atau `GOOGLE_API_KEY` untuk
`google/*`, `OPENAI_API_KEY` untuk `openai/*`, dan `FAL_KEY` untuk `fal/*`.

Contoh:

- Penyiapan gaya Nano Banana Pro native: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Penyiapan fal native: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Allowlist skill agen

Gunakan konfigurasi agen saat Anda menginginkan root skill mesin/workspace yang sama, tetapi
set skill yang terlihat berbeda per agen.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // mewarisi default -> github, weather
      { id: "docs", skills: ["docs-search"] }, // menggantikan default
      { id: "locked-down", skills: [] }, // tanpa skill
    ],
  },
}
```

Aturan:

- `agents.defaults.skills`: allowlist baseline bersama untuk agen yang menghilangkan
  `agents.list[].skills`.
- Hilangkan `agents.defaults.skills` agar skill tetap tidak dibatasi secara default.
- `agents.list[].skills`: set skill final eksplisit untuk agen itu; tidak
  digabungkan dengan default.
- `agents.list[].skills: []`: tidak mengekspos skill untuk agen itu.

## Field

- Root skill bawaan selalu mencakup `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills`, dan `<workspace>/skills`.
- `allowBundled`: allowlist opsional hanya untuk skill **bundled**. Jika diatur, hanya
  skill bundled yang ada dalam daftar yang memenuhi syarat (skill terkelola, agen, dan workspace tidak terpengaruh).
- `load.extraDirs`: direktori skill tambahan untuk dipindai (prioritas terendah).
- `load.watch`: pantau folder skill dan segarkan snapshot skill (default: true).
- `load.watchDebounceMs`: debounce untuk event watcher skill dalam milidetik (default: 250).
- `install.preferBrew`: utamakan installer brew jika tersedia (default: true).
- `install.nodeManager`: preferensi installer Node (`npm` | `pnpm` | `yarn` | `bun`, default: npm).
  Ini hanya memengaruhi **instalasi skill**; runtime Gateway tetap harus Node
  (`bun` tidak direkomendasikan untuk WhatsApp/Telegram).
  - `openclaw setup --node-manager` lebih sempit dan saat ini menerima `npm`,
    `pnpm`, atau `bun`. Atur `skills.install.nodeManager: "yarn"` secara manual jika Anda
    menginginkan instalasi skill berbasis Yarn.
- `entries.<skillKey>`: override per skill.
- `agents.defaults.skills`: allowlist skill default opsional yang diwarisi oleh agen
  yang menghilangkan `agents.list[].skills`.
- `agents.list[].skills`: allowlist skill final opsional per agen; daftar eksplisit
  menggantikan default yang diwarisi alih-alih menggabungkannya.

Field per skill:

- `enabled`: atur `false` untuk menonaktifkan skill meskipun skill itu bundled/terinstal.
- `env`: environment variable yang diinjeksi untuk run agen (hanya jika belum disetel).
- `apiKey`: kemudahan opsional untuk skill yang mendeklarasikan env var utama.
  Mendukung string plaintext atau objek SecretRef (`{ source, provider, id }`).

## Catatan

- Key di bawah `entries` dipetakan ke nama skill secara default. Jika sebuah skill mendefinisikan
  `metadata.openclaw.skillKey`, gunakan key itu sebagai gantinya.
- Prioritas load adalah `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → skill bundled →
  `skills.load.extraDirs`.
- Perubahan pada skill akan diambil pada giliran agen berikutnya saat watcher diaktifkan.

### Skill yang di-sandbox + env vars

Saat sebuah sesi **di-sandbox**, proses skill berjalan di dalam backend sandbox
yang dikonfigurasi. Sandbox **tidak** mewarisi `process.env` host.

Gunakan salah satu dari:

- `agents.defaults.sandbox.docker.env` untuk backend Docker (atau `agents.list[].sandbox.docker.env` per agen)
- bake env ke image sandbox kustom Anda atau environment sandbox jarak jauh

`env` global dan `skills.entries.<skill>.env/apiKey` hanya berlaku untuk run **host**.

## Terkait

- [Skills](/id/tools/skills)
- [Membuat skills](/id/tools/creating-skills)
- [Perintah slash](/id/tools/slash-commands)
