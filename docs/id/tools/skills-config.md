---
read_when:
    - Mengonfigurasi perilaku pemuatan, penginstalan, atau pembatasan Skills
    - Mengatur visibilitas Skills per agen
    - Menyesuaikan batas Skill Workshop atau kebijakan persetujuan
sidebarTitle: Skills config
summary: Referensi lengkap untuk skema konfigurasi skills.*, daftar izin agen, pengaturan workshop, dan penanganan variabel lingkungan sandbox.
title: Konfigurasi Skills
x-i18n:
    generated_at: "2026-07-12T14:47:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ed1ec20aa102b458a9485a1ada1bb7566c97d28b1f43caa28f52b3f5bdc381e
    source_path: tools/skills-config.md
    workflow: 16
---

Sebagian besar konfigurasi Skills berada di bawah `skills` dalam
`~/.openclaw/openclaw.json`. Visibilitas khusus agen berada di bawah
`agents.defaults.skills` dan `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm",
      allowUploadedArchives: false,
    },
    workshop: {
      autonomous: { enabled: false },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "pending",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<Note>
  Untuk pembuatan gambar bawaan, gunakan `agents.defaults.imageGenerationModel`
  bersama alat inti `image_generate`, bukan `skills.entries`. Entri Skills
  hanya ditujukan untuk alur kerja Skills khusus atau pihak ketiga.
</Note>

## Pemuatan (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Direktori Skills tambahan yang akan dipindai, dengan prioritas terendah (di bawah
  Skills bawaan dan Plugin). Path diperluas dengan dukungan `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Direktori target nyata tepercaya yang boleh menjadi tujuan resolusi folder Skills
  bersymlink, bahkan ketika symlink berada di luar root yang dikonfigurasi. Gunakan ini untuk
  tata letak repositori sejajar yang disengaja seperti
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Jaga agar daftar ini
  tetap sempit — jangan arahkan ke root luas seperti `~` atau `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Pantau folder Skills dan perbarui snapshot Skills ketika file `SKILL.md`
  berubah. Mencakup file bertingkat di bawah root Skills yang dikelompokkan.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Jendela debounce untuk peristiwa pemantau Skills dalam milidetik.
</ParamField>

## Instalasi (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Utamakan penginstal Homebrew ketika `brew` tersedia.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Preferensi pengelola paket Node untuk instalasi Skills. Ini hanya memengaruhi instalasi
  Skills — runtime Gateway harus tetap menggunakan Node (Bun tidak
  direkomendasikan untuk WhatsApp/Telegram). `openclaw setup --node-manager` dan
  `openclaw onboard --node-manager` menerima `npm`, `pnpm`, atau `bun`; tetapkan
  `"yarn"` secara langsung dalam konfigurasi untuk instalasi Skills berbasis Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Izinkan klien Gateway `operator.admin` tepercaya menginstal arsip zip privat
  yang disiapkan melalui `skills.upload.*`. Instalasi ClawHub biasa tidak
  memerlukan pengaturan ini.
</ParamField>

## Kebijakan Instalasi Operator (`security.installPolicy`)

Gunakan `security.installPolicy` ketika operator memerlukan perintah lokal tepercaya untuk
menyetujui atau memblokir instalasi Skills dan Plugin dengan kebijakan khusus host. Kebijakan
berjalan setelah OpenClaw menyiapkan materi sumber dan sebelum instalasi
atau pembaruan dilanjutkan. Kebijakan ini berlaku untuk Skills ClawHub, Skills yang diunggah, Skills
Git/lokal, penginstal dependensi Skills, serta sumber instalasi/pembaruan Plugin.

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      // Omit targets to cover every supported target.
      targets: ["skill", "plugin"],
      exec: {
        source: "exec",
        command: "/usr/local/bin/openclaw-install-policy",
        args: ["--json"],
        timeoutMs: 10000,
        noOutputTimeoutMs: 10000,
        maxOutputBytes: 1048576,
        passEnv: ["OPENCLAW_STATE_DIR", "PATH"],
        env: { POLICY_MODE: "strict" },
        trustedDirs: ["/usr/local/bin"],
      },
    },
  },
}
```

