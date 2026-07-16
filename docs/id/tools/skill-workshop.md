---
read_when:
    - Anda ingin agen membuat atau memperbarui skill melalui obrolan
    - Anda perlu meninjau, menerapkan, menolak, atau mengarantina draf skill yang dihasilkan
    - Anda sedang mengonfigurasi persetujuan, otonomi, penyimpanan, atau batas Skill Workshop
    - Anda ingin memahami tempat proposal pembelajaran mandiri ditinjau
sidebarTitle: Skill Workshop
summary: Buat dan perbarui Skills ruang kerja melalui peninjauan Skill Workshop
title: Lokakarya Skills
x-i18n:
    generated_at: "2026-07-16T18:50:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c2590f2a1bcad3b22ef8504eac7b3a44611c3fedc0df3832660f8926ce04252
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop adalah jalur yang dikelola OpenClaw untuk membuat dan memperbarui
skill ruang kerja. Agen dan operator tidak pernah menulis `SKILL.md` secara langsung melalui
jalur ini — mereka membuat **proposal** (draf tertunda dengan konten, pengikatan
target, status pemindai, hash, dan metadata rollback) yang menjadi skill aktif
hanya setelah diterapkan.

Skill Workshop hanya menulis skill ruang kerja. Skill Workshop tidak pernah menyentuh skill bawaan,
Plugin, ClawHub, root tambahan, terkelola, agen pribadi, atau sistem.

## Cara kerjanya

- **Proposal terlebih dahulu:** konten yang dihasilkan disimpan sebagai `PROPOSAL.md`, bukan
  `SKILL.md`.
- **Penerapan adalah satu-satunya penulisan aktif:** pembuatan, pembaruan, dan revisi tidak pernah mengubah
  skill aktif.
- **Terbatas pada ruang kerja:** pembuatan menargetkan root `skills/` ruang kerja; pembaruan
  hanya diizinkan untuk skill ruang kerja yang dapat ditulis.
- **Tidak menimpa:** pembuatan gagal jika skill target sudah ada.
- **Terikat hash:** proposal pembaruan terikat pada hash target saat ini dan menjadi
  `stale` jika skill aktif berubah sebelum diterapkan.
- **Dibatasi pemindai:** penerapan menjalankan ulang pemindai keamanan sebelum menulis.
- **Dapat dipulihkan:** penerapan menulis metadata rollback sebelum menyentuh berkas aktif.
- **Antarmuka konsisten:** chat, CLI, dan Gateway semuanya memanggil layanan yang sama.

## Siklus hidup

```text
buat/perbarui -> tertunda
revisi        -> tertunda
terapkan      -> diterapkan
tolak         -> ditolak
karantina     -> dikarantina
perubahan target -> kedaluwarsa
```

Hanya proposal `pending` yang dapat direvisi, diterapkan, ditolak, atau dikarantina.

## Kurasi siklus hidup

Gateway melacak penggunaan skill secara agregat dalam basis data status bersama. Sekali
sehari, Gateway meninjau skill yang dibuat dan diterapkan oleh Skill Workshop. Skill yang tidak digunakan selama
lebih dari 30 hari menjadi `stale`; setelah 90 hari, skill tersebut menjadi `archived` dan
tidak disertakan dalam snapshot skill agen baru. Berkas skill yang diarsipkan tetap tidak berubah di
disk. Skill yang dibuat secara manual tidak pernah dikurasi; hanya skill yang dibuat melalui proposal Skill
Workshop yang masuk ke kurasi siklus hidup.

Skill yang disematkan melewati transisi siklus hidup. Skill kedaluwarsa kembali menjadi `active`
setelah digunakan dan penyisiran berikutnya berjalan. Skill yang diarsipkan hanya kembali melalui
pemulihan eksplisit:

Transisi dan pemulihan siklus hidup berlaku untuk sesi baru; sesi yang sedang berjalan mempertahankan
snapshot skill saat ini.

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

Semua perintah kurator menerima `--json`. Status juga melaporkan kandidat tumpang tindih
deterministik hanya sebagai saran; perintah ini tidak pernah menggabungkan skill atau memanggil model.

## Chat

Minta skill yang diinginkan kepada agen; agen akan memanggil `skill_workshop` dan mengembalikan
id proposal.

### Belajar dari pekerjaan terbaru

Gunakan `/learn` untuk mengubah percakapan saat ini atau sumber yang disebutkan menjadi satu
proposal skill yang dipandu standar:

```text
/learn
/learn docs/runbook.md dan https://example.com/guide; fokus pada pemulihan
```

