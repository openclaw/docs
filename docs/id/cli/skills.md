---
read_when:
    - Anda ingin melihat Skills mana yang tersedia dan siap dijalankan
    - Anda ingin mencari di ClawHub atau menginstal skills dari ClawHub, Git, atau direktori lokal
    - Anda ingin memverifikasi keterampilan ClawHub dengan ClawHub
    - Anda ingin men-debug biner/env/konfigurasi yang hilang untuk Skills
summary: Referensi CLI untuk `openclaw skills` (search/install/update/verify/list/info/check/workshop)
title: Skills
x-i18n:
    generated_at: "2026-06-27T17:21:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f76c49e04559362cac9c0d12ce86cd422b46653242212c7611cc1033941ac43
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Periksa Skills lokal, cari di ClawHub, instal Skills dari direktori ClawHub/Git/lokal, verifikasi Skills ClawHub, dan perbarui instalasi yang dilacak ClawHub.

Terkait:

- Sistem Skills: [Skills](/id/tools/skills)
- Workshop Skill: [Workshop Skill](/id/tools/skill-workshop)
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
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
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

`search`, `update`, dan `verify` menggunakan ClawHub secara langsung. `install @owner/<slug>` menginstal skill ClawHub, `install git:owner/repo[@ref]` mengkloning skill Git, dan `install ./path` menyalin direktori skill lokal. Secara default, `install`, `update`, dan `verify` menargetkan direktori `skills/` ruang kerja aktif; dengan `--global`, perintah tersebut menargetkan direktori Skills terkelola bersama. `list`/`info`/`check` tetap memeriksa Skills lokal yang terlihat oleh ruang kerja dan konfigurasi saat ini. Perintah yang didukung ruang kerja menyelesaikan ruang kerja target dari `--agent <id>`, lalu direktori kerja saat ini ketika berada di dalam ruang kerja agen yang dikonfigurasi, lalu agen default.

Instalasi Git dan direktori lokal mengharapkan `SKILL.md` di root sumber. Slug instalasi berasal dari frontmatter `name` di `SKILL.md` ketika valid, lalu dari nama direktori sumber atau repositori; gunakan `--as <slug>` untuk menimpanya. `--version` hanya untuk ClawHub. Instalasi skill tidak mendukung spesifikasi paket npm atau jalur zip/arsip, dan `openclaw skills update` hanya memperbarui instalasi yang dilacak ClawHub.

Instalasi dependensi skill yang didukung Gateway yang dipicu dari onboarding atau pengaturan Skills menggunakan jalur permintaan `skills.install` yang terpisah.

Catatan:

- `search [query...]` menerima kueri opsional; hilangkan untuk menjelajahi feed pencarian default ClawHub.
- `search --limit <n>` membatasi hasil yang dikembalikan.
- `install git:owner/repo[@ref]` menginstal skill Git. Ref cabang dapat berisi garis miring, seperti `git:owner/repo@feature/foo`.
- `install ./path/to/skill` menginstal direktori lokal yang root-nya berisi `SKILL.md`.
- `install --as <slug>` menimpa slug yang disimpulkan untuk instalasi Git dan direktori lokal.
- `install --version <version>` hanya berlaku untuk ref skill ClawHub.
- `install --force` menimpa folder skill ruang kerja yang sudah ada untuk slug yang sama.
- Instalasi dan pembaruan skill ClawHub komunitas memeriksa kepercayaan sebelum mengunduh. Rilis arsip komunitas berversi menggunakan metadata kepercayaan rilis persis. Skills GitHub yang didukung resolver mengandalkan resolver instalasi ClawHub untuk menegakkan kebijakan pemindaian dan instalasi paksa sebelum mengembalikan commit yang dipin. Rilis komunitas berbahaya atau diblokir akan ditolak. Rilis komunitas berisiko memerlukan peninjauan dan `--acknowledge-clawhub-risk` ketika perintah non-interaktif harus melanjutkan setelah peninjauan tersebut. Penerbit skill ClawHub resmi dan sumber skill OpenClaw bawaan melewati prompt kepercayaan rilis ini.
- `--global` menargetkan direktori Skills terkelola bersama dan tidak dapat digabungkan dengan `--agent <id>`.
- `--agent <id>` menargetkan satu ruang kerja agen yang dikonfigurasi dan menimpa inferensi direktori kerja saat ini.
- `update @owner/<slug>` memperbarui satu skill yang dilacak. Tambahkan `--global` untuk menargetkan direktori Skills terkelola bersama alih-alih ruang kerja.
- `update --all` memperbarui instalasi ClawHub yang dilacak di ruang kerja yang dipilih, atau di direktori Skills terkelola bersama ketika digabungkan dengan `--global`.
- `verify @owner/<slug>` mencetak envelope JSON `clawhub.skill.verify.v1` milik ClawHub secara default. Tidak ada flag `--json` karena JSON sudah menjadi default. Slug polos tetap diterima untuk kompatibilitas ketika skill sudah terinstal atau tidak ambigu, tetapi ref dengan pemilik menghindari ambiguitas penerbit.
- Ketika ClawHub mengembalikan asal-usul sumber yang diselesaikan server, JSON verifikasi juga menyertakan `openclaw.verifiedSourceUrl` yang dipin ke commit. URL sumber yang tidak tersedia atau dideklarasikan sendiri tetap hanya berada di envelope asal-usul mentah dan tidak dipromosikan.
- `verify` menggunakan `.clawhub/origin.json` untuk Skills ClawHub yang terinstal, sehingga memverifikasi versi terinstal terhadap registry asalnya. `--version` dan `--tag` menimpa pemilih versi tetapi tetap menggunakan registry terinstal tersebut ketika metadata origin ada.
- `verify --card` mencetak Markdown Kartu Skill yang dihasilkan alih-alih JSON. Perintah keluar non-nol ketika ClawHub mengembalikan `ok: false` atau `decision: "fail"`; tanda tangan yang tidak ditandatangani bersifat informasional kecuali kebijakan ClawHub berubah.
- Bundel ClawHub yang terinstal dapat menyertakan `skill-card.md` yang dihasilkan. OpenClaw memperlakukan verifikasi sebagai keputusan server ClawHub dan tidak menolak skill terinstal hanya karena kartu yang dihasilkan tersebut mengubah fingerprint bundel.
- `check --agent <id>` memeriksa ruang kerja agen yang dipilih dan melaporkan Skills siap mana yang benar-benar terlihat oleh prompt atau permukaan perintah agen tersebut.
- `list` adalah tindakan default ketika tidak ada subperintah yang diberikan.
- `list`, `info`, dan `check` menulis output yang dirender ke stdout. Dengan `--json`, itu berarti payload yang dapat dibaca mesin tetap berada di stdout untuk pipe dan skrip.

## Workshop Skill

`openclaw skills workshop` mengelola proposal skill tertunda di ruang kerja yang dipilih. Proposal bukan skill aktif sampai diterapkan. Untuk penyimpanan proposal, pengamanan file pendukung, metode Gateway, dan kebijakan persetujuan, lihat [Workshop Skill](/id/tools/skill-workshop).

```bash
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal ./PROPOSAL.md
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal-dir ./qa-check-proposal
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

## Terkait

- [Referensi CLI](/id/cli)
- [Skills](/id/tools/skills)
