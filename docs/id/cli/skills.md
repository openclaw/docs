---
read_when:
    - Anda ingin melihat Skills mana yang tersedia dan siap dijalankan
    - Anda ingin mencari di ClawHub atau menginstal Skills dari ClawHub, Git, atau direktori lokal
    - Anda ingin memverifikasi Skills ClawHub dengan ClawHub
    - Anda ingin men-debug biner/variabel lingkungan/konfigurasi yang tidak tersedia untuk Skills
summary: Referensi CLI untuk `openclaw skills` (mencari/menginstal/memperbarui/memverifikasi/mencantumkan/info/memeriksa/lokakarya)
title: Skills
x-i18n:
    generated_at: "2026-07-12T14:07:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3eafd40704b666e6be185aa8148b60613c861a2899fb9b0cc3353212e8e4d678
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Periksa Skills lokal, cari di ClawHub, instal Skills dari ClawHub/Git/direktori
lokal, verifikasi Skills ClawHub, dan perbarui instalasi yang dilacak ClawHub.

Terkait:

- Sistem Skills: [Skills](/id/tools/skills)
- Lokakarya Skill: [Lokakarya Skill](/id/tools/skill-workshop)
- Konfigurasi Skills: [Konfigurasi Skills](/id/tools/skills-config)
- Instalasi ClawHub: [ClawHub](/id/clawhub/cli)

## Perintah

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install @owner/<slug>
openclaw skills install @owner/<slug> --version <version>
openclaw skills install git:owner/repo
openclaw skills install git:owner/repo@main
openclaw skills install ./path/to/skill --as custom-name
openclaw skills install @owner/<slug> --force
openclaw skills install @owner/<slug> --force-install
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
openclaw skills update @owner/<slug> --force-install
openclaw skills update @owner/<slug> --acknowledge-clawhub-risk
openclaw skills update @owner/<slug> --global
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills update --all --global
openclaw skills verify @owner/<slug>
openclaw skills verify @owner/<slug> --version <version>
openclaw skills verify @owner/<slug> --tag <tag>
openclaw skills verify @owner/<slug> --card
openclaw skills verify @owner/<slug> --global
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --agent <id>
openclaw skills check --json
openclaw skills workshop propose-create --name "qa-check" --description "QA checklist" --proposal ./PROPOSAL.md
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Not reusable"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

`search`, `update`, dan `verify` menggunakan ClawHub secara langsung. `install @owner/<slug>`
menginstal Skill ClawHub, `install git:owner/repo[@ref]` mengkloning Skill Git,
dan `install ./path` menyalin direktori Skill lokal. Secara default, `install`,
`update`, dan `verify` menargetkan direktori `skills/` ruang kerja aktif; dengan
`--global`, perintah tersebut menargetkan direktori Skills terkelola bersama. `list`/`info`/`check`
tetap memeriksa Skills lokal yang terlihat oleh ruang kerja dan konfigurasi saat ini.
Perintah berbasis ruang kerja menentukan ruang kerja target dari `--agent <id>`,
kemudian direktori kerja saat ini jika berada di dalam ruang kerja agen yang
dikonfigurasi, lalu agen default.

Instalasi Git dan direktori lokal mengharapkan `SKILL.md` di root sumber. Slug
instalasi berasal dari `name` pada frontmatter `SKILL.md` jika valid, kemudian
nama direktori sumber atau repositori; gunakan `--as <slug>` untuk menggantinya.
`--version` hanya berlaku untuk ClawHub. Instalasi Skill tidak mendukung spesifikasi
paket npm atau jalur zip/arsip, dan `openclaw skills update` hanya memperbarui
instalasi yang dilacak ClawHub.

Instalasi dependensi Skill berbasis Gateway yang dipicu dari orientasi awal atau
pengaturan Skills menggunakan jalur permintaan `skills.install` yang terpisah.

Catatan:

