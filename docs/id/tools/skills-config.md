---
read_when:
    - Mengonfigurasi perilaku pemuatan, pemasangan, atau gating skill
    - Mengatur visibilitas skill per agen
    - Menyesuaikan batas Skill Workshop atau kebijakan persetujuan
sidebarTitle: Skills config
summary: Referensi lengkap untuk skema konfigurasi skills.*, allowlist agen, pengaturan workshop, dan penanganan variabel env sandbox.
title: Konfigurasi Skills
x-i18n:
    generated_at: "2026-06-27T18:21:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c1ba6beb1e06e7090dd6669320a91893bf26abe71633914e7564aebb59c637f
    source_path: tools/skills-config.md
    workflow: 16
---

Sebagian besar konfigurasi skills berada di bawah `skills` dalam
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
  beserta alat inti `image_generate`, bukan `skills.entries`. Entri skill
  hanya untuk alur kerja skill kustom atau pihak ketiga.
</Note>

## Pemuatan (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Direktori skill tambahan untuk dipindai, dengan prioritas paling rendah
  (setelah skill bawaan dan Plugin). Path diperluas dengan dukungan `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Direktori target nyata tepercaya yang dapat menjadi tujuan resolusi folder
  skill bersymlink, bahkan ketika symlink berada di luar root yang dikonfigurasi.
  Gunakan ini untuk tata letak repo saudara yang disengaja seperti
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Jaga daftar ini
  tetap sempit — jangan arahkan ke root luas seperti `~` atau `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Awasi folder skill dan segarkan snapshot skills ketika file `SKILL.md`
  berubah. Mencakup file bertingkat di bawah root skill yang dikelompokkan.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Jendela debounce untuk peristiwa pengawas skill dalam milidetik.
</ParamField>

## Instal (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Utamakan penginstal Homebrew ketika `brew` tersedia.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Preferensi manajer paket Node untuk instalasi skill. Ini hanya memengaruhi
  instalasi skill — runtime Gateway tetap harus menggunakan Node (Bun tidak
  direkomendasikan untuk WhatsApp/Telegram). Gunakan `openclaw setup --node-manager`
  untuk npm, pnpm, atau bun; atur `"yarn"` secara manual untuk instalasi skill
  yang didukung Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Izinkan klien Gateway `operator.admin` tepercaya untuk menginstal arsip zip
  privat yang disiapkan melalui `skills.upload.*`. Instalasi ClawHub normal
  tidak memerlukan pengaturan ini.
</ParamField>

## Kebijakan Instal Operator (`security.installPolicy`)

Gunakan `security.installPolicy` ketika operator membutuhkan perintah lokal
tepercaya untuk menyetujui atau memblokir instalasi skill dan Plugin dengan
kebijakan khusus host. Kebijakan berjalan setelah OpenClaw menyiapkan materi
sumber dan sebelum instalasi atau pembaruan berlanjut. Ini berlaku untuk skill
ClawHub, skill yang diunggah, skill Git/lokal, penginstal dependensi skill, dan
sumber instalasi/pembaruan Plugin.

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
  Mengaktifkan kebijakan instalasi milik operator. Ketika diaktifkan tanpa
  perintah `exec` yang valid, instalasi gagal tertutup.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Filter target opsional. Ketika dihilangkan, kebijakan berlaku untuk setiap
  target yang didukung agar instalasi baru tidak gagal terbuka secara tak
  terduga.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Path absolut ke executable kebijakan tepercaya. OpenClaw menjalankannya tanpa
  shell dan memvalidasi path sebelum digunakan.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Argumen statis yang diteruskan setelah `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Runtime waktu dinding maksimum untuk satu keputusan kebijakan.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Waktu maksimum tanpa output stdout atau stderr sebelum kebijakan gagal tertutup.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Byte gabungan stdout dan stderr maksimum yang diterima dari proses kebijakan.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Variabel lingkungan literal yang disediakan untuk proses kebijakan.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Nama variabel lingkungan yang disalin dari proses OpenClaw ke proses
  kebijakan. Hanya variabel bernama yang diteruskan.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Allowlist opsional direktori yang boleh berisi executable kebijakan.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Melewati pemeriksaan kepemilikan dan izin path perintah. Gunakan hanya ketika
  path dilindungi oleh mekanisme lain.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Mengizinkan path perintah yang dikonfigurasi berupa symlink. Target yang
  diresolusi tetap harus memenuhi pemeriksaan path lainnya. Argumen skrip
  interpreter harus berupa file reguler langsung, bukan symlink.
</ParamField>

Kebijakan menerima satu objek JSON di stdin dengan `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
`source` terstruktur opsional, `origin` terstruktur, dan `request`. Kebijakan
harus menulis satu objek JSON ke stdout: `{ "protocolVersion": 1, "decision": "allow" }`
atau `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Exit
non-nol, timeout, JSON cacat, field hilang, atau versi protokol yang tidak
didukung akan gagal tertutup.

OpenClaw tidak menjalankan kebijakan instalasi selama startup Gateway normal.
Instalasi dan pembaruan gagal tertutup ketika kebijakan diaktifkan tetapi tidak
tersedia. `openclaw doctor` melakukan validasi statis, dan `openclaw doctor --deep`
menjalankan probe instalasi sintetis terhadap perintah yang dikonfigurasi.

Pembaruan massal menerapkan kebijakan per target: pembaruan skill atau Plugin
yang diblokir gagal untuk target tersebut tanpa menonaktifkan kebijakan atau
melewati target berikutnya dalam batch.

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

## Allowlist skill bawaan

<ParamField path="skills.allowBundled" type="string[]">
  Allowlist opsional hanya untuk skill **bawaan**. Ketika diatur, hanya skill
  bawaan dalam daftar yang memenuhi syarat. Skill terkelola, level agen, dan
  workspace tidak terpengaruh.
</ParamField>

## Entri per skill (`skills.entries`)

Kunci di bawah `entries` cocok dengan `name` skill secara default. Jika suatu
skill mendefinisikan `metadata.openclaw.skillKey`, gunakan kunci tersebut
sebagai gantinya. Kutip nama yang memakai tanda hubung (JSON5 mengizinkan kunci
yang dikutip).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` menonaktifkan skill bahkan ketika bawaan atau terinstal. Skill bawaan
  `coding-agent` bersifat opt-in — atur ke `true` dan pastikan salah satu dari
  `claude`, `codex`, `opencode`, atau CLI lain yang didukung telah terinstal
  dan terautentikasi.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Field kemudahan untuk skill yang mendeklarasikan `metadata.openclaw.primaryEnv`.
  Mendukung string plaintext atau SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Variabel lingkungan yang disuntikkan untuk agent run. Hanya disuntikkan ketika
  variabel belum diatur dalam proses.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Wadah opsional untuk field konfigurasi kustom per skill.
