---
read_when:
    - Menambahkan atau mengubah konfigurasi Skills
    - Menyesuaikan daftar izin yang dibundel atau perilaku instalasi
summary: Skema dan contoh konfigurasi Skills
title: Konfigurasi Skills
x-i18n:
    generated_at: "2026-05-10T19:56:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7dad312d69c93544d8e7f9537fdd50f02345166ea629291160a30f19f0a8b340
    source_path: tools/skills-config.md
    workflow: 16
---

Sebagian besar konfigurasi pemuat/instalasi skills berada di bawah `skills` dalam
`~/.openclaw/openclaw.json`. Visibilitas skill khusus agen berada di bawah
`agents.defaults.skills` dan `agents.list[].skills`.

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

Untuk pembuatan/penyuntingan gambar bawaan, gunakan `agents.defaults.imageGenerationModel`
beserta alat inti `image_generate`. `skills.entries.*` hanya untuk alur kerja skill
kustom atau pihak ketiga.

Jika Anda memilih penyedia/model gambar tertentu, konfigurasikan juga autentikasi/kunci API
penyedia tersebut. Contoh umum: `GEMINI_API_KEY` atau `GOOGLE_API_KEY` untuk
`google/*`, `OPENAI_API_KEY` untuk `openai/*`, dan `FAL_KEY` untuk `fal/*`.

Contoh:

- Penyiapan native bergaya Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Penyiapan native fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Daftar izin skill agen

Gunakan konfigurasi agen saat Anda menginginkan root skill mesin/workspace yang sama, tetapi
kumpulan skill yang terlihat berbeda untuk tiap agen.

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

- `agents.defaults.skills`: daftar izin dasar bersama untuk agen yang menghilangkan
  `agents.list[].skills`.
- Hilangkan `agents.defaults.skills` agar skills tidak dibatasi secara default.
- `agents.list[].skills`: kumpulan skill final eksplisit untuk agen tersebut; ini tidak
  digabungkan dengan default.
- `agents.list[].skills: []`: jangan tampilkan skill apa pun untuk agen tersebut.

## Bidang

- Root skill bawaan selalu mencakup `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills`, dan `<workspace>/skills`.
- `allowBundled`: daftar izin opsional hanya untuk skills **terbundel**. Jika disetel, hanya
  skills terbundel dalam daftar yang memenuhi syarat (skills terkelola, agen, dan workspace tidak terpengaruh).
- `load.extraDirs`: direktori skill tambahan untuk dipindai (presedensi terendah).
- `load.allowSymlinkTargets`: direktori target nyata tepercaya yang dapat menjadi hasil resolve
  folder skill bersymlink meskipun symlink berada di luar root target tersebut.
  Gunakan ini untuk tata letak sibling-repo yang disengaja seperti
  `~/.agents/skills/manager -> ~/Projects/manager/skills`.
- `load.watch`: awasi folder skill dan segarkan snapshot skills (default: true).
- `load.watchDebounceMs`: debounce untuk peristiwa pengawas skill dalam milidetik (default: 250).
- `install.preferBrew`: utamakan penginstal brew jika tersedia (default: true).
- `install.nodeManager`: preferensi penginstal node (`npm` | `pnpm` | `yarn` | `bun`, default: npm).
  Ini hanya memengaruhi **instalasi skill**; runtime Gateway tetap harus berupa Node
  (Bun tidak disarankan untuk WhatsApp/Telegram).
  - `openclaw setup --node-manager` lebih sempit dan saat ini menerima `npm`,
    `pnpm`, atau `bun`. Setel `skills.install.nodeManager: "yarn"` secara manual jika Anda
    menginginkan instalasi skill berbasis Yarn.
- `install.allowUploadedArchives`: izinkan klien Gateway `operator.admin` tepercaya
  menginstal arsip zip privat yang disiapkan melalui `skills.upload.*`
  (default: false). Ini hanya mengaktifkan jalur arsip unggahan; instalasi ClawHub
  normal tidak memerlukannya.
- `entries.<skillKey>`: override per skill.
- `agents.defaults.skills`: daftar izin skill default opsional yang diwarisi oleh agen
  yang menghilangkan `agents.list[].skills`.
- `agents.list[].skills`: daftar izin skill final opsional per agen; daftar eksplisit
  menggantikan default yang diwarisi alih-alih menggabungkannya.

## Repo saudara bersymlink

Secara default, setiap root skill adalah batas containment. Jika folder skill di bawah
`~/.agents/skills` adalah symlink yang resolve ke luar `~/.agents/skills`,
OpenClaw melewatinya dan mencatat log `Skipping escaped skill path outside its configured
root`.

Pertahankan tata letak symlink dan izinkan hanya root target tepercaya:

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

Dengan konfigurasi ini, symlink seperti
`~/.agents/skills/manager -> ~/Projects/manager/skills` diterima setelah
resolusi realpath. `extraDirs` juga memindai repo saudara secara langsung, sementara
`allowSymlinkTargets` mempertahankan jalur bersymlink untuk tata letak skill agen
yang sudah ada. Jaga entri target tetap sempit; jangan arahkan ke root luas seperti `~` atau
`~/Projects` kecuali setiap pohon skill di bawah root tersebut tepercaya.

Bidang per skill:

- `enabled`: setel `false` untuk menonaktifkan skill meskipun skill itu terbundel/terinstal.
- `env`: variabel lingkungan yang disuntikkan untuk run agen (hanya jika belum disetel).
- `apiKey`: kemudahan opsional untuk skills yang mendeklarasikan env var utama.
  Mendukung string teks biasa atau objek SecretRef (`{ source, provider, id }`).

## Catatan

- Key di bawah `entries` dipetakan ke nama skill secara default. Jika sebuah skill mendefinisikan
  `metadata.openclaw.skillKey`, gunakan key tersebut sebagai gantinya.
- Presedensi pemuatan adalah `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → skills terbundel →
  `skills.load.extraDirs`.
- Perubahan pada skills diambil pada giliran agen berikutnya saat pengawas diaktifkan.

### Skills sandbox dan env var

Saat sebuah sesi **disandbox**, proses skill berjalan di dalam backend sandbox yang dikonfigurasi. Sandbox **tidak** mewarisi `process.env` host.

<Warning>
  `env` global dan `skills.entries.<skill>.env`/`apiKey` hanya berlaku untuk run **host**. Di dalam sandbox, keduanya tidak berpengaruh, sehingga skill yang bergantung pada `GEMINI_API_KEY` akan gagal dengan `apiKey not configured` kecuali sandbox diberi variabel tersebut secara terpisah.
</Warning>

Gunakan salah satu dari:

- `agents.defaults.sandbox.docker.env` untuk backend Docker (atau per agen `agents.list[].sandbox.docker.env`).
- Bake env ke dalam image sandbox kustom atau lingkungan sandbox remote Anda.

## Terkait

<CardGroup cols={2}>
  <Card title="Skills" href="/id/tools/skills" icon="puzzle-piece">
    Apa itu skills dan cara pemuatannya.
  </Card>
  <Card title="Membuat skills" href="/id/tools/creating-skills" icon="hammer">
    Menulis paket skill kustom.
  </Card>
  <Card title="Perintah slash" href="/id/tools/slash-commands" icon="terminal">
    Katalog perintah native dan direktif chat.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Skema lengkap `skills` dan `agents.skills`.
  </Card>
</CardGroup>