| Flag/perilaku                    | Deskripsi                                                                                                                                                                                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search [query...]`              | Kueri opsional; abaikan untuk menelusuri umpan pencarian ClawHub default.                                                                                                                                                                                                        |
| `search --limit <n>`             | Membatasi hasil yang dikembalikan.                                                                                                                                                                                                                                               |
| `install git:owner/repo[@ref]`   | Menginstal Skill Git. Referensi cabang dapat berisi garis miring, seperti `git:owner/repo@feature/foo`.                                                                                                                                                                           |
| `install ./path/to/skill`        | Menginstal direktori lokal yang root-nya berisi `SKILL.md`.                                                                                                                                                                                                                       |
| `install --as <slug>`            | Mengganti slug yang disimpulkan untuk instalasi Git dan direktori lokal.                                                                                                                                                                                                          |
| `install --version <version>`    | Hanya berlaku untuk referensi Skill ClawHub.                                                                                                                                                                                                                                      |
| `install --force`                | Menimpa folder Skill ruang kerja yang sudah ada untuk slug yang sama.                                                                                                                                                                                                             |
| `install/update --force-install` | Menginstal Skill ClawHub berbasis GitHub yang tertunda sebelum pemindaian ClawHub selesai.                                                                                                                                                                                        |
| `--global`                       | Menargetkan direktori Skills terkelola bersama; tidak dapat digabungkan dengan `--agent <id>`.                                                                                                                                                                                    |
| `--agent <id>`                   | Menargetkan satu ruang kerja agen yang dikonfigurasi; menggantikan inferensi direktori kerja saat ini.                                                                                                                                                                            |
| `update @owner/<slug>`           | Memperbarui satu Skill yang dilacak. Tambahkan `--global` untuk menargetkan direktori Skills terkelola bersama, bukan ruang kerja.                                                                                                                                                 |
| `update --all`                   | Memperbarui instalasi ClawHub yang dilacak di ruang kerja terpilih, atau direktori Skills terkelola bersama dengan `--global`.                                                                                                                                                     |
| `verify @owner/<slug>`           | Secara default mencetak amplop JSON `clawhub.skill.verify.v1` dari ClawHub. Tidak ada flag `--json` karena JSON sudah menjadi format default. Slug tanpa pemilik diterima demi kompatibilitas jika Skill sudah diinstal atau tidak ambigu; referensi berkualifikasi pemilik menghindari ambiguitas penerbit. |
| Asal-usul `verify`               | Ketika ClawHub mengembalikan asal-usul sumber yang ditentukan server, JSON verifikasi juga menyertakan `openclaw.verifiedSourceUrl` yang disematkan ke commit. URL sumber yang tidak tersedia atau dinyatakan sendiri tetap hanya berada dalam amplop asal-usul mentah dan tidak dipromosikan. |
| Pemilih versi `verify`           | `verify` menggunakan `.clawhub/origin.json` untuk Skills ClawHub yang terinstal, sehingga versi terinstal diverifikasi terhadap registri asalnya. `--version` dan `--tag` mengganti pemilih versi tetapi tetap menggunakan registri terinstal tersebut jika metadata asal tersedia. |
| `verify --card`                  | Mencetak Markdown Kartu Skill yang dihasilkan, bukan JSON. Keluar dengan status bukan nol ketika ClawHub mengembalikan `ok: false` atau `decision: "fail"`; tanda tangan tanpa penandatanganan hanya bersifat informasional kecuali kebijakan ClawHub berubah. |
| Sidik jari Kartu Skill           | Bundel ClawHub yang terinstal dapat menyertakan `skill-card.md` yang dihasilkan. OpenClaw memperlakukan verifikasi sebagai keputusan server ClawHub dan tidak menolak Skill yang terinstal hanya karena kartu yang dihasilkan tersebut mengubah sidik jari bundel. |
| `check --agent <id>`             | Memeriksa ruang kerja agen terpilih dan melaporkan Skills siap pakai mana yang benar-benar terlihat oleh permukaan perintah atau prompt agen tersebut.                                                                                                                             |
| `list`                           | Tindakan default jika tidak ada subperintah yang diberikan.                                                                                                                                                                                                                       |
| Keluaran `list`/`info`/`check`   | Keluaran yang dirender dikirim ke stdout. Dengan `--json`, muatan yang dapat dibaca mesin tetap berada di stdout untuk pipe dan skrip.                                                                                                                                             |

Instalasi dan pembaruan Skill komunitas ClawHub memeriksa kepercayaan sebelum
mengunduh. Rilis arsip komunitas berversi menggunakan metadata kepercayaan rilis
yang tepat. Skill GitHub berbasis resolver mengandalkan resolver instalasi ClawHub
untuk menerapkan kebijakan pemindaian dan instalasi paksa sebelum mengembalikan
commit yang disematkan; gunakan `--force-install` untuk menginstal Skill berbasis
GitHub yang tertunda sebelum pemindaian tersebut selesai. Rilis komunitas yang
berbahaya atau diblokir akan ditolak. Rilis komunitas berisiko memerlukan
peninjauan dan `--acknowledge-clawhub-risk` jika perintah noninteraktif harus
dilanjutkan setelah peninjauan tersebut. Penerbit Skill ClawHub resmi dan sumber
Skill OpenClaw bawaan melewati prompt kepercayaan rilis ini.

## Lokakarya Skill

`openclaw skills workshop` mengelola proposal Skill tertunda di ruang kerja
terpilih. Proposal bukanlah Skill aktif hingga diterapkan. Untuk penyimpanan
proposal, perlindungan berkas pendukung, metode Gateway, dan kebijakan persetujuan,
lihat [Lokakarya Skill](/id/tools/skill-workshop).

```bash
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Daftar periksa QA yang dapat diulang" \
  --proposal ./PROPOSAL.md
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Daftar periksa QA yang dapat diulang" \
  --proposal-dir ./qa-check-proposal
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplikat"
openclaw skills workshop quarantine <proposal-id> --reason "Memerlukan tinjauan keamanan"
```

`propose-create`, `propose-update`, dan `revise` juga menerima `--goal <text>`
dan `--evidence <text>` untuk mencatat motivasi proposal dan catatan
pendukung bersama konten `--proposal`/`--proposal-dir`.

## Terkait

- [Referensi CLI](/id/cli)
- [Skills](/id/tools/skills)
