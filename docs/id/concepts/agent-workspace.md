---
read_when:
    - Anda perlu menjelaskan workspace agen atau tata letak filenya
    - Anda ingin mencadangkan atau memigrasikan ruang kerja agen
sidebarTitle: Agent workspace
summary: 'Ruang kerja agen: lokasi, tata letak, dan strategi pencadangan'
title: Ruang kerja agen
x-i18n:
    generated_at: "2026-06-27T17:22:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6020aa96b2aa829a9684164994d1fb1fb1b31157c47b60e947ad82f9f5508e1c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

Ruang kerja adalah rumah agen. Ini adalah satu-satunya direktori kerja yang digunakan untuk alat file dan konteks ruang kerja. Jaga agar tetap privat dan perlakukan sebagai memori.

Ini terpisah dari `~/.openclaw/`, yang menyimpan konfigurasi, kredensial, dan sesi.

<Warning>
Ruang kerja adalah **cwd default**, bukan sandbox yang ketat. Alat menyelesaikan path relatif terhadap ruang kerja, tetapi path absolut masih dapat menjangkau tempat lain di host kecuali sandboxing diaktifkan. Jika Anda membutuhkan isolasi, gunakan [`agents.defaults.sandbox`](/id/gateway/sandboxing) (dan/atau konfigurasi sandbox per agen).

Saat sandboxing diaktifkan dan `workspaceAccess` bukan `"rw"`, alat beroperasi di dalam ruang kerja sandbox di bawah `~/.openclaw/sandboxes`, bukan ruang kerja host Anda.
</Warning>

## Lokasi default

- Default: `~/.openclaw/workspace`
- Jika `OPENCLAW_PROFILE` ditetapkan dan bukan `"default"`, default menjadi `~/.openclaw/workspace-<profile>`.
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

`openclaw onboard`, `openclaw configure`, atau `openclaw setup` akan membuat ruang kerja dan menanamkan file bootstrap jika belum ada.

<Note>
Salinan seed sandbox hanya menerima file biasa di dalam ruang kerja; alias symlink/hardlink yang mengarah ke luar ruang kerja sumber diabaikan.
</Note>

Jika Anda sudah mengelola file ruang kerja sendiri, Anda dapat menonaktifkan pembuatan file bootstrap:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Folder ruang kerja tambahan

Instalasi lama mungkin telah membuat `~/openclaw`. Menyimpan beberapa direktori ruang kerja dapat menyebabkan drift autentikasi atau status yang membingungkan, karena hanya satu ruang kerja yang aktif pada satu waktu.

<Note>
**Rekomendasi:** pertahankan satu ruang kerja aktif. Jika Anda tidak lagi menggunakan folder tambahan, arsipkan atau pindahkan ke Trash (misalnya `trash ~/openclaw`). Jika Anda sengaja menyimpan beberapa ruang kerja, pastikan `agents.defaults.workspace` menunjuk ke yang aktif.

`openclaw doctor` memperingatkan saat mendeteksi direktori ruang kerja tambahan.
</Note>

## Peta file ruang kerja

Ini adalah file standar yang diharapkan OpenClaw di dalam ruang kerja:

<AccordionGroup>
  <Accordion title="AGENTS.md - instruksi operasi">
    Instruksi operasi untuk agen dan cara agen menggunakan memori. Dimuat pada awal setiap sesi. Tempat yang baik untuk aturan, prioritas, dan detail "cara berperilaku".
  </Accordion>
  <Accordion title="SOUL.md - persona dan nada">
    Persona, nada, dan batasan. Dimuat setiap sesi. Panduan: [panduan kepribadian SOUL.md](/id/concepts/soul).
  </Accordion>
  <Accordion title="USER.md - siapa pengguna">
    Siapa pengguna dan cara menyapa mereka. Dimuat setiap sesi.
  </Accordion>
  <Accordion title="IDENTITY.md - nama, vibe, emoji">
    Nama, vibe, dan emoji agen. Dibuat/diperbarui selama ritual bootstrap.
  </Accordion>
  <Accordion title="TOOLS.md - konvensi alat lokal">
    Catatan tentang alat dan konvensi lokal Anda. Tidak mengontrol ketersediaan alat; ini hanya panduan.
  </Accordion>
  <Accordion title="HEARTBEAT.md - daftar periksa heartbeat">
    Daftar periksa kecil opsional untuk proses heartbeat. Buat tetap singkat agar tidak membakar token.
  </Accordion>
  <Accordion title="BOOT.md - daftar periksa startup">
    Daftar periksa startup opsional yang dijalankan otomatis saat gateway dimulai ulang (saat [hook internal](/id/automation/hooks) diaktifkan). Buat tetap singkat; gunakan alat pesan untuk pengiriman keluar.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - ritual pertama kali">
    Ritual satu kali untuk pertama kali. Hanya dibuat untuk ruang kerja yang benar-benar baru. Hapus setelah ritual selesai.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - log memori harian">
    Log memori harian (satu file per hari). Disarankan membaca hari ini + kemarin saat sesi dimulai.
  </Accordion>
  <Accordion title="MEMORY.md - memori jangka panjang terkurasi (opsional)">
    Memori jangka panjang terkurasi: fakta, preferensi, keputusan, dan ringkasan singkat yang tahan lama. Simpan log terperinci di `memory/YYYY-MM-DD.md` agar alat memori dapat mengambilnya sesuai permintaan tanpa menyuntikkannya ke setiap prompt. Muat `MEMORY.md` hanya di sesi utama dan privat (bukan konteks bersama/grup). Lihat [Memory](/id/concepts/memory) untuk alur kerja dan flush memori otomatis.
  </Accordion>
  <Accordion title="skills/ - Skills ruang kerja (opsional)">
    Skills khusus ruang kerja. Lokasi skill dengan prioritas tertinggi untuk ruang kerja tersebut. Menimpa skill agen proyek, skill agen pribadi, skill terkelola, skill bawaan, dan `skills.load.extraDirs` saat nama bertabrakan.
  </Accordion>
  <Accordion title="canvas/ - file UI Canvas (opsional)">
    File UI Canvas untuk tampilan node (misalnya `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Jika ada file bootstrap yang hilang, OpenClaw menyuntikkan penanda "file hilang" ke dalam sesi dan melanjutkan. File bootstrap besar dipotong saat disuntikkan; sesuaikan batas dengan `agents.defaults.bootstrapMaxChars` (default: 20000) dan `agents.defaults.bootstrapTotalMaxChars` (default: 60000). `openclaw setup` dapat membuat ulang default yang hilang tanpa menimpa file yang sudah ada.
</Note>

## Yang TIDAK ada di ruang kerja

Ini berada di bawah `~/.openclaw/` dan TIDAK boleh di-commit ke repo ruang kerja:

- `~/.openclaw/openclaw.json` (konfigurasi)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (profil autentikasi model: OAuth + kunci API)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (akun runtime Codex per agen, konfigurasi, skills, plugin, dan status thread native)
- `~/.openclaw/credentials/` (status channel/provider plus data impor OAuth lama)
- `~/.openclaw/agents/<agentId>/sessions/` (transkrip sesi + metadata)
- `~/.openclaw/skills/` (skills terkelola)

Jika Anda perlu memigrasikan sesi atau konfigurasi, salin secara terpisah dan jauhkan dari kontrol versi.

## Cadangan Git (direkomendasikan, privat)

Perlakukan ruang kerja sebagai memori privat. Letakkan di repo git **privat** agar dicadangkan dan dapat dipulihkan.

Jalankan langkah-langkah ini di mesin tempat Gateway berjalan (di situlah ruang kerja berada).

<Steps>
  <Step title="Inisialisasi repo">
    Jika git terinstal, ruang kerja yang benar-benar baru diinisialisasi secara otomatis. Jika ruang kerja ini belum menjadi repo, jalankan:

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
- Dump mentah obrolan atau lampiran sensitif.

Jika Anda harus menyimpan referensi sensitif, gunakan placeholder dan simpan rahasia sebenarnya di tempat lain (pengelola kata sandi, variabel lingkungan, atau `~/.openclaw/`).
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
    Tetapkan `agents.defaults.workspace` ke path tersebut di `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Seed file yang hilang">
    Jalankan `openclaw setup --workspace <path>` untuk menanamkan file yang hilang.
  </Step>
  <Step title="Salin sesi (opsional)">
    Jika Anda membutuhkan sesi, salin `~/.openclaw/agents/<agentId>/sessions/` dari mesin lama secara terpisah.
  </Step>
</Steps>

## Catatan lanjutan

- Routing multi-agen dapat menggunakan ruang kerja berbeda per agen. Lihat [Routing channel](/id/channels/channel-routing) untuk konfigurasi routing.
- Jika `agents.defaults.sandbox` diaktifkan, sesi non-utama dapat menggunakan ruang kerja sandbox per sesi di bawah `agents.defaults.sandbox.workspaceRoot`.

## Terkait

- [Heartbeat](/id/gateway/heartbeat) - file ruang kerja HEARTBEAT.md
- [Sandboxing](/id/gateway/sandboxing) - akses ruang kerja di lingkungan tersandbox
- [Session](/id/concepts/session) - path penyimpanan sesi
- [Standing orders](/id/automation/standing-orders) - instruksi persisten di file ruang kerja
