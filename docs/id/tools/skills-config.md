---
read_when:
    - Menambahkan atau mengubah konfigurasi Skills
    - Menyesuaikan daftar izin bawaan atau perilaku instalasi
summary: Skema konfigurasi Skills dan contoh
title: Konfigurasi Skills
x-i18n:
    generated_at: "2026-05-06T09:31:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8996b3df73a9f0176b541c5d3f9670615f9a879a41838cf5d35d0a455e9f5088
    source_path: tools/skills-config.md
    workflow: 16
---

Sebagian besar konfigurasi loader/instalasi Skills berada di bawah `skills` dalam
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

Untuk pembuatan/pengeditan gambar bawaan, utamakan `agents.defaults.imageGenerationModel`
ditambah alat inti `image_generate`. `skills.entries.*` hanya untuk alur kerja
skill kustom atau pihak ketiga.

Jika Anda memilih penyedia/model gambar tertentu, konfigurasikan juga kunci
autentikasi/API penyedia tersebut. Contoh umum: `GEMINI_API_KEY` atau `GOOGLE_API_KEY` untuk
`google/*`, `OPENAI_API_KEY` untuk `openai/*`, dan `FAL_KEY` untuk `fal/*`.

Contoh:

- Penyiapan native bergaya Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Penyiapan native fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

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
      { id: "writer" }, // inherits defaults -> github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

Aturan:

- `agents.defaults.skills`: allowlist dasar bersama untuk agen yang menghilangkan
  `agents.list[].skills`.
- Hilangkan `agents.defaults.skills` agar skill tidak dibatasi secara default.
- `agents.list[].skills`: set skill final eksplisit untuk agen tersebut; ini tidak
  digabungkan dengan default.
- `agents.list[].skills: []`: jangan tampilkan skill apa pun untuk agen tersebut.

## Bidang

- Root skill bawaan selalu mencakup `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills`, dan `<workspace>/skills`.
- `allowBundled`: allowlist opsional hanya untuk Skills **bundel**. Jika disetel, hanya
  Skills bundel dalam daftar yang memenuhi syarat (Skills terkelola, agen, dan workspace tidak terpengaruh).
- `load.extraDirs`: direktori skill tambahan untuk dipindai (prioritas terendah).
- `load.watch`: pantau folder skill dan segarkan snapshot Skills (default: true).
- `load.watchDebounceMs`: debounce untuk peristiwa watcher skill dalam milidetik (default: 250).
- `install.preferBrew`: utamakan penginstal brew jika tersedia (default: true).
- `install.nodeManager`: preferensi penginstal node (`npm` | `pnpm` | `yarn` | `bun`, default: npm).
  Ini hanya memengaruhi **instalasi skill**; runtime Gateway tetap harus Node
  (Bun tidak direkomendasikan untuk WhatsApp/Telegram).
  - `openclaw setup --node-manager` lebih sempit dan saat ini menerima `npm`,
    `pnpm`, atau `bun`. Setel `skills.install.nodeManager: "yarn"` secara manual jika Anda
    menginginkan instalasi skill berbasis Yarn.
- `entries.<skillKey>`: override per skill.
- `agents.defaults.skills`: allowlist skill default opsional yang diwarisi oleh agen
  yang menghilangkan `agents.list[].skills`.
- `agents.list[].skills`: allowlist skill final opsional per agen; daftar eksplisit
  menggantikan default yang diwarisi, bukan menggabungkannya.

Bidang per skill:

- `enabled`: setel `false` untuk menonaktifkan skill meskipun dibundel/diinstal.
- `env`: variabel lingkungan yang disuntikkan untuk run agen (hanya jika belum disetel).
- `apiKey`: kemudahan opsional untuk Skills yang mendeklarasikan env var utama.
  Mendukung string plaintext atau objek SecretRef (`{ source, provider, id }`).

## Catatan

- Kunci di bawah `entries` dipetakan ke nama skill secara default. Jika skill mendefinisikan
  `metadata.openclaw.skillKey`, gunakan kunci tersebut sebagai gantinya.
- Prioritas pemuatan adalah `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills bundel →
  `skills.load.extraDirs`.
- Perubahan pada Skills diambil pada giliran agen berikutnya saat watcher diaktifkan.

### Skills sandbox dan env vars

Saat sesi **disandbox**, proses skill berjalan di dalam backend sandbox yang dikonfigurasi. Sandbox **tidak** mewarisi `process.env` host.

<Warning>
  `env` global dan `skills.entries.<skill>.env`/`apiKey` hanya berlaku untuk run **host**. Di dalam sandbox, keduanya tidak berpengaruh, sehingga skill yang bergantung pada `GEMINI_API_KEY` akan gagal dengan `apiKey not configured` kecuali sandbox diberi variabel tersebut secara terpisah.
</Warning>

Gunakan salah satu dari:

- `agents.defaults.sandbox.docker.env` untuk backend Docker (atau `agents.list[].sandbox.docker.env` per agen).
- Bake env ke dalam image sandbox kustom atau lingkungan sandbox jarak jauh Anda.

## Terkait

<CardGroup cols={2}>
  <Card title="Skills" href="/id/tools/skills" icon="puzzle-piece">
    Apa itu Skills dan bagaimana pemuatannya.
  </Card>
  <Card title="Creating skills" href="/id/tools/creating-skills" icon="hammer">
    Menulis paket skill kustom.
  </Card>
  <Card title="Slash commands" href="/id/tools/slash-commands" icon="terminal">
    Katalog perintah native dan direktif chat.
  </Card>
  <Card title="Configuration reference" href="/id/gateway/configuration-reference" icon="gear">
    Skema lengkap `skills` dan `agents.skills`.
  </Card>
</CardGroup>
