---
read_when:
    - Anda perlu menjelaskan workspace agen atau tata letak filenya
    - Anda ingin mencadangkan atau memigrasikan workspace agen
sidebarTitle: Agent workspace
summary: 'Workspace agen: lokasi, tata letak, dan strategi cadangan'
title: Workspace agen
x-i18n:
    generated_at: "2026-04-26T11:26:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35d59d1f0dec05db30f9166a43bfa519d7299b08d093bbeb905d8f83e5cd022a
    source_path: concepts/agent-workspace.md
    workflow: 15
---

Workspace adalah rumah agen. Ini adalah satu-satunya direktori kerja yang digunakan untuk tool file dan untuk konteks workspace. Jaga agar tetap privat dan perlakukan sebagai memori.

Ini terpisah dari `~/.openclaw/`, yang menyimpan config, kredensial, dan sesi.

<Warning>
Workspace adalah **cwd default**, bukan sandbox keras. Tool me-resolve path relatif terhadap workspace, tetapi path absolut tetap dapat menjangkau lokasi lain di host kecuali sandboxing diaktifkan. Jika Anda memerlukan isolasi, gunakan [`agents.defaults.sandbox`](/id/gateway/sandboxing) (dan/atau config sandbox per agen).

Saat sandboxing diaktifkan dan `workspaceAccess` bukan `"rw"`, tool beroperasi di dalam workspace sandbox di bawah `~/.openclaw/sandboxes`, bukan workspace host Anda.
</Warning>

## Lokasi default

- Default: `~/.openclaw/workspace`
- Jika `OPENCLAW_PROFILE` diatur dan bukan `"default"`, default menjadi `~/.openclaw/workspace-<profile>`.
- Override di `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure`, atau `openclaw setup` akan membuat workspace dan mengisi file bootstrap jika belum ada.

<Note>
Salinan seed sandbox hanya menerima file biasa di dalam workspace; alias symlink/hardlink yang di-resolve ke luar workspace sumber akan diabaikan.
</Note>

Jika Anda sudah mengelola sendiri file workspace, Anda dapat menonaktifkan pembuatan file bootstrap:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Folder workspace tambahan

Instalasi lama mungkin telah membuat `~/openclaw`. Menyimpan beberapa direktori workspace sekaligus dapat menyebabkan drift auth atau status yang membingungkan, karena hanya satu workspace yang aktif pada satu waktu.

<Note>
**Rekomendasi:** pertahankan satu workspace aktif. Jika Anda tidak lagi menggunakan folder tambahan tersebut, arsipkan atau pindahkan ke Trash (misalnya `trash ~/openclaw`). Jika Anda sengaja menyimpan beberapa workspace, pastikan `agents.defaults.workspace` menunjuk ke workspace yang aktif.

`openclaw doctor` akan memberi peringatan saat mendeteksi direktori workspace tambahan.
</Note>

## Peta file workspace

Ini adalah file standar yang diharapkan OpenClaw di dalam workspace:

