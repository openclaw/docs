---
read_when:
    - Anda perlu menjelaskan ruang kerja agen atau tata letak filenya
    - Anda ingin mencadangkan atau memigrasikan ruang kerja agen
sidebarTitle: Agent workspace
summary: 'Ruang kerja agen: lokasi, tata letak, dan strategi pencadangan'
title: Ruang kerja agen
x-i18n:
    generated_at: "2026-05-10T19:30:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: adb2ae19c702589010cc67907940ae21feb669cca262e36790a3059aa7d7744c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

Workspace adalah rumah agen. Ini adalah satu-satunya direktori kerja yang digunakan untuk alat file dan konteks workspace. Jaga agar tetap privat dan perlakukan sebagai memori.

Ini terpisah dari `~/.openclaw/`, yang menyimpan konfigurasi, kredensial, dan sesi.

<Warning>
Workspace adalah **cwd default**, bukan sandbox yang ketat. Alat menyelesaikan jalur relatif terhadap workspace, tetapi jalur absolut masih dapat menjangkau lokasi lain di host kecuali sandboxing diaktifkan. Jika Anda memerlukan isolasi, gunakan [`agents.defaults.sandbox`](/id/gateway/sandboxing) (dan/atau konfigurasi sandbox per agen).

Saat sandboxing diaktifkan dan `workspaceAccess` bukan `"rw"`, alat beroperasi di dalam workspace sandbox di bawah `~/.openclaw/sandboxes`, bukan workspace host Anda.
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

`openclaw onboard`, `openclaw configure`, atau `openclaw setup` akan membuat workspace dan mengisi file bootstrap jika belum ada.

<Note>
Salinan seed sandbox hanya menerima file reguler di dalam workspace; alias symlink/hardlink yang mengarah ke luar workspace sumber diabaikan.
</Note>

Jika Anda sudah mengelola file workspace sendiri, Anda dapat menonaktifkan pembuatan file bootstrap:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Folder workspace tambahan

Instalasi lama mungkin telah membuat `~/openclaw`. Menyimpan beberapa direktori workspace dapat menyebabkan auth atau state drift yang membingungkan, karena hanya satu workspace yang aktif pada satu waktu.

<Note>
**Rekomendasi:** pertahankan satu workspace aktif. Jika Anda tidak lagi menggunakan folder tambahan, arsipkan atau pindahkan ke Trash (misalnya `trash ~/openclaw`). Jika Anda sengaja mempertahankan beberapa workspace, pastikan `agents.defaults.workspace` menunjuk ke workspace aktif.

`openclaw doctor` memperingatkan saat mendeteksi direktori workspace tambahan.
</Note>

## Peta file workspace

Berikut adalah file standar yang diharapkan OpenClaw di dalam workspace:

