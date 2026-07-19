---
read_when:
    - Anda perlu menjelaskan ruang kerja agen atau tata letak filenya
    - Anda ingin mencadangkan atau memigrasikan ruang kerja agen
sidebarTitle: Agent workspace
summary: 'Ruang kerja agen: lokasi, tata letak, dan strategi pencadangan'
title: Ruang kerja agen
x-i18n:
    generated_at: "2026-07-19T05:03:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ea72dd9366876691dca751518d88f95741d68a39e409a2a300a497a58f8b9d37
    source_path: concepts/agent-workspace.md
    workflow: 16
---

Ruang kerja adalah rumah agen: direktori kerja yang digunakan untuk alat berkas
dan konteks ruang kerja. Jaga privasinya dan perlakukan sebagai memori.

Ini terpisah dari `~/.openclaw/`, yang menyimpan konfigurasi, kredensial, dan sesi.

<Warning>
Ruang kerja adalah **cwd default**, bukan sandbox yang ketat. Alat menyelesaikan path relatif terhadap ruang kerja, tetapi path absolut masih dapat menjangkau lokasi lain pada host kecuali sandboxing diaktifkan. Jika Anda memerlukan isolasi, gunakan [`agents.defaults.sandbox`](/id/gateway/sandboxing) (dan/atau konfigurasi sandbox per agen).

Saat sandboxing diaktifkan dan `workspaceAccess` bukan `"rw"`, alat beroperasi di dalam ruang kerja sandbox pada `~/.openclaw/sandboxes`, bukan di ruang kerja host Anda.
</Warning>

## Lokasi default

- Default: `~/.openclaw/workspace`
- Jika `OPENCLAW_PROFILE` ditetapkan dan bukan `"default"`, default menjadi `~/.openclaw/workspace-<profile>`.
- `OPENCLAW_WORKSPACE_DIR` menggantikan kedua nilai di atas saat ditetapkan.
- Agen non-default (`agents.list[]`) tanpa ruang kerja eksplisit diarahkan ke `<state-dir>/workspace-<agentId>`, bukan ruang kerja default bersama.

Ganti di `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

Penggantian per agen: `agents.list[].workspace`.

`openclaw onboard`, `openclaw configure`, atau `openclaw setup` membuat ruang kerja dan mengisinya dengan berkas bootstrap jika berkas tersebut tidak ada.

<Note>
Penyalinan seed sandbox hanya menerima berkas biasa di dalam ruang kerja; alias symlink/hardlink yang diarahkan ke luar ruang kerja sumber akan diabaikan.
</Note>

Jika Anda sudah mengelola sendiri berkas ruang kerja, nonaktifkan pembuatan berkas bootstrap:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Folder ruang kerja tambahan

Instalasi lama mungkin telah membuat `~/openclaw`. Menyimpan beberapa direktori ruang kerja dapat menyebabkan penyimpangan autentikasi atau status yang membingungkan karena hanya satu ruang kerja yang aktif pada satu waktu.

<Note>
**Rekomendasi:** pertahankan satu ruang kerja aktif. Jika Anda tidak lagi menggunakan folder tambahan tersebut, arsipkan atau pindahkan ke Sampah (misalnya `trash ~/openclaw`). Jika Anda sengaja mempertahankan beberapa ruang kerja, pastikan `agents.defaults.workspace` (atau kunci per agen `workspace`) menunjuk ke ruang kerja yang aktif.
</Note>

## Peta berkas ruang kerja

Berkas standar yang diharapkan OpenClaw di dalam ruang kerja:

<AccordionGroup>
  <Accordion title="AGENTS.md - petunjuk pengoperasian">
    Petunjuk pengoperasian untuk agen dan cara menggunakan memori. Dimuat pada awal setiap sesi. Tempat yang tepat untuk aturan, prioritas, dan detail "cara berperilaku".
  </Accordion>
  <Accordion title="SOUL.md - persona dan nada">
    Persona, nada, dan batasan. Dimuat setiap sesi. Panduan: [panduan kepribadian SOUL.md](/id/concepts/soul).
  </Accordion>
  <Accordion title="USER.md - siapa penggunanya">
    Siapa penggunanya dan cara menyapa mereka. Dimuat setiap sesi.
  </Accordion>
  <Accordion title="IDENTITY.md - nama, nuansa, emoji">
    Nama, nuansa, dan emoji agen. Dibuat/diperbarui selama ritual bootstrap.
  </Accordion>
  <Accordion title="TOOLS.md - konvensi alat lokal">
    Catatan tentang alat dan konvensi lokal Anda. Tidak mengendalikan ketersediaan alat; ini hanya panduan.
  </Accordion>
  <Accordion title="HEARTBEAT.md - daftar periksa Heartbeat">
    Daftar periksa kecil opsional untuk eksekusi Heartbeat. Pertahankan agar tetap singkat untuk menghindari pemborosan token.
  </Accordion>
  <Accordion title="BOOT.md - daftar periksa saat memulai">
    Daftar periksa saat memulai yang bersifat opsional dan dijalankan secara otomatis ketika Gateway dimulai ulang (saat [hook internal](/id/automation/hooks) diaktifkan). Pertahankan agar tetap singkat; gunakan alat pesan untuk pengiriman keluar.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - ritual eksekusi pertama">
    Ritual satu kali pada eksekusi pertama. Hanya dibuat untuk ruang kerja yang benar-benar baru. Hapus setelah ritual selesai.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - log memori harian">
    Log memori harian (satu berkas per hari). Disarankan untuk membaca hari ini + kemarin saat sesi dimulai.
  </Accordion>
  <Accordion title="MEMORY.md - memori jangka panjang yang dikurasi (opsional)">
    Memori jangka panjang yang dikurasi: fakta, preferensi, keputusan, dan ringkasan singkat yang bertahan lama. Simpan log terperinci di `memory/YYYY-MM-DD.md` agar alat memori dapat mengambilnya sesuai permintaan tanpa menyuntikkannya ke setiap prompt. Muat `MEMORY.md` hanya dalam sesi utama yang privat (bukan konteks bersama/grup). Lihat [Memori](/id/concepts/memory) untuk alur kerja dan pengosongan memori otomatis.
  </Accordion>
  <Accordion title="skills/ - Skills ruang kerja (opsional)">
    Skills khusus ruang kerja. Lokasi skill dengan prioritas tertinggi untuk ruang kerja tersebut, mendahului skill agen proyek, skill agen pribadi, skill terkelola, skill bawaan, dan `skills.load.extraDirs` saat nama bertabrakan.
  </Accordion>
  <Accordion title="canvas/ - berkas UI Canvas (opsional)">
    Berkas UI Canvas untuk tampilan node (misalnya `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Jika berkas bootstrap tidak ada, OpenClaw menyuntikkan penanda "berkas tidak ada" ke dalam sesi dan melanjutkan. Berkas bootstrap besar akan dipotong saat disuntikkan; sesuaikan batas dengan `agents.defaults.bootstrapMaxChars` (default: `20000`) dan `agents.defaults.bootstrapTotalMaxChars` (default: `60000`). `openclaw setup` dapat membuat ulang default yang tidak ada tanpa menimpa berkas yang sudah ada.