Tanpa permintaan, `/learn` meminta agen menyarikan alur kerja yang dapat digunakan kembali dari
percakapan saat ini. Dengan permintaan, agen memperlakukan path, URL, catatan yang ditempel,
dan referensi percakapan sebagai sumber sambil mematuhi persyaratan fokus, cakupan, dan
penamaan. Agen mengumpulkan sumber menggunakan alat yang sudah tersedia, lalu memanggil
`skill_workshop` dengan `action: "create"`.

Proposal yang dihasilkan tetap `pending`; `/learn` tidak pernah menerapkannya. Tinjau dan
terapkan melalui alur persetujuan normal atau dengan `openclaw skills workshop`.

Buat:

```text
Buat skill bernama morning-catchup yang menjalankan rutinitas kotak masuk hari Senin saya.
```

Perbarui skill ruang kerja yang sudah ada:

```text
Perbarui trip-planning agar juga memeriksa peta kursi sebelum memesan.
```

Lakukan iterasi pada proposal tertunda:

```text
Tampilkan proposal morning-catchup.
Revisi agar juga menandai semua yang ditandai mendesak.
Terapkan proposal morning-catchup.
```

`apply`, `reject`, dan `quarantine` yang dimulai oleh agen berjalan tanpa
permintaan persetujuan tambahan secara default. Atur `skills.workshop.approvalPolicy` menjadi `"pending"`
untuk mewajibkan persetujuan operator sebelum tindakan tersebut.

Jika persetujuan diwajibkan, permintaan menampilkan id proposal dan skill
target, serta menunjukkan deskripsi proposal, jumlah berkas pendukung, dan ukuran isi.
Permintaan persetujuan dibatasi agar selesai sebelum pengawas alat agen. Jika tidak ada
keputusan sebelum permintaan berakhir, tindakan siklus hidup tidak dijalankan:
proposal tetap tertunda dan tidak berubah. Putuskan nanti di UI Skill Workshop atau jalankan
`openclaw skills workshop apply|reject|quarantine <proposal-id>`. Agen tidak boleh
mencoba ulang tindakan siklus hidup yang kedaluwarsa secara berulang.

## CLI

```bash
# Buat
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Pengejaran kotak masuk harian: pilah, arsipkan, tampilkan, buat draf, rencanakan" \
  --proposal ./PROPOSAL.md

# Perbarui skill ruang kerja yang sudah ada
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# Cantumkan dan periksa
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>

# Revisi sebelum persetujuan
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md

# Selesaikan
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplikat"
openclaw skills workshop quarantine <proposal-id> --reason "Memerlukan tinjauan keamanan"
```

Setiap subperintah menerima `--agent <id>` (ruang kerja target; default-nya
disimpulkan dari cwd, lalu agen default) dan `--json` (keluaran terstruktur).
`propose-create`, `propose-update`, dan `revise` juga menerima `--goal <text>` dan
`--evidence <text>` untuk mencatat konteks proposal bersama `--proposal`.

## Konten proposal

Saat tertunda, proposal disimpan sebagai `PROPOSAL.md` dengan frontmatter khusus
proposal:

```markdown
---
name: "morning-catchup"
description: "Pengejaran kotak masuk harian: pilah, arsipkan, tampilkan, buat draf, rencanakan"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

Saat diterapkan, Skill Workshop menulis `SKILL.md` aktif dan menghapus
kolom khusus proposal: `status`, `version` proposal, dan `date` proposal.

## Berkas pendukung

Gunakan `--proposal-dir` jika skill yang diusulkan memerlukan berkas di samping
`PROPOSAL.md`:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Rangkuman hari Jumat: statistik, sorotan, tiga prioritas utama minggu depan" \
  --proposal-dir ./weekly-update-proposal
```

Direktori harus berisi `PROPOSAL.md`. Berkas pendukung harus berada di bawah
`assets/`, `examples/`, `references/`, `scripts/`, atau `templates/`. Skill
Workshop memindai, membuat hash, dan menyimpannya bersama proposal, lalu menulisnya
di samping `SKILL.md` aktif hanya saat diterapkan.

Path berkas pendukung yang ditolak: path absolut, segmen path tersembunyi, traversal
path, path yang tumpang tindih, berkas yang dapat dieksekusi, teks non-UTF-8, byte null,
dan path di luar folder pendukung standar.

## Alat agen

Model menggunakan `skill_workshop` dengan satu `action` wajib:
`create | update | revise | list | inspect | apply | reject | quarantine`.
Parameter lain berlaku bergantung pada tindakan:

| Parameter                  | Digunakan oleh                                        | Catatan                                                               |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                        | Wajib untuk `create`; jika tidak, menyelesaikan proposal tertunda berdasarkan nama |
| `description`              | `create`, `update`, `revise`                         | Maks. 160 byte                                                       |
| `skill_name`               | `update`                                             | Nama atau kunci skill yang sudah ada                                 |
| `proposal_content`         | `create`, `update`, `revise`                         | Disimpan sebagai `PROPOSAL.md`; dibatasi oleh `skills.workshop.maxSkillBytes` |
| `support_files`            | `create`, `update`, `revise`                         | Larik `{ path, content }`                                             |
| `goal`, `evidence`         | `create`, `update`, `revise`                         | Konteks teks bebas                                                   |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine` | Proposal target                                                      |
| `reason`                   | `apply`, `reject`, `quarantine`                      | Opsional                                                             |
| `query`, `status`, `limit` | `list`                                               | Filter/paginasi; `limit` maks. 50, default 20             |

Agen harus menggunakan `skill_workshop` untuk pekerjaan skill yang dihasilkan. Agen tidak boleh
membuat atau mengubah berkas proposal melalui `write`, `edit`, `exec`, perintah
shell, atau operasi sistem berkas langsung.

<Note>
`skill_workshop` adalah alat agen bawaan dan disertakan dalam
`tools.profile: "coding"`. Jika kebijakan yang lebih ketat menyembunyikannya, tambahkan
`skill_workshop` ke daftar `tools.allow` aktif, atau gunakan
`tools.alsoAllow: ["skill_workshop"]` jika cakupan menggunakan profil tanpa
`tools.allow` eksplisit. Proses dalam sandbox tidak membuat alat
Skill Workshop sisi host, jadi jalankan tindakan peninjauan proposal dari sesi agen
sisi host normal atau CLI.
</Note>

## Skill yang disarankan

OpenClaw mendeteksi instruksi yang bertahan lama seperti “lain kali,” “ingat untuk,” dan koreksi reaktif
saat giliran interaktif berakhir, termasuk giliran yang gagal. Pada giliran berikutnya, agen menawarkan untuk menyimpan
alur kerja terbaru yang terdeteksi melalui `skill_workshop`; pengguna memutuskan apakah akan membuat
proposal. Saran bawaan ini tidak membuat atau mengubah skill dengan sendirinya. Aktifkan
`skills.workshop.autonomous.enabled` untuk membuat proposal tertunda secara langsung sebagai gantinya. Di UI Control,
tab Workshop menawarkan pengaturan yang sama sebagai tombol alih **Pembelajaran mandiri** di header halaman, dan
sebagai tombol aktifkan pada papan proposal yang kosong.

### Pindai sesi sebelumnya

UI Control dapat meninjau pekerjaan lama tanpa mengaktifkan pembelajaran mandiri otonom.
Buka **Plugins → Workshop** dan pilih **Find skill ideas**. Pemindaian dimulai dari
sesi terbaru yang memenuhi syarat dan meninjau jendela terbatas berisi pekerjaan substantif.
Pemindaian melewati sesi cron, heartbeat, hook, subagen, ACP, milik Plugin, dan tinjauan internal,
serta percakapan dengan kurang dari enam giliran model.

Peninjau menggunakan model yang dikonfigurasi untuk agen terpilih dan menerima bundel
transkrip yang rahasianya telah disunting dan ukurannya dibatasi. Peninjau menerapkan ambang konservatif
yang sama dengan tinjauan pengalaman: pola pemulihan konkret atau prosedur stabil yang
akan menghilangkan setidaknya dua panggilan model atau alat pada masa mendatang. Pekerjaan rutin dan fakta
sekali pakai tidak boleh menghasilkan proposal.

Satu pemindaian dapat membuat atau merevisi paling banyak tiga proposal tertunda. Pemindaian tidak dapat menerapkan,
menolak, mengarantina, atau mengedit skill aktif. Workshop menampilkan cakupan kumulatif,
misalnya **20 sesi ditinjau · 18 Jun–hari ini · 2 ide ditemukan**. Pilih
**Scan earlier work** untuk melanjutkan dari kursor sesi terlama yang disimpan. Setelah
riwayat yang tersedia habis, tindakan berubah menjadi **Scan new work**.

Tinjauan historis dilakukan secara manual meskipun
`skills.workshop.autonomous.enabled` bernilai `false`. Setiap klik memulai satu eksekusi model,
sehingga ketentuan harga dan penanganan data penyedia berlaku. Kursor dan jumlah cakupan
disimpan dalam basis data status bersama OpenClaw; konten transkrip tidak disalin
ke dalam status pemindaian.

Dengan pengambilan otonom diaktifkan, OpenClaw juga dapat melakukan tinjauan konservatif setelah pekerjaan
substansial berhasil diselesaikan dan setelah seluruh sistem agen menjadi tidak aktif. Tinjauan terisolasi tersebut dapat membuat atau
merevisi paling banyak satu proposal tertunda. Tinjauan tersebut tidak dapat memperbarui skill aktif atau menerapkan, menolak, maupun mengarantina
proposal, meskipun `approvalPolicy` bernilai `"auto"`.

Lihat [Pembelajaran mandiri](/tools/self-learning) untuk detail pengaktifan, kelayakan, privasi, dan biaya,
ambang batas proposal, serta pemecahan masalah.

## Persetujuan dan otonomi

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: false,
      },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "auto",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

| Pengaturan                    | Default  | Efek                                                                                                                                                              |
| -------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`  | Membuat proposal tertunda dari koreksi eksplisit dan, setelah jeda tidak aktif, pekerjaan substansial yang telah selesai dengan pemulihan yang dapat digunakan kembali atau penghematan perjalanan bolak-balik yang berarti.   |
| `allowSymlinkTargetWrites` | `false`  | Memungkinkan penerapan menulis melalui symlink skill ruang kerja yang target aslinya tercantum dalam `skills.load.allowSymlinkTargets`.                                                 |
| `approvalPolicy`           | `"auto"` | `"auto"` melewati permintaan konfirmasi tambahan untuk `apply`, `reject`, atau `quarantine` yang dimulai agen (agen tetap harus memanggil tindakan tersebut). `"pending"` memerlukan persetujuan. |
| `maxPending`               | `50`     | Membatasi proposal tertunda dan dikarantina per ruang kerja (1-200).                                                                                                       |
| `maxSkillBytes`            | `40000`  | Membatasi ukuran isi proposal dalam byte (1024-200000).                                                                                                                     |

