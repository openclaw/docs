---
read_when:
    - Anda ingin agen membuat atau memperbarui skill dari obrolan
    - Anda perlu meninjau, menerapkan, menolak, atau mengarantina draf skill yang dihasilkan
    - Anda sedang mengonfigurasi persetujuan, otonomi, penyimpanan, atau batas Skill Workshop
sidebarTitle: Skill Workshop
summary: Buat dan perbarui Skills ruang kerja melalui peninjauan Skill Workshop
title: Lokakarya Skills
x-i18n:
    generated_at: "2026-07-12T14:43:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e073e6ef874ad0dc885272cbb62f6e94c18b0c242a1d24a67a3095fee2ce0c9
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop adalah jalur OpenClaw yang terkelola untuk membuat dan memperbarui
Skills ruang kerja. Agen dan operator tidak pernah menulis `SKILL.md` secara langsung melalui
jalur ini — mereka membuat sebuah **proposal** (draf tertunda dengan konten, pengikatan
target, status pemindai, hash, dan metadata pemulihan) yang menjadi Skill aktif
hanya setelah diterapkan.

Skill Workshop hanya menulis Skills ruang kerja. Skill Workshop tidak pernah menyentuh Skills
bawaan, Plugin, ClawHub, akar tambahan, terkelola, agen pribadi, atau sistem.

## Cara kerjanya

- **Proposal terlebih dahulu:** konten yang dihasilkan disimpan sebagai `PROPOSAL.md`, bukan
  `SKILL.md`.
- **Penerapan adalah satu-satunya penulisan aktif:** membuat, memperbarui, dan merevisi tidak pernah mengubah
  Skills aktif.
- **Terbatas pada ruang kerja:** pembuatan menargetkan akar `skills/` ruang kerja; pembaruan
  hanya diizinkan untuk Skills ruang kerja yang dapat ditulis.
- **Tidak menimpa:** pembuatan gagal jika Skill target sudah ada.
- **Terikat hash:** proposal pembaruan terikat pada hash target saat ini dan menjadi
  `stale` jika Skill aktif berubah sebelum diterapkan.
- **Dibatasi pemindai:** penerapan menjalankan ulang pemindai keamanan sebelum menulis.
- **Dapat dipulihkan:** penerapan menulis metadata pemulihan sebelum menyentuh berkas aktif.
- **Antarmuka konsisten:** obrolan, CLI, dan Gateway semuanya memanggil layanan yang sama.

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

Gateway melacak penggunaan agregat Skill dalam basis data status bersama. Sekali
sehari, Gateway meninjau Skills yang dibuat dan diterapkan oleh Skill Workshop. Skills yang tidak digunakan selama
lebih dari 30 hari menjadi `stale`; setelah 90 hari, Skills tersebut menjadi `archived` dan
tidak disertakan dalam snapshot Skill agen baru. Berkas Skill yang diarsipkan tetap tidak berubah di
disk. Skills yang dibuat secara manual tidak pernah dikurasi; hanya Skills yang dibuat melalui proposal Skill
Workshop yang masuk ke kurasi siklus hidup.

Skills yang disematkan melewati transisi siklus hidup. Skill kedaluwarsa kembali menjadi `active`
setelah digunakan dan penyisiran berikutnya berjalan. Skills yang diarsipkan hanya kembali melalui
pemulihan eksplisit:

Transisi dan pemulihan siklus hidup berlaku untuk sesi baru; sesi yang sedang berjalan mempertahankan
snapshot Skill saat ini.

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

Semua perintah kurator menerima `--json`. Status juga melaporkan kandidat tumpang tindih
deterministik hanya sebagai saran; status tidak pernah menggabungkan Skills atau memanggil model.

## Obrolan

Minta Skill yang Anda inginkan kepada agen; agen akan memanggil `skill_workshop` dan mengembalikan
ID proposal.

### Belajar dari pekerjaan terbaru

Gunakan `/learn` untuk mengubah percakapan saat ini atau sumber yang disebutkan menjadi satu
proposal Skill yang dipandu standar:

```text
/learn
/learn docs/runbook.md and https://example.com/guide; focus on recovery
```