</Note>

## Yang TIDAK ada di ruang kerja

Item berikut berada di bawah `~/.openclaw/` dan TIDAK boleh di-commit ke repo ruang kerja:

- `~/.openclaw/openclaw.json` (konfigurasi)
- `~/.openclaw/state/openclaw.sqlite` (status penyiapan dan atestasi ruang kerja bersama)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (profil autentikasi model: OAuth + kunci API)
- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` (baris sesi, transkrip, dan status runtime per agen)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (akun runtime Codex per agen, konfigurasi, Skills, plugin, dan status thread native)
- `~/.openclaw/credentials/` (status kanal/penyedia beserta data impor OAuth lama)
- `~/.openclaw/agents/<agentId>/sessions/` (sumber migrasi lama dan artefak arsip/dukungan)
- `~/.openclaw/skills/` (Skills terkelola)

Jika Anda perlu memigrasikan sesi atau konfigurasi, salin secara terpisah dan jangan masukkan ke kontrol versi.

Rilis OpenClaw lama menulis sidecar ruang kerja `openclaw-workspace-state.json`,
`.openclaw/workspace-state.json`, dan `.attested`. Runtime saat ini
hanya menggunakan basis data SQLite bersama untuk status tersebut. Jika Doctor melaporkan
salah satu berkas ini, jalankan `openclaw doctor --fix`; Doctor mengimpor status lama yang valid
dan hanya menghapus sumber setelah memverifikasi baris basis data.

## Cadangan Git (disarankan, privat)

Perlakukan ruang kerja sebagai memori privat. Masukkan ke repo git **privat** agar dicadangkan dan dapat dipulihkan.

Jalankan langkah-langkah ini pada mesin tempat Gateway berjalan (di situlah ruang kerja berada).

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
        2. Jangan inisialisasi dengan README (untuk menghindari konflik penggabungan).
        3. Salin URL remote HTTPS.
        4. Tambahkan remote dan lakukan push:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="CLI GitHub (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="UI web GitLab">
        1. Buat repositori **privat** baru di GitLab.
        2. Jangan inisialisasi dengan README (untuk menghindari konflik penggabungan).
        3. Salin URL remote HTTPS.
        4. Tambahkan remote dan lakukan push:

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
Bahkan dalam repo privat, hindari menyimpan rahasia di ruang kerja:

- Kunci API, token OAuth, kata sandi, atau kredensial privat.
- Apa pun di bawah `~/.openclaw/`.
- Dump mentah percakapan atau lampiran sensitif.

Jika Anda harus menyimpan referensi sensitif, gunakan placeholder dan simpan rahasia yang sebenarnya di tempat lain (pengelola kata sandi, variabel lingkungan, atau `~/.openclaw/`).
</Warning>

Saran awal untuk `.gitignore`:

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
  <Step title="Isi berkas yang tidak ada">
    Jalankan `openclaw setup --workspace <path>` untuk mengisi berkas yang tidak ada.
  </Step>
  <Step title="Salin sesi (opsional)">
    Jika Anda memerlukan sesi, salin `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
    secara terpisah dari mesin lama. Salin `~/.openclaw/agents/<agentId>/sessions/`
    hanya jika Anda juga memerlukan input migrasi lama atau artefak arsip/dukungan.
  </Step>
</Steps>

## Catatan lanjutan

- Perutean multiagen dapat menggunakan ruang kerja yang berbeda untuk setiap agen melalui `agents.list[].workspace`. Lihat [Perutean kanal](/id/channels/channel-routing) untuk konfigurasi perutean.
- Jika `agents.defaults.sandbox` diaktifkan, sesi non-utama dapat menggunakan ruang kerja sandbox per sesi di bawah `agents.defaults.sandbox.workspaceRoot`.

## Terkait

- [Heartbeat](/id/gateway/heartbeat) - berkas ruang kerja HEARTBEAT.md
- [Sandboxing](/id/gateway/sandboxing) - akses ruang kerja dalam lingkungan yang menggunakan sandbox
- [Sesi](/id/concepts/session) - path penyimpanan sesi
- [Perintah tetap](/id/automation/standing-orders) - petunjuk persisten dalam berkas ruang kerja