Pengambilan otonom mengenali aturan prospektif (misalnya, “mulai sekarang”) dan
koreksi reaktif (misalnya, “itu bukan yang saya minta”). Fitur ini mengelompokkan instruksi baru berdasarkan topik menjadi
hingga tiga proposal per giliran, mengarahkan kecocokan kosakata ke skill ruang kerja yang sudah ada dan dapat ditulis, serta
merevisi proposal tertundanya sendiri ketika koreksi lain menargetkan skill yang sama.

Untuk pekerjaan substansial yang berhasil tanpa koreksi eksplisit, eksekusi terisolasi dari model yang dipilih
menentukan apakah lintasan yang telah selesai melampaui ambang konservatif proposal. Model
latar depan tidak diminta untuk belajar sebelum memberikan respons. Peninjau latar belakang mempertahankan
eksekusi latar depan sebagai asal-usul proposal, tidak dapat mengakses alat agen umum, dan tidak dapat membuat keputusan
siklus hidup. Tinjauan hanya dimulai ketika runtime latar depan melaporkan model persis yang telah diresolusikan
dan bahwa `skill_workshop` memang tersedia. Oleh karena itu, kebijakan alat yang membatasi atau tidak diketahui
gagal secara tertutup dan tidak membuat proposal.

Lihat [Pembelajaran mandiri](/tools/self-learning) untuk perilaku lengkap tinjauan otonom dan model
keamanannya.

Deskripsi proposal selalu dibatasi hingga 160 byte, terlepas dari
`maxSkillBytes`.

## Metode Gateway

| Metode                             | Cakupan            |
| ---------------------------------- | ---------------- |
| `skills.proposals.list`            | `operator.read`  |
| `skills.proposals.inspect`         | `operator.read`  |
| `skills.proposals.historyStatus`   | `operator.read`  |
| `skills.proposals.historyScan`     | `operator.admin` |
| `skills.proposals.create`          | `operator.admin` |
| `skills.proposals.update`          | `operator.admin` |
| `skills.proposals.revise`          | `operator.admin` |
| `skills.proposals.requestRevision` | `operator.admin` |
| `skills.proposals.apply`           | `operator.admin` |
| `skills.proposals.reject`          | `operator.admin` |
| `skills.proposals.quarantine`      | `operator.admin` |
| `skills.curator.status`            | `operator.read`  |
| `skills.curator.pin`               | `operator.admin` |
| `skills.curator.unpin`             | `operator.admin` |
| `skills.curator.restore`           | `operator.admin` |