<AccordionGroup>
  <Accordion title="AGENTS.md — instruksi operasional">
    Instruksi operasional untuk agen dan cara agen harus menggunakan memori. Dimuat pada awal setiap sesi. Tempat yang baik untuk aturan, prioritas, dan detail "bagaimana harus bersikap".
  </Accordion>
  <Accordion title="SOUL.md — persona dan nada">
    Persona, nada, dan batasan. Dimuat di setiap sesi. Panduan: [panduan kepribadian SOUL.md](/id/concepts/soul).
  </Accordion>
  <Accordion title="USER.md — siapa pengguna">
    Siapa pengguna dan bagaimana menyapanya. Dimuat di setiap sesi.
  </Accordion>
  <Accordion title="IDENTITY.md — nama, vibe, emoji">
    Nama, vibe, dan emoji agen. Dibuat/diperbarui selama ritual bootstrap.
  </Accordion>
  <Accordion title="TOOLS.md — konvensi tool lokal">
    Catatan tentang tool dan konvensi lokal Anda. Tidak mengendalikan ketersediaan tool; ini hanya panduan.
  </Accordion>
  <Accordion title="HEARTBEAT.md — checklist heartbeat">
    Checklist kecil opsional untuk run heartbeat. Buat tetap singkat agar tidak boros token.
  </Accordion>
  <Accordion title="BOOT.md — checklist startup">
    Checklist startup opsional yang dijalankan otomatis saat gateway restart (ketika [hook internal](/id/automation/hooks) diaktifkan). Buat tetap singkat; gunakan tool pesan untuk pengiriman keluar.
  </Accordion>
  <Accordion title="BOOTSTRAP.md — ritual pertama kali">
    Ritual sekali jalan saat pertama kali. Hanya dibuat untuk workspace yang benar-benar baru. Hapus setelah ritual selesai.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — log memori harian">
    Log memori harian (satu file per hari). Direkomendasikan untuk membaca hari ini + kemarin saat sesi dimulai.
  </Accordion>
  <Accordion title="MEMORY.md — memori jangka panjang yang dikurasi (opsional)">
    Memori jangka panjang yang dikurasi. Hanya dimuat di sesi utama yang privat (bukan konteks bersama/grup). Lihat [Memori](/id/concepts/memory) untuk alur kerja dan flush memori otomatis.
  </Accordion>
  <Accordion title="skills/ — Skills workspace (opsional)">
    Skills khusus workspace. Lokasi Skills dengan prioritas tertinggi untuk workspace tersebut. Mengoverride skills agen proyek, skills agen pribadi, Skills terkelola, Skills bawaan, dan `skills.load.extraDirs` saat nama bertabrakan.
  </Accordion>
  <Accordion title="canvas/ — file UI Canvas (opsional)">
    File UI Canvas untuk tampilan node (misalnya `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Jika ada file bootstrap yang hilang, OpenClaw menyuntikkan penanda "file hilang" ke dalam sesi dan melanjutkan. File bootstrap yang besar akan dipotong saat disuntikkan; sesuaikan batas dengan `agents.defaults.bootstrapMaxChars` (default: 12000) dan `agents.defaults.bootstrapTotalMaxChars` (default: 60000). `openclaw setup` dapat membuat ulang default yang hilang tanpa menimpa file yang sudah ada.
</Note>

## Apa yang TIDAK ada di workspace

Semua ini berada di bawah `~/.openclaw/` dan TIDAK boleh di-commit ke repo workspace:

- `~/.openclaw/openclaw.json` (config)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (profil auth model: OAuth + API key)
- `~/.openclaw/credentials/` (status channel/provider ditambah data impor OAuth lama)
- `~/.openclaw/agents/<agentId>/sessions/` (transkrip sesi + metadata)
- `~/.openclaw/skills/` (Skills terkelola)

Jika Anda perlu memigrasikan sesi atau config, salin secara terpisah dan jangan masukkan ke version control.

## Cadangan Git (direkomendasikan, privat)

Perlakukan workspace sebagai memori privat. Simpan di repo git **privat** agar dapat dicadangkan dan dipulihkan.

Jalankan langkah-langkah ini di mesin tempat Gateway berjalan (di situlah workspace berada).

<Steps>
  <Step title="Inisialisasi repo">
    Jika git terpasang, workspace yang benar-benar baru akan diinisialisasi secara otomatis. Jika workspace ini belum menjadi repo, jalankan:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Tambahkan workspace agen"
    ```

  </Step>
  <Step title="Tambahkan remote privat">
    <Tabs>
      <Tab title="GitHub web UI">
        1. Buat repository **privat** baru di GitHub.
        2. Jangan inisialisasi dengan README (menghindari konflik merge).
        3. Salin URL remote HTTPS.
        4. Tambahkan remote dan push:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="GitHub CLI (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="GitLab web UI">
        1. Buat repository **privat** baru di GitLab.
        2. Jangan inisialisasi dengan README (menghindari konflik merge).
        3. Salin URL remote HTTPS.
        4. Tambahkan remote dan push:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Pembaruan berkelanjutan">
    ```bash
    git status
    git add .
    git commit -m "Perbarui memori"
    git push
    ```
  </Step>
</Steps>

## Jangan commit secret

<Warning>
Bahkan di repo privat, hindari menyimpan secret di workspace:

- API key, token OAuth, kata sandi, atau kredensial privat.
- Apa pun di bawah `~/.openclaw/`.
- Dump mentah chat atau lampiran sensitif.

Jika Anda harus menyimpan referensi sensitif, gunakan placeholder dan simpan secret sebenarnya di tempat lain (password manager, environment variable, atau `~/.openclaw/`).
</Warning>

Contoh awal `.gitignore` yang disarankan:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Memindahkan workspace ke mesin baru

<Steps>
  <Step title="Clone repo">
    Clone repo ke path yang diinginkan (default `~/.openclaw/workspace`).
  </Step>
  <Step title="Perbarui config">
    Atur `agents.defaults.workspace` ke path tersebut di `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Isi file yang hilang">
    Jalankan `openclaw setup --workspace <path>` untuk mengisi file yang hilang.
  </Step>
  <Step title="Salin sesi (opsional)">
    Jika Anda memerlukan sesi, salin `~/.openclaw/agents/<agentId>/sessions/` dari mesin lama secara terpisah.
  </Step>
</Steps>

## Catatan lanjutan

- Routing multi-agen dapat menggunakan workspace yang berbeda per agen. Lihat [Routing channel](/id/channels/channel-routing) untuk konfigurasi routing.
- Jika `agents.defaults.sandbox` diaktifkan, sesi non-utama dapat menggunakan workspace sandbox per-sesi di bawah `agents.defaults.sandbox.workspaceRoot`.

## Terkait

- [Heartbeat](/id/gateway/heartbeat) — file workspace HEARTBEAT.md
- [Sandboxing](/id/gateway/sandboxing) — akses workspace di lingkungan sandbox
- [Sesi](/id/concepts/session) — path penyimpanan sesi
- [Standing orders](/id/automation/standing-orders) — instruksi persisten dalam file workspace