</ParamField>

## Allowlist agen (`agents`)

Gunakan konfigurasi agen ketika Anda menginginkan root skill mesin/workspace
yang sama tetapi set skill yang terlihat berbeda per agen.

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
  Allowlist baseline bersama yang diwarisi oleh agen yang menghilangkan
  `agents.list[].skills`. Hilangkan seluruhnya agar skills tidak dibatasi
  secara default.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Set skill final eksplisit untuk agen tersebut. Daftar eksplisit **mengganti**
  default yang diwarisi — daftar tersebut tidak digabung. Atur ke `[]` agar
  tidak mengekspos skill untuk agen tersebut.
</ParamField>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Ketika `true`, agen dapat membuat proposal tertunda dari sinyal percakapan
  tahan lama setelah giliran berhasil. Pembuatan skill yang dipicu pengguna
  selalu melewati Skill Workshop terlepas dari pengaturan ini.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` memerlukan persetujuan operator sebelum apply, reject, atau
  quarantine yang diinisiasi agen. `auto` mengizinkan tindakan tersebut tanpa
  persetujuan.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Izinkan apply Skill Workshop untuk menulis melalui symlink skill workspace
  yang target nyatanya sudah dipercaya oleh `skills.load.allowSymlinkTargets`.
  Biarkan ini nonaktif kecuali apply proposal yang dihasilkan harus mengubah
  root skill bersama tersebut.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Jumlah maksimum proposal tertunda dan dikarantina yang dipertahankan per workspace.
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Ukuran maksimum isi proposal dalam byte. Deskripsi proposal dibatasi keras pada
  160 byte karena muncul dalam output discovery dan daftar.
</ParamField>

## Root skill yang ditautkan simbolik

Secara default, root skill workspace, project-agent, extra-dir, dan bawaan adalah
batas containment. Folder skill yang ditautkan simbolik di bawah `<workspace>/skills`
yang di-resolve ke luar root akan dilewati dengan pesan log.

Untuk mengizinkan tata letak symlink yang disengaja, deklarasikan target tepercaya:

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
diterima setelah resolusi realpath. `extraDirs` memindai repo saudara secara langsung;
`allowSymlinkTargets` mempertahankan path symlink untuk tata letak yang sudah ada.

Apply Skill Workshop tidak menulis melalui symlink tersebut secara default. Agar
Workshop apply dapat memutasi skill di bawah target symlink yang sudah dipercaya,
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

Direktori `~/.openclaw/skills` terkelola dan direktori personal `~/.agents/skills`
sudah menerima symlink direktori skill (containment `SKILL.md` per skill tetap
berlaku).

## Skill dalam sandbox dan variabel env

<Warning>
  `skills.entries.<skill>.env` dan `apiKey` hanya berlaku untuk proses **host**. Di dalam
  sandbox, keduanya tidak berpengaruh — skill yang bergantung pada `GEMINI_API_KEY` akan
  gagal dengan `apiKey not configured` kecuali sandbox diberi variabel tersebut
  secara terpisah.
</Warning>

Teruskan secret ke sandbox Docker dengan:

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
  Pengguna dengan akses daemon Docker dapat memeriksa nilai `sandbox.docker.env`
  melalui metadata Docker. Gunakan file secret yang di-mount, image kustom, atau
  jalur pengiriman lain ketika eksposur tersebut tidak dapat diterima.
</Note>

## Pengingat urutan pemuatan

```text
workspace/skills      (highest)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
bundled skills
skills.load.extraDirs (lowest)
```

Perubahan pada skill dan konfigurasi berlaku pada sesi baru berikutnya saat
watcher diaktifkan, atau pada giliran agen berikutnya saat watcher mendeteksi perubahan.

## Terkait

<CardGroup cols={2}>
  <Card title="Referensi Skills" href="/id/tools/skills" icon="puzzle-piece">
    Apa itu skill, urutan pemuatan, gating, dan format SKILL.md.
  </Card>
  <Card title="Membuat skill" href="/id/tools/creating-skills" icon="hammer">
    Menulis skill workspace kustom.
  </Card>
  <Card title="Skill Workshop" href="/id/tools/skill-workshop" icon="flask">
    Antrean proposal untuk skill yang dirancang agen.
  </Card>
  <Card title="Perintah slash" href="/id/tools/slash-commands" icon="terminal">
    Katalog perintah slash native dan direktif chat.
  </Card>
</CardGroup>