<AccordionGroup>
  <Accordion title="AGENTS.md - instruksi operasional">
    Instruksi operasional untuk agen dan cara agen harus menggunakan memori. Dimuat pada awal setiap sesi. Tempat yang baik untuk aturan, prioritas, dan detail "cara berperilaku".
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
  <Accordion title="HEARTBEAT.md - daftar periksa Heartbeat">
    Daftar periksa kecil opsional untuk proses Heartbeat. Jaga tetap singkat untuk menghindari pemborosan token.
  </Accordion>
  <Accordion title="BOOT.md - daftar periksa startup">
    Daftar periksa startup opsional yang dijalankan otomatis saat Gateway dimulai ulang (ketika [hook internal](/id/automation/hooks) diaktifkan). Jaga tetap singkat; gunakan alat pesan untuk pengiriman keluar.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - ritual proses pertama">
    Ritual sekali untuk proses pertama. Hanya dibuat untuk workspace yang benar-benar baru. Hapus setelah ritual selesai.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - log memori harian">
    Log memori harian (satu file per hari). Disarankan untuk membaca hari ini + kemarin saat sesi dimulai.
  </Accordion>
  <Accordion title="MEMORY.md - memori jangka panjang terkurasi (opsional)">
    Memori jangka panjang terkurasi: fakta, preferensi, keputusan, dan ringkasan singkat yang tahan lama. Simpan log terperinci di `memory/YYYY-MM-DD.md` agar alat memori dapat mengambilnya saat diperlukan tanpa menyuntikkannya ke setiap prompt. Muat `MEMORY.md` hanya di sesi utama yang privat (bukan konteks bersama/grup). Lihat [Memori](/id/concepts/memory) untuk alur kerja dan flush memori otomatis.
  </Accordion>
  <Accordion title="skills/ - Skills workspace (opsional)">
    Skills khusus workspace. Lokasi skill dengan prioritas tertinggi untuk workspace tersebut. Mengesampingkan Skills agen proyek, Skills agen personal, Skills terkelola, Skills bawaan, dan `skills.load.extraDirs` saat nama bertabrakan.
  </Accordion>
  <Accordion title="canvas/ - file UI Canvas (opsional)">
    File UI Canvas untuk tampilan node (misalnya `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Jika ada file bootstrap yang hilang, OpenClaw menyuntikkan penanda "file hilang" ke dalam sesi dan melanjutkan. File bootstrap besar dipotong saat disuntikkan; sesuaikan batas dengan `agents.defaults.bootstrapMaxChars` (default: 12000) dan `agents.defaults.bootstrapTotalMaxChars` (default: 60000). `openclaw setup` dapat membuat ulang default yang hilang tanpa menimpa file yang ada.
</Note>

## Yang TIDAK ada di workspace

Ini berada di bawah `~/.openclaw/` dan TIDAK boleh di-commit ke repo workspace:

- `~/.openclaw/openclaw.json` (konfigurasi)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (profil auth model: OAuth + kunci API)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (akun runtime Codex per agen, konfigurasi, Skills, plugin, dan state thread native)
- `~/.openclaw/credentials/` (state channel/provider plus data impor OAuth lama)
- `~/.openclaw/agents/<agentId>/sessions/` (transkrip sesi + metadata)
- `~/.openclaw/skills/` (Skills terkelola)

Jika Anda perlu memigrasikan sesi atau konfigurasi, salin secara terpisah dan jauhkan dari kontrol versi.

## Backup Git (disarankan, privat)

Perlakukan workspace sebagai memori privat. Masukkan ke repo git **privat** agar dicadangkan dan dapat dipulihkan.

Jalankan langkah-langkah ini di mesin tempat Gateway berjalan (di situlah workspace berada).

<Steps>
  <Step title="Inisialisasi repo">
    Jika git terinstal, workspace yang benar-benar baru diinisialisasi secara otomatis. Jika workspace ini belum menjadi repo, jalankan:

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
Bahkan di repo privat, hindari menyimpan rahasia di workspace:

- Kunci API, token OAuth, kata sandi, atau kredensial privat.
- Apa pun di bawah `~/.openclaw/`.
- Dump mentah obrolan atau lampiran sensitif.

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

## Memindahkan workspace ke mesin baru

<Steps>
  <Step title="Clone repo">
    Clone repo ke jalur yang diinginkan (default `~/.openclaw/workspace`).
  </Step>
  <Step title="Perbarui konfigurasi">
    Setel `agents.defaults.workspace` ke jalur tersebut di `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Seed file yang hilang">
    Jalankan `openclaw setup --workspace <path>` untuk mengisi file yang hilang.
  </Step>
  <Step title="Salin sesi (opsional)">
    Jika Anda memerlukan sesi, salin `~/.openclaw/agents/<agentId>/sessions/` dari mesin lama secara terpisah.
  </Step>
</Steps>

## Catatan lanjutan

- Routing multi-agen dapat menggunakan workspace berbeda per agen. Lihat [Routing channel](/id/channels/channel-routing) untuk konfigurasi routing.
- Jika `agents.defaults.sandbox` diaktifkan, sesi non-utama dapat menggunakan workspace sandbox per sesi di bawah `agents.defaults.sandbox.workspaceRoot`.

## Terkait

- [Heartbeat](/id/gateway/heartbeat) - file workspace HEARTBEAT.md
- [Sandboxing](/id/gateway/sandboxing) - akses workspace di lingkungan tersandbox
- [Sesi](/id/concepts/session) - jalur penyimpanan sesi
- [Standing orders](/id/automation/standing-orders) - instruksi persisten dalam file workspace