<ParamField path="security.installPolicy.enabled" type="boolean" default="false">
  Mengaktifkan kebijakan instalasi milik operator. Jika diaktifkan tanpa perintah `exec`
  yang valid, instalasi gagal secara tertutup.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Filter target opsional. Jika dihilangkan, kebijakan berlaku untuk setiap target yang
  didukung agar instalasi baru tidak tiba-tiba gagal secara terbuka.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Path absolut ke berkas eksekutabel kebijakan tepercaya. OpenClaw menjalankannya tanpa
  shell dan memvalidasi path tersebut sebelum digunakan.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Argumen statis yang diteruskan setelah `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Durasi waktu nyata maksimum untuk satu keputusan kebijakan.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Waktu maksimum tanpa keluaran stdout atau stderr sebelum kebijakan gagal
  secara tertutup.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Jumlah maksimum gabungan byte stdout dan stderr yang diterima dari proses kebijakan.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Variabel lingkungan literal yang diberikan kepada proses kebijakan.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Nama variabel lingkungan yang disalin dari proses OpenClaw ke
  proses kebijakan. Hanya variabel yang disebutkan yang diteruskan.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Daftar izin opsional untuk direktori yang boleh berisi berkas eksekutabel kebijakan.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Melewati pemeriksaan kepemilikan dan izin path perintah. Gunakan hanya ketika
  path dilindungi oleh mekanisme lain.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Mengizinkan path perintah yang dikonfigurasi berupa symlink. Target hasil resolusi
  tetap harus memenuhi pemeriksaan path lainnya. Argumen skrip interpreter harus
  berupa file reguler langsung, bukan symlink.
</ParamField>

Kebijakan menerima satu objek JSON pada stdin dengan `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
`source` terstruktur opsional, `origin` terstruktur, dan `request`. Kebijakan harus
menulis satu objek JSON pada stdout: `{ "protocolVersion": 1, "decision": "allow" }`
atau `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Kode keluar
bukan nol, batas waktu terlampaui, JSON salah format, kolom yang hilang, atau versi protokol yang
tidak didukung akan gagal secara tertutup.

OpenClaw tidak menjalankan kebijakan instalasi selama startup Gateway normal.
Instalasi dan pembaruan gagal secara tertutup ketika kebijakan diaktifkan tetapi tidak tersedia.
`openclaw doctor` melakukan validasi statis; `openclaw doctor --deep`
menjalankan probe instalasi sintetis terhadap perintah yang dikonfigurasi.

Pembaruan massal menerapkan kebijakan per target: pembaruan Skills atau Plugin yang diblokir akan menggagalkan
target tersebut tanpa menonaktifkan kebijakan atau melewati target berikutnya dalam
batch.

Contoh stdin:

```json
{
  "protocolVersion": 1,
  "openclawVersion": "2026.6.1",
  "targetType": "skill",
  "targetName": "weather",
  "sourcePath": "/var/folders/.../openclaw-skill-clawhub/root",
  "sourcePathKind": "directory",
  "source": {
    "kind": "clawhub",
    "authority": "openclaw",
    "mutable": false,
    "network": true
  },
  "origin": {
    "type": "clawhub",
    "registry": "https://clawhub.openclaw.ai",
    "slug": "weather",
    "version": "1.0.0"
  },
  "request": {
    "kind": "skill-install",
    "mode": "install",
    "requestedSpecifier": "clawhub:weather@1.0.0"
  },
  "skill": {
    "installId": "clawhub"
  }
}
```

Perintah kebijakan minimal:

```js
#!/usr/bin/env node

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => {
  const request = JSON.parse(input);
  if (request.targetType === "plugin" && request.source?.kind === "local-path") {
    process.stdout.write(
      JSON.stringify({
        protocolVersion: 1,
        decision: "block",
        reason: "local plugin paths are not approved on this host",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## Daftar izin Skills bawaan

<ParamField path="skills.allowBundled" type="string[]">
  Daftar izin opsional khusus untuk Skills **bawaan**. Jika ditetapkan, hanya Skills bawaan
  dalam daftar yang memenuhi syarat. Skills terkelola, tingkat agen, dan ruang kerja
  tidak terpengaruh.
</ParamField>

## Entri per Skills (`skills.entries`)

Secara default, kunci di bawah `entries` cocok dengan `name` Skills. Jika Skills mendefinisikan
`metadata.openclaw.skillKey`, gunakan kunci tersebut sebagai gantinya. Beri tanda kutip pada nama yang mengandung tanda hubung
(JSON5 mengizinkan kunci yang diberi tanda kutip).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` menonaktifkan Skills meskipun bawaan atau terinstal. Skills bawaan
  `coding-agent` bersifat opsional — tetapkan ke `true` dan pastikan salah satu dari
  `claude`, `codex`, `opencode`, atau CLI lain yang didukung telah terinstal dan
  diautentikasi.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Kolom praktis untuk Skills yang mendeklarasikan `metadata.openclaw.primaryEnv`.
  Mendukung string teks biasa atau SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Variabel lingkungan yang disuntikkan untuk proses agen. Hanya disuntikkan ketika
  variabel belum ditetapkan dalam proses.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Wadah opsional untuk kolom konfigurasi khusus per Skills.
</ParamField>

## Daftar izin agen (`agents`)

Gunakan konfigurasi agen ketika Anda menginginkan root Skills mesin/ruang kerja yang sama tetapi
kumpulan Skills yang terlihat berbeda untuk setiap agen.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // shared baseline
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults entirely
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<ParamField path="agents.defaults.skills" type="string[]">
  Daftar izin dasar bersama yang diwarisi oleh agen yang tidak menyertakan
  `agents.list[].skills`. Hilangkan sepenuhnya agar Skills tidak dibatasi secara
  default.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Kumpulan Skills akhir eksplisit untuk agen tersebut. Daftar eksplisit **menggantikan**
  nilai default yang diwarisi — daftar tersebut tidak digabungkan. Tetapkan ke `[]` agar tidak mengekspos Skills apa pun kepada
  agen tersebut.
</ParamField>

<Warning>
  Daftar izin Skills agen merupakan filter visibilitas dan pemuatan untuk penemuan
  Skills OpenClaw, prompt, penemuan perintah garis miring, sinkronisasi sandbox, dan snapshot
  Skills. Daftar ini bukan batas otorisasi pada waktu eksekusi shell. Jika agen
  dapat menjalankan `exec` host, shell tersebut tetap dapat menjalankan klien eksternal atau membaca
  file host yang terlihat oleh pengguna eksekusi, termasuk registri klien MCP
  seperti `~/.openclaw/skills/config/mcporter.json`. Untuk isolasi MCP
  per agen, gabungkan daftar izin Skills dengan isolasi sandbox/pengguna OS,
  tolak atau batasi secara ketat `exec` host, dan utamakan kredensial per agen
  di server MCP.
</Warning>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Jika `true`, agen dapat membuat proposal tertunda dari sinyal percakapan
  persisten setelah giliran berhasil. Pembuatan skill yang diminta pengguna selalu
  melalui Skill Workshop, terlepas dari pengaturan ini.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` memerlukan persetujuan operator sebelum penerapan, penolakan,
  atau karantina yang dimulai agen. `auto` mengizinkan tindakan tersebut tanpa persetujuan.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Izinkan penerapan Skill Workshop menulis melalui symlink skill ruang kerja yang
  target sebenarnya telah dipercaya oleh `skills.load.allowSymlinkTargets`. Biarkan
  ini dinonaktifkan kecuali penerapan proposal yang dihasilkan harus mengubah akar
  skill bersama tersebut.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Jumlah maksimum proposal tertunda dan dikarantina yang disimpan per ruang kerja (rentang yang
  diizinkan: 1-200).
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Ukuran maksimum isi proposal dalam byte (rentang yang diizinkan: 1024-200000). Deskripsi
  proposal dibatasi secara terpisah hingga maksimal 160 byte karena muncul
  dalam keluaran penemuan dan daftar.
</ParamField>

Lihat [Skill Workshop](/id/tools/skill-workshop) untuk siklus hidup proposal, perintah
CLI, parameter alat agen, dan metode Gateway yang dikendalikan konfigurasi ini.

## Akar skill dengan symlink

Secara default, akar skill ruang kerja, agen proyek, direktori tambahan, dan bawaan merupakan
batas penahanan. Folder skill dengan symlink di bawah `<workspace>/skills`
yang mengarah ke luar akar akan dilewati dengan pesan log.

Untuk mengizinkan tata letak symlink yang disengaja, nyatakan target tepercaya:

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

Dengan konfigurasi ini, `<workspace>/skills/manager -> ~/Projects/manager/skills`
diterima setelah resolusi realpath. `extraDirs` memindai repositori sejawat
secara langsung; `allowSymlinkTargets` mempertahankan jalur dengan symlink untuk tata letak
yang sudah ada.

Secara default, penerapan Skill Workshop tidak menulis melalui symlink tersebut. Untuk
mengizinkan penerapan Workshop mengubah skill di bawah target symlink yang telah dipercaya,
aktifkan secara terpisah:

```json5
{
  skills: {
    load: {
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    workshop: {
      allowSymlinkTargetWrites: true,
    },
  },
}
```

Direktori `~/.openclaw/skills` terkelola dan `~/.agents/skills` pribadi
telah menerima symlink direktori skill tanpa syarat (penahanan `SKILL.md`
per skill tetap berlaku) — `allowSymlinkTargets` hanya diperlukan
untuk akar ruang kerja, direktori tambahan, dan agen proyek (`<workspace>/.agents/skills`).

## Skill dalam sandbox dan variabel lingkungan

<Warning>
  `skills.entries.<skill>.env` dan `apiKey` hanya berlaku untuk eksekusi di **host**.
  Di dalam sandbox, keduanya tidak berpengaruh — skill yang bergantung pada
  `GEMINI_API_KEY` akan gagal dengan `apiKey not configured` kecuali variabel tersebut
  diberikan secara terpisah kepada sandbox.
</Warning>

Teruskan rahasia ke sandbox Docker dengan:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          env: { GEMINI_API_KEY: "your-key-here" },
        },
      },
    },
  },
}
```

<Note>
  Pengguna dengan akses ke daemon Docker dapat memeriksa nilai `sandbox.docker.env`
  melalui metadata Docker. Gunakan berkas rahasia yang dipasang, citra khusus, atau
  jalur pengiriman lain jika paparan tersebut tidak dapat diterima.
</Note>

## Pengingat urutan pemuatan

```text
workspace/skills      (tertinggi)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
skill bawaan
skills.load.extraDirs (terendah)
```

Perubahan pada skill dan konfigurasi berlaku pada sesi baru berikutnya ketika
pemantau diaktifkan, atau pada giliran agen berikutnya ketika pemantau mendeteksi
perubahan.

## Terkait

<CardGroup cols={2}>
  <Card title="Referensi Skills" href="/id/tools/skills" icon="puzzle-piece">
    Pengertian skill, urutan pemuatan, pembatasan akses, dan format SKILL.md.
  </Card>
  <Card title="Membuat skill" href="/id/tools/creating-skills" icon="hammer">
    Menulis skill ruang kerja khusus.
  </Card>
  <Card title="Skill Workshop" href="/id/tools/skill-workshop" icon="flask">
    Antrean proposal untuk skill yang disusun agen.
  </Card>
  <Card title="Perintah garis miring" href="/id/tools/slash-commands" icon="terminal">
    Katalog perintah garis miring native dan direktif obrolan.
  </Card>
</CardGroup>