Tanpa permintaan, `/learn` meminta agen menyarikan alur kerja yang dapat digunakan kembali dari
percakapan saat ini. Dengan permintaan, agen memperlakukan jalur, URL, catatan yang ditempelkan,
dan rujukan percakapan sebagai sumber sambil mematuhi persyaratan fokus, cakupan, dan
penamaan. Agen mengumpulkan sumber dengan alat yang sudah tersedia, lalu memanggil
`skill_workshop` dengan `action: "create"`.

Proposal yang dihasilkan tetap `pending`; `/learn` tidak pernah menerapkannya. Tinjau dan
terapkan melalui alur persetujuan normal atau dengan `openclaw skills workshop`.

Buat:

```text
Buat Skill bernama morning-catchup yang menjalankan rutinitas kotak masuk hari Senin saya.
```

Perbarui Skill ruang kerja yang sudah ada:

```text
Perbarui trip-planning agar juga memeriksa peta kursi sebelum memesan.
```

Lakukan iterasi pada proposal tertunda:

```text
Tampilkan proposal morning-catchup.
Revisi agar juga menandai apa pun yang ditandai mendesak.
Terapkan proposal morning-catchup.
```

`apply`, `reject`, dan `quarantine` yang dimulai agen secara default menampilkan permintaan
persetujuan. Atur `skills.workshop.approvalPolicy` menjadi `"auto"` untuk melewatinya di
lingkungan tepercaya.

Permintaan tersebut mengidentifikasi ID proposal dan Skill target, serta menampilkan deskripsi
proposal, jumlah berkas pendukung, dan ukuran isi. Permintaan persetujuan dibatasi
agar selesai sebelum pengawas alat agen. Jika tidak ada keputusan sebelum
permintaan kedaluwarsa, tindakan siklus hidup tidak dijalankan: proposal tetap tertunda
dan tidak berubah. Putuskan nanti di UI Skill Workshop atau jalankan
`openclaw skills workshop apply|reject|quarantine <proposal-id>`. Agen tidak boleh
mencoba ulang tindakan siklus hidup yang kedaluwarsa secara berulang.

## CLI

```bash
# Buat
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Pengejaran kotak masuk harian: pilah, arsipkan, tampilkan, buat draf, rencanakan" \
  --proposal ./PROPOSAL.md

# Perbarui Skill ruang kerja yang sudah ada
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

Setiap subperintah menerima `--agent <id>` (ruang kerja target; secara default ditentukan dari
cwd, lalu agen default) dan `--json` (keluaran terstruktur).
`propose-create`, `propose-update`, dan `revise` juga menerima `--goal <text>` dan
`--evidence <text>` untuk merekam konteks proposal bersama `--proposal`.

## Konten proposal

Selama tertunda, proposal disimpan sebagai `PROPOSAL.md` dengan frontmatter khusus
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

Saat diterapkan, Skill Workshop menulis `SKILL.md` aktif dan menghapus bidang khusus
proposal: `status`, `version` proposal, dan `date` proposal.

## Berkas pendukung

Gunakan `--proposal-dir` ketika Skill yang diusulkan memerlukan berkas di samping
`PROPOSAL.md`:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Rangkuman Jumat: statistik, sorotan, tiga prioritas utama minggu depan" \
  --proposal-dir ./weekly-update-proposal
```

Direktori harus berisi `PROPOSAL.md`. Berkas pendukung harus berada di bawah
`assets/`, `examples/`, `references/`, `scripts/`, atau `templates/`. Skill
Workshop memindai, membuat hash, dan menyimpannya bersama proposal, lalu menulisnya
di samping `SKILL.md` aktif hanya saat diterapkan.

Jalur berkas pendukung yang ditolak: jalur absolut, segmen jalur tersembunyi, pelintasan
jalur, jalur yang tumpang tindih, berkas yang dapat dieksekusi, teks non-UTF-8, byte null,
dan jalur di luar folder pendukung standar.

## Alat agen

Model menggunakan `skill_workshop` dengan satu `action` wajib:
`create | update | revise | list | inspect | apply | reject | quarantine`.
Parameter lainnya berlaku bergantung pada tindakan:

| Parameter                  | Digunakan oleh                                        | Catatan                                                              |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                        | Wajib untuk `create`; jika tidak, menyelesaikan proposal tertunda berdasarkan nama |
| `description`              | `create`, `update`, `revise`                         | Maksimum 160 byte                                                    |
| `skill_name`               | `update`                                             | Nama atau kunci Skill yang sudah ada                                 |
| `proposal_content`         | `create`, `update`, `revise`                         | Disimpan sebagai `PROPOSAL.md`; dibatasi oleh `skills.workshop.maxSkillBytes` |
| `support_files`            | `create`, `update`, `revise`                         | Larik `{ path, content }`                                            |
| `goal`, `evidence`         | `create`, `update`, `revise`                         | Konteks teks bebas                                                   |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine` | Proposal target                                                      |
| `reason`                   | `apply`, `reject`, `quarantine`                      | Opsional                                                             |
| `query`, `status`, `limit` | `list`                                               | Filter/paginasi; maksimum `limit` 50, default 20                     |

Agen harus menggunakan `skill_workshop` untuk pekerjaan Skill yang dihasilkan. Agen tidak boleh
membuat atau mengubah berkas proposal melalui `write`, `edit`, `exec`, perintah shell,
atau operasi sistem berkas langsung.

<Note>
`skill_workshop` adalah alat agen bawaan dan disertakan dalam
`tools.profile: "coding"`. Jika kebijakan yang lebih ketat menyembunyikannya, tambahkan
`skill_workshop` ke daftar `tools.allow` yang aktif, atau gunakan
`tools.alsoAllow: ["skill_workshop"]` ketika cakupan menggunakan profil tanpa
`tools.allow` eksplisit. Proses dalam sandbox tidak membuat alat
Skill Workshop sisi host, jadi jalankan tindakan peninjauan proposal dari sesi agen
sisi host normal atau CLI.
</Note>

## Skills yang disarankan

OpenClaw mendeteksi instruksi yang bersifat tetap seperti “lain kali”, “ingat untuk”, dan koreksi reaktif
ketika giliran interaktif berakhir, termasuk giliran yang gagal. Pada giliran berikutnya, agen menawarkan untuk menyimpan
alur kerja terbaru yang terdeteksi melalui `skill_workshop`; pengguna memutuskan apakah akan membuat
proposal. Saran bawaan ini tidak membuat atau mengubah Skill dengan sendirinya. Aktifkan
`skills.workshop.autonomous.enabled` untuk membuat proposal tertunda secara langsung sebagai gantinya.

## Persetujuan dan otonomi

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: false,
      },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "pending",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

| Pengaturan                 | Default     | Dampak                                                                                                                                                                 |
| -------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`     | Membuat proposal tertunda secara langsung alih-alih menawarkan alur kerja terbaru yang terdeteksi pada giliran berikutnya.                                             |
| `allowSymlinkTargetWrites` | `false`     | Memungkinkan penerapan menulis melalui symlink Skill ruang kerja yang target aslinya tercantum dalam `skills.load.allowSymlinkTargets`.                                 |
| `approvalPolicy`           | `"pending"` | `"pending"` memerlukan permintaan persetujuan sebelum `apply`, `reject`, atau `quarantine` yang dimulai agen. `"auto"` melewati permintaan tersebut (agen tetap harus memanggil tindakan). |
| `maxPending`               | `50`        | Membatasi proposal tertunda dan dikarantina per ruang kerja (1-200).                                                                                                   |
| `maxSkillBytes`            | `40000`     | Membatasi ukuran isi proposal dalam byte (1024-200000).                                                                                                                |

Pengambilan otonom mengenali aturan prospektif (misalnya, “mulai sekarang”) dan
koreksi reaktif (misalnya, “bukan itu yang saya minta”). Fitur ini mengelompokkan instruksi baru berdasarkan topik menjadi
hingga tiga proposal per giliran, mengarahkan kecocokan kosakata ke Skills ruang kerja yang sudah ada dan dapat ditulis, serta
merevisi proposal tertundanya sendiri ketika koreksi lain menargetkan Skill yang sama.

Deskripsi proposal selalu dibatasi hingga 160 byte, terlepas dari
`maxSkillBytes`.

