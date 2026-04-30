---
read_when:
    - Anda perlu menjelaskan ruang kerja agen atau tata letak berkasnya
    - Anda ingin mencadangkan atau memigrasikan ruang kerja agen
sidebarTitle: Agent workspace
summary: 'Ruang kerja agen: lokasi, tata letak, dan strategi pencadangan'
title: Ruang kerja agen
x-i18n:
    generated_at: "2026-04-30T20:05:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1ccf74cbec3ff20f4c1c1ce52f099a7ca3365b2536b0aad6ff1d3a5fafcca0a
    source_path: concepts/agent-workspace.md
    workflow: 16
---

Ruang kerja adalah rumah agen. Ini adalah satu-satunya direktori kerja yang digunakan untuk alat file dan konteks ruang kerja. Jaga agar tetap privat dan perlakukan sebagai memori.

Ini terpisah dari `~/.openclaw/`, yang menyimpan konfigurasi, kredensial, dan sesi.

<Warning>
Ruang kerja adalah **cwd default**, bukan sandbox ketat. Alat menyelesaikan path relatif terhadap ruang kerja, tetapi path absolut tetap dapat menjangkau tempat lain di host kecuali sandboxing diaktifkan. Jika Anda memerlukan isolasi, gunakan [`agents.defaults.sandbox`](/id/gateway/sandboxing) (dan/atau konfigurasi sandbox per agen).

Saat sandboxing diaktifkan dan `workspaceAccess` bukan `"rw"`, alat beroperasi di dalam ruang kerja sandbox di bawah `~/.openclaw/sandboxes`, bukan ruang kerja host Anda.
</Warning>

## Lokasi default

- Default: `~/.openclaw/workspace`
- Jika `OPENCLAW_PROFILE` disetel dan bukan `"default"`, default menjadi `~/.openclaw/workspace-<profile>`.
- Timpa di `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure`, atau `openclaw setup` akan membuat ruang kerja dan mengisi file bootstrap jika belum ada.

<Note>
Salinan seed sandbox hanya menerima file reguler di dalam ruang kerja; alias symlink/hardlink yang mengarah ke luar ruang kerja sumber akan diabaikan.
</Note>

Jika Anda sudah mengelola file ruang kerja sendiri, Anda dapat menonaktifkan pembuatan file bootstrap:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Folder ruang kerja tambahan

Instalasi lama mungkin telah membuat `~/openclaw`. Menyimpan beberapa direktori ruang kerja dapat menyebabkan kebingungan auth atau drift status, karena hanya satu ruang kerja yang aktif pada satu waktu.

<Note>
**Rekomendasi:** pertahankan satu ruang kerja aktif. Jika Anda tidak lagi menggunakan folder tambahan, arsipkan atau pindahkan ke Trash (misalnya `trash ~/openclaw`). Jika Anda sengaja mempertahankan beberapa ruang kerja, pastikan `agents.defaults.workspace` menunjuk ke yang aktif.

`openclaw doctor` memperingatkan saat mendeteksi direktori ruang kerja tambahan.
</Note>

## Peta file ruang kerja

Berikut adalah file standar yang diharapkan OpenClaw di dalam ruang kerja:

<AccordionGroup>
  <Accordion title="AGENTS.md — instruksi operasi">
    Instruksi operasi untuk agen dan cara agen harus menggunakan memori. Dimuat pada awal setiap sesi. Tempat yang baik untuk aturan, prioritas, dan detail "cara berperilaku".
  </Accordion>
  <Accordion title="SOUL.md — persona dan nada">
    Persona, nada, dan batasan. Dimuat setiap sesi. Panduan: [panduan kepribadian SOUL.md](/id/concepts/soul).
  </Accordion>
  <Accordion title="USER.md — siapa pengguna">
    Siapa pengguna dan cara menyapa mereka. Dimuat setiap sesi.
  </Accordion>
  <Accordion title="IDENTITY.md — nama, vibe, emoji">
    Nama, vibe, dan emoji agen. Dibuat/diperbarui selama ritual bootstrap.
  </Accordion>
  <Accordion title="TOOLS.md — konvensi alat lokal">
    Catatan tentang alat dan konvensi lokal Anda. Tidak mengontrol ketersediaan alat; ini hanya panduan.
  </Accordion>
  <Accordion title="HEARTBEAT.md — daftar periksa Heartbeat">
    Daftar periksa kecil opsional untuk run Heartbeat. Buat singkat untuk menghindari pemborosan token.
  </Accordion>
  <Accordion title="BOOT.md — daftar periksa startup">
    Daftar periksa startup opsional yang dijalankan otomatis saat Gateway dimulai ulang (saat [hook internal](/id/automation/hooks) diaktifkan). Buat singkat; gunakan alat pesan untuk pengiriman keluar.
  </Accordion>
  <Accordion title="BOOTSTRAP.md — ritual pertama kali">
    Ritual pertama kali satu kali. Hanya dibuat untuk ruang kerja yang benar-benar baru. Hapus setelah ritual selesai.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — log memori harian">
    Log memori harian (satu file per hari). Disarankan membaca hari ini + kemarin saat sesi dimulai.
  </Accordion>
  <Accordion title="MEMORY.md — memori jangka panjang terkurasi (opsional)">
    Memori jangka panjang terkurasi. Hanya muat di sesi utama yang privat (bukan konteks bersama/grup). Lihat [Memori](/id/concepts/memory) untuk workflow dan flush memori otomatis.
  </Accordion>
  <Accordion title="skills/ — Skills ruang kerja (opsional)">
    Skills khusus ruang kerja. Lokasi skill dengan prioritas tertinggi untuk ruang kerja tersebut. Menimpa skill agen proyek, skill agen pribadi, skill terkelola, skill bawaan, dan `skills.load.extraDirs` saat nama bertabrakan.
  </Accordion>
  <Accordion title="canvas/ — file UI Canvas (opsional)">
    File UI Canvas untuk tampilan node (misalnya `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Jika ada file bootstrap yang hilang, OpenClaw menyuntikkan penanda "file hilang" ke dalam sesi dan melanjutkan. File bootstrap besar dipotong saat disuntikkan; sesuaikan batas dengan `agents.defaults.bootstrapMaxChars` (default: 12000) dan `agents.defaults.bootstrapTotalMaxChars` (default: 60000). `openclaw setup` dapat membuat ulang default yang hilang tanpa menimpa file yang sudah ada.
</Note>

## Yang TIDAK ada di ruang kerja

Ini berada di bawah `~/.openclaw/` dan TIDAK boleh di-commit ke repo ruang kerja:

- `~/.openclaw/openclaw.json` (konfigurasi)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (profil auth model: OAuth + kunci API)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (akun runtime Codex per agen, konfigurasi, skills, plugins, dan status thread native)
- `~/.openclaw/credentials/` (status channel/provider plus data impor OAuth lama)
- `~/.openclaw/agents/<agentId>/sessions/` (transkrip sesi + metadata)
- `~/.openclaw/skills/` (skills terkelola)

Jika Anda perlu memigrasikan sesi atau konfigurasi, salin secara terpisah dan jauhkan dari kontrol versi.

## Cadangan Git (disarankan, privat)

Perlakukan ruang kerja sebagai memori privat. Letakkan di repo git **privat** agar dicadangkan dan dapat dipulihkan.

Jalankan langkah-langkah ini di mesin tempat Gateway berjalan (di situlah ruang kerja berada).

<Steps>
  <Step title="Inisialisasi repo">
    Jika git terinstal, ruang kerja yang benar-benar baru diinisialisasi otomatis. Jika ruang kerja ini belum menjadi repo, jalankan:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Tambahkan remote privat">
    <Tabs>
      <Tab title="UI web GitHub">
        1. Buat repositori **privat** baru di GitHub.
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
      <Tab title="UI web GitLab">
        1. Buat repositori **privat** baru di GitLab.
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
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## Jangan commit rahasia

<Warning>
Bahkan di repo privat, hindari menyimpan rahasia di ruang kerja:

- Kunci API, token OAuth, kata sandi, atau kredensial privat.
- Apa pun di bawah `~/.openclaw/`.
- Dump mentah chat atau lampiran sensitif.

Jika Anda harus menyimpan referensi sensitif, gunakan placeholder dan simpan rahasia asli di tempat lain (pengelola kata sandi, variabel lingkungan, atau `~/.openclaw/`).
</Warning>

Starter `.gitignore` yang disarankan:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Memindahkan ruang kerja ke mesin baru

<Steps>
  <Step title="Clone repo">
    Clone repo ke path yang diinginkan (default `~/.openclaw/workspace`).
  </Step>
  <Step title="Perbarui konfigurasi">
    Setel `agents.defaults.workspace` ke path tersebut di `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Seed file yang hilang">
    Jalankan `openclaw setup --workspace <path>` untuk mengisi file yang hilang.
  </Step>
  <Step title="Salin sesi (opsional)">
    Jika Anda memerlukan sesi, salin `~/.openclaw/agents/<agentId>/sessions/` dari mesin lama secara terpisah.
  </Step>
</Steps>

## Catatan lanjutan

- Routing multi-agen dapat menggunakan ruang kerja berbeda per agen. Lihat [Routing channel](/id/channels/channel-routing) untuk konfigurasi routing.
- Jika `agents.defaults.sandbox` diaktifkan, sesi non-utama dapat menggunakan ruang kerja sandbox per sesi di bawah `agents.defaults.sandbox.workspaceRoot`.

## Terkait

- [Heartbeat](/id/gateway/heartbeat) — file ruang kerja HEARTBEAT.md
- [Sandboxing](/id/gateway/sandboxing) — akses ruang kerja di lingkungan sandbox
- [Sesi](/id/concepts/session) — path penyimpanan sesi
- [Standing orders](/id/automation/standing-orders) — instruksi persisten dalam file ruang kerja