`requestRevision` hanya tersedia di Gateway (tanpa padanan CLI atau alat agen): metode ini
meneruskan instruksi revisi dalam teks bebas ke sesi percakapan agen pemilik
alih-alih mengganti `PROPOSAL.md` secara langsung, untuk UI yang meminta agen
merevisi, bukan mengirimkan konten baru secara harfiah.

`historyStatus` dan `historyScan` adalah metode pendukung UI Kontrol. `historyScan`
menerima `direction: "older" | "newer"`; metode ini selalu membiarkan hasil sebagai
proposal tertunda.

## Penyimpanan

```text
<OPENCLAW_STATE_DIR>/skill-workshop/
  proposals.json
  proposals/<proposal-id>/
    proposal.json
    PROPOSAL.md
    rollback.json
    assets/
    examples/
    references/
    scripts/
    templates/
```

Direktori status default: `~/.openclaw`.

- `proposal.json`: catatan proposal kanonis.
- `proposals.json`: indeks daftar cepat, dapat dibangun ulang dari folder proposal.
- `PROPOSAL.md`: proposal skill tertunda.
- `rollback.json`: metadata pemulihan yang ditulis sebelum penerapan mengubah berkas aktif.

## Batas

| Batas                           | Nilai                                                                |
| ------------------------------- | -------------------------------------------------------------------- |
| Deskripsi                     | 160 byte                                                            |
| Isi proposal                   | `skills.workshop.maxSkillBytes` (default 40,000; batas maksimum mutlak 1 MiB) |
| Berkas pendukung                   | 64 per proposal                                                      |
| Ukuran berkas pendukung               | masing-masing 256 KiB, total 2 MiB                                            |
| Proposal tertunda + dikarantina | `skills.workshop.maxPending` per ruang kerja (default 50)              |

## Pemecahan masalah

| Masalah                                        | Penyelesaian                                                                                                                                                                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | Persingkat `description` menjadi 160 byte atau kurang.                                                                                                                                                                 |
| `Skill proposal content is too large`          | Persingkat isi proposal atau naikkan `skills.workshop.maxSkillBytes`.                                                                                                                                         |
| `Target skill changed after proposal creation` | Revisi proposal terhadap target saat ini, atau buat proposal baru.                                                                                                                                   |
| `Proposal scan failed`                         | Periksa temuan pemindai, lalu revisi atau karantina proposal.                                                                                                                                           |
| `untrusted symlink target`                     | Konfigurasikan `skills.load.allowSymlinkTargets` dan aktifkan `skills.workshop.allowSymlinkTargetWrites` hanya untuk root skill bersama yang disengaja.                                                                  |
| `Support file paths must be under one of...`   | Pindahkan berkas pendukung ke bawah `assets/`, `examples/`, `references/`, `scripts/`, atau `templates/`.                                                                                                                |
| Proposal tidak muncul dalam daftar                 | Periksa ruang kerja `--agent` yang dipilih dan `OPENCLAW_STATE_DIR`.                                                                                                                                            |
| Agen tidak dapat memanggil `skill_workshop`             | Periksa kebijakan alat dan mode eksekusi yang aktif. `coding` menyertakan alat tersebut; kebijakan `tools.allow` yang membatasi harus mencantumkannya secara eksplisit, dan eksekusi dalam sandbox harus menggunakan sesi agen sisi host normal atau CLI. |

### Diagnostik kebijakan alat

Ketika pengambilan otonom diaktifkan, `openclaw doctor` menjalankan
pemeriksaan `core/doctor/skill-workshop-tool-policy` untuk agen default. Jika kebijakan
menyembunyikan `skill_workshop`, peringatan menyebutkan lapisan konfigurasi pertama yang mengecualikannya dan
perubahan persis pada `allow` atau `alsoAllow` yang harus dilakukan. Panduan operasi lama mungkin masih menggunakan
`openclaw plugins inspect skill-workshop`; perintah tersebut kini menjelaskan bahwa Skill
Workshop sudah terintegrasi dan mencetak petunjuk kebijakan yang sama jika berlaku.

## Terkait

- [Skills](/id/tools/skills) untuk urutan pemuatan, presedensi, dan visibilitas
- [Pembelajaran mandiri](/tools/self-learning) untuk proposal skill konservatif setelah eksekusi
- [Membuat skill](/id/tools/creating-skills) untuk dasar-dasar `SKILL.md`
  yang ditulis secara manual
- [Konfigurasi Skills](/id/tools/skills-config) untuk skema lengkap `skills.workshop`
- [CLI Skills](/id/cli/skills) untuk perintah `openclaw skills`