## Metode Gateway

| Metode                             | Cakupan          |
| ---------------------------------- | ---------------- |
| `skills.proposals.list`            | `operator.read`  |
| `skills.proposals.inspect`         | `operator.read`  |
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

`requestRevision` hanya tersedia melalui Gateway (tanpa padanan CLI atau alat agen): metode ini
meneruskan instruksi revisi dalam bentuk teks bebas ke sesi obrolan agen pemilik,
alih-alih mengganti `PROPOSAL.md` secara langsung, untuk UI yang meminta agen
melakukan revisi, bukan mengirimkan konten baru secara harfiah.

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
- `proposals.json`: indeks daftar cepat yang dapat dibangun ulang dari folder proposal.
- `PROPOSAL.md`: proposal skill yang tertunda.
- `rollback.json`: metadata pemulihan yang ditulis sebelum penerapan mengubah berkas aktif.

## Batas

| Batas                           | Nilai                                                                |
| ------------------------------- | -------------------------------------------------------------------- |
| Deskripsi                       | 160 byte                                                             |
| Isi proposal                    | `skills.workshop.maxSkillBytes` (default 40.000; batas maksimum 1 MiB) |
| Berkas pendukung                | 64 per proposal                                                      |
| Ukuran berkas pendukung         | Masing-masing 256 KiB, total 2 MiB                                   |
| Proposal tertunda + dikarantina | `skills.workshop.maxPending` per ruang kerja (default 50)             |

## Pemecahan masalah

| Masalah                                        | Penyelesaian                                                                                                                                                                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | Persingkat `description` menjadi 160 byte atau kurang.                                                                                                                                                       |
| `Skill proposal content is too large`          | Persingkat isi proposal atau naikkan `skills.workshop.maxSkillBytes`.                                                                                                                                        |
| `Target skill changed after proposal creation` | Revisi proposal berdasarkan target saat ini, atau buat proposal baru.                                                                                                                                        |
| `Proposal scan failed`                         | Periksa temuan pemindai, lalu revisi atau karantina proposal.                                                                                                                                                 |
| `untrusted symlink target`                     | Konfigurasikan `skills.load.allowSymlinkTargets` dan aktifkan `skills.workshop.allowSymlinkTargetWrites` hanya untuk root skill bersama yang memang disengaja.                                               |
| `Support file paths must be under one of...`   | Pindahkan berkas pendukung ke dalam `assets/`, `examples/`, `references/`, `scripts/`, atau `templates/`.                                                                                                     |
| Proposal tidak muncul dalam daftar             | Periksa ruang kerja `--agent` yang dipilih dan `OPENCLAW_STATE_DIR`.                                                                                                                                          |
| Agen tidak dapat memanggil `skill_workshop`    | Periksa kebijakan alat dan mode eksekusi yang aktif. `coding` menyertakan alat ini; kebijakan `tools.allow` yang membatasi harus mencantumkannya secara eksplisit, dan eksekusi dalam sandbox harus menggunakan sesi agen sisi host biasa atau CLI. |

### Diagnostik kebijakan alat

Saat pengambilan otonom diaktifkan, `openclaw doctor` menjalankan pemeriksaan
`core/doctor/skill-workshop-tool-policy` untuk agen default. Jika kebijakan
menyembunyikan `skill_workshop`, peringatan akan menyebutkan lapisan konfigurasi pertama yang mengecualikannya dan
perubahan persis pada `allow` atau `alsoAllow` yang harus dilakukan. Panduan operasional lama mungkin masih menggunakan
`openclaw plugins inspect skill-workshop`; perintah tersebut kini menjelaskan bahwa Skill
Workshop sudah terintegrasi dan menampilkan petunjuk kebijakan yang sama jika berlaku.

## Terkait

- [Skills](/id/tools/skills) untuk urutan pemuatan, presedensi, dan visibilitas
- [Membuat skill](/id/tools/creating-skills) untuk dasar-dasar penulisan manual `SKILL.md`
- [Konfigurasi Skills](/id/tools/skills-config) untuk skema lengkap `skills.workshop`
- [CLI Skills](/id/cli/skills) untuk perintah `openclaw skills`
