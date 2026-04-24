---
read_when:
    - Anda ingin agen mengubah koreksi atau prosedur yang dapat digunakan ulang menjadi Skills workspace
    - Anda sedang mengonfigurasi memori skill prosedural
    - Anda sedang men-debug perilaku alat `skill_workshop`
    - Anda sedang memutuskan apakah akan mengaktifkan pembuatan skill otomatis
summary: Pengambilan eksperimental prosedur yang dapat digunakan ulang sebagai Skills workspace dengan peninjauan, persetujuan, karantina, dan refresh skill panas
title: Plugin workshop skill
x-i18n:
    generated_at: "2026-04-24T09:21:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6063843bf15e639d7f5943db1bab52fbffce6ec30af350221d8b3cd711e227b
    source_path: plugins/skill-workshop.md
    workflow: 15
---

Skill Workshop bersifat **eksperimental**. Fitur ini nonaktif secara default, heuristik capture
dan prompt reviewer-nya dapat berubah antar rilis, dan penulisan otomatis seharusnya digunakan
hanya pada workspace tepercaya setelah meninjau output mode pending terlebih dahulu.

Skill Workshop adalah memori prosedural untuk Skills workspace. Fitur ini memungkinkan
agen mengubah alur kerja yang dapat digunakan ulang, koreksi pengguna, perbaikan yang
susah didapat, dan jebakan berulang menjadi file `SKILL.md` di bawah:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Ini berbeda dari memori jangka panjang:

- **Memory** menyimpan fakta, preferensi, entitas, dan konteks masa lalu.
- **Skills** menyimpan prosedur yang dapat digunakan ulang yang seharusnya diikuti agen pada tugas masa depan.
- **Skill Workshop** adalah jembatan dari giliran yang berguna ke skill workspace
  yang tahan lama, dengan pemeriksaan keamanan dan persetujuan opsional.

Skill Workshop berguna ketika agen mempelajari suatu prosedur seperti:

- cara memvalidasi aset GIF animasi yang bersumber secara eksternal
- cara mengganti aset tangkapan layar dan memverifikasi dimensinya
- cara menjalankan skenario QA khusus repo
- cara men-debug kegagalan provider yang berulang
- cara memperbaiki catatan alur kerja lokal yang basi

Fitur ini tidak dimaksudkan untuk:

- fakta seperti “pengguna menyukai warna biru”
- memori autobiografis yang luas
- pengarsipan transkrip mentah
- secret, kredensial, atau teks prompt tersembunyi
- instruksi sekali pakai yang tidak akan berulang

## State default

Plugin bawaan ini bersifat **eksperimental** dan **nonaktif secara default** kecuali
diaktifkan secara eksplisit di `plugins.entries.skill-workshop`.

Manifes Plugin tidak menyetel `enabledByDefault: true`. Default `enabled: true`
di dalam skema config Plugin hanya berlaku setelah entri Plugin
sudah dipilih dan dimuat.

Eksperimental berarti:

- Plugin cukup didukung untuk pengujian opt-in dan dogfooding
- penyimpanan proposal, ambang reviewer, dan heuristik capture dapat berkembang
- persetujuan tertunda adalah mode awal yang direkomendasikan
- penerapan otomatis ditujukan untuk penyiapan pribadi/workspace tepercaya, bukan environment bersama atau bermusuhan yang berat input

## Aktifkan

Config aman minimal:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "pending",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

Dengan config ini:

- alat `skill_workshop` tersedia
- koreksi eksplisit yang dapat digunakan ulang dimasukkan ke antrean sebagai proposal tertunda
- lintasan reviewer berbasis ambang dapat mengusulkan pembaruan skill
- tidak ada file skill yang ditulis sampai proposal tertunda diterapkan

Gunakan penulisan otomatis hanya di workspace tepercaya:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "auto",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

`approvalPolicy: "auto"` tetap menggunakan scanner dan jalur karantina yang sama. Kebijakan ini
tidak menerapkan proposal dengan temuan kritis.

## Konfigurasi

| Key                  | Default     | Range / values                              | Meaning                                                              |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | Mengaktifkan Plugin setelah entri Plugin dimuat.                     |
| `autoCapture`        | `true`      | boolean                                     | Mengaktifkan capture/review pasca-giliran pada giliran agen yang berhasil. |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | Masukkan proposal ke antrean atau tulis proposal aman secara otomatis. |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | Memilih capture koreksi eksplisit, reviewer LLM, keduanya, atau tidak keduanya. |
| `reviewInterval`     | `15`        | `1..200`                                    | Jalankan reviewer setelah sejumlah giliran berhasil ini.             |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | Jalankan reviewer setelah sejumlah pemanggilan alat teramati ini.    |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | Timeout untuk run reviewer tersemat.                                 |
| `maxPending`         | `50`        | `1..200`                                    | Jumlah maksimum proposal tertunda/dikarantina yang disimpan per workspace. |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | Ukuran maksimum skill/file pendukung yang dihasilkan.                |

Profil yang direkomendasikan:

```json5
// Konservatif: hanya penggunaan alat eksplisit, tanpa capture otomatis.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Tinjau dulu: tangkap secara otomatis, tetapi memerlukan persetujuan.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Otomasi tepercaya: tulis proposal aman segera.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Biaya rendah: tanpa panggilan reviewer LLM, hanya frasa koreksi eksplisit.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## Jalur capture

Skill Workshop memiliki tiga jalur capture.

### Saran alat

Model dapat langsung memanggil `skill_workshop` ketika melihat prosedur yang dapat digunakan ulang
atau ketika pengguna memintanya untuk menyimpan/memperbarui skill.

Ini adalah jalur yang paling eksplisit dan tetap berfungsi bahkan dengan `autoCapture: false`.

### Capture heuristik

Saat `autoCapture` diaktifkan dan `reviewMode` adalah `heuristic` atau `hybrid`, Plugin
memindai giliran yang berhasil untuk frasa koreksi pengguna yang eksplisit:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

Heuristik membuat proposal dari instruksi pengguna terbaru yang cocok. Heuristik ini
menggunakan petunjuk topik untuk memilih nama skill bagi alur kerja umum:

- tugas GIF animasi -> `animated-gif-workflow`
- tugas tangkapan layar atau aset -> `screenshot-asset-workflow`
- tugas QA atau skenario -> `qa-scenario-workflow`
- tugas GitHub PR -> `github-pr-workflow`
- fallback -> `learned-workflows`

Capture heuristik sengaja sempit. Ini ditujukan untuk koreksi yang jelas dan
catatan proses yang dapat diulang, bukan untuk peringkasan transkrip umum.

### Reviewer LLM

Saat `autoCapture` diaktifkan dan `reviewMode` adalah `llm` atau `hybrid`, Plugin
menjalankan reviewer tersemat yang ringkas setelah ambang tercapai.

Reviewer menerima:

- teks transkrip terbaru, dibatasi hingga 12.000 karakter terakhir
- hingga 12 Skills workspace yang ada
- hingga 2.000 karakter dari setiap skill yang ada
- instruksi hanya-JSON

Reviewer tidak memiliki alat:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

Reviewer mengembalikan salah satu dari `{ "action": "none" }` atau satu proposal. Field `action` adalah `create`, `append`, atau `replace` — pilih `append`/`replace` saat skill yang relevan sudah ada; gunakan `create` hanya ketika tidak ada skill yang ada yang cocok.

Contoh `create`:

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "Media Asset QA",
  "reason": "Reusable animated media acceptance workflow",
  "description": "Validate externally sourced animated media before product use.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution.\n- Store a local approved copy.\n- Verify in product UI before final reply."
}
```

`append` menambahkan `section` + `body`. `replace` menukar `oldText` dengan `newText` di skill yang disebutkan.

## Siklus hidup proposal

Setiap pembaruan yang dihasilkan menjadi proposal dengan:

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- `agentId` opsional
- `sessionId` opsional
- `skillName`
- `title`
- `reason`
- `source`: `tool`, `agent_end`, atau `reviewer`
- `status`
- `change`
- `scanFindings` opsional
- `quarantineReason` opsional

Status proposal:

- `pending` - menunggu persetujuan
- `applied` - ditulis ke `<workspace>/skills`
- `rejected` - ditolak oleh operator/model
- `quarantined` - diblokir oleh temuan scanner kritis

State disimpan per workspace di bawah direktori state Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Proposal pending dan quarantined dideduplikasi berdasarkan nama skill dan payload
perubahan. Store menyimpan proposal pending/quarantined terbaru hingga
`maxPending`.

## Referensi alat

Plugin mendaftarkan satu alat agen:

```text
skill_workshop
```

### `status`

Hitung proposal berdasarkan state untuk workspace aktif.

```json
{ "action": "status" }
```

Bentuk hasil:

```json
{
  "workspaceDir": "/path/to/workspace",
  "pending": 1,
  "quarantined": 0,
  "applied": 3,
  "rejected": 0
}
```

### `list_pending`

Daftarkan proposal pending.

```json
{ "action": "list_pending" }
```

Untuk mendaftar status lain:

```json
{ "action": "list_pending", "status": "applied" }
```

Nilai `status` yang valid:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

Daftarkan proposal yang dikarantina.

```json
{ "action": "list_quarantine" }
```

Gunakan ini saat capture otomatis tampak tidak melakukan apa-apa dan log menyebut
`skill-workshop: quarantined <skill>`.

### `inspect`

Ambil proposal berdasarkan id.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

Buat proposal. Dengan `approvalPolicy: "pending"` (default), ini mengantrekan alih-alih menulis.

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "Animated GIF Workflow",
  "reason": "User established reusable GIF validation rules.",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify the URL resolves to image/gif.\n- Confirm it has multiple frames.\n- Record attribution and license.\n- Avoid hotlinking when a local asset is needed."
}
```

<AccordionGroup>
  <Accordion title="Paksa penulisan aman (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

  </Accordion>

  <Accordion title="Paksa pending di bawah kebijakan auto (apply: false)">

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

  </Accordion>

  <Accordion title="Tambahkan ke section bernama">

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

  </Accordion>

  <Accordion title="Ganti teks yang persis">

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

  </Accordion>
</AccordionGroup>

### `apply`

Terapkan proposal pending.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` menolak proposal yang dikarantina:

```text
quarantined proposal cannot be applied
```

### `reject`

Tandai proposal sebagai ditolak.

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

Tulis file pendukung di dalam direktori skill yang sudah ada atau yang diusulkan.

Direktori pendukung tingkat atas yang diizinkan:

- `references/`
- `templates/`
- `scripts/`
- `assets/`

Contoh:

```json
{
  "action": "write_support_file",
  "skillName": "release-workflow",
  "relativePath": "references/checklist.md",
  "body": "# Release Checklist\n\n- Run release docs.\n- Verify changelog.\n"
}
```

File pendukung dibatasi ke workspace, diperiksa path-nya, dibatasi byte oleh
`maxSkillBytes`, dipindai, dan ditulis secara atomik.

## Penulisan skill

Skill Workshop menulis hanya di bawah:

```text
<workspace>/skills/<normalized-skill-name>/
```

Nama skill dinormalisasi:

- huruf kecil semua
- rangkaian non `[a-z0-9_-]` menjadi `-`
- non-alfanumerik di awal/akhir dihapus
- panjang maksimum 80 karakter
- nama akhir harus cocok dengan `[a-z0-9][a-z0-9_-]{1,79}`

Untuk `create`:

- jika skill belum ada, Skill Workshop menulis `SKILL.md` baru
- jika sudah ada, Skill Workshop menambahkan body ke `## Workflow`

Untuk `append`:

- jika skill ada, Skill Workshop menambahkan ke section yang diminta
- jika belum ada, Skill Workshop membuat skill minimal lalu menambahkan

Untuk `replace`:

- skill harus sudah ada
- `oldText` harus ada persis
- hanya kecocokan persis pertama yang diganti

Semua penulisan bersifat atomik dan segera me-refresh snapshot Skills di memori, sehingga
skill baru atau yang diperbarui dapat terlihat tanpa restart Gateway.

## Model keamanan

Skill Workshop memiliki scanner keamanan pada konten `SKILL.md` yang dihasilkan dan file
pendukung.

Temuan kritis mengarantina proposal:

| Rule id                                | Blocks content that...                                                |
| -------------------------------------- | --------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | menyuruh agen mengabaikan instruksi sebelumnya/lebih tinggi           |
| `prompt-injection-system`              | merujuk prompt sistem, pesan developer, atau instruksi tersembunyi    |
| `prompt-injection-tool`                | mendorong bypass izin/persetujuan alat                                |
| `shell-pipe-to-shell`                  | menyertakan `curl`/`wget` yang dipipe ke `sh`, `bash`, atau `zsh`     |
| `secret-exfiltration`                  | tampak mengirim data env/process env melalui jaringan                 |

Temuan peringatan dipertahankan tetapi tidak memblokir dengan sendirinya:

| Rule id              | Warns on...                      |
| -------------------- | -------------------------------- |
| `destructive-delete` | perintah gaya `rm -rf` yang luas |
| `unsafe-permissions` | penggunaan izin gaya `chmod 777` |

Proposal yang dikarantina:

- mempertahankan `scanFindings`
- mempertahankan `quarantineReason`
- muncul di `list_quarantine`
- tidak dapat diterapkan melalui `apply`

Untuk memulihkan proposal yang dikarantina, buat proposal aman baru dengan
konten yang tidak aman dihapus. Jangan edit JSON store secara manual.

## Panduan prompt

Saat diaktifkan, Skill Workshop menyuntikkan bagian prompt singkat yang memberi tahu agen
untuk menggunakan `skill_workshop` sebagai memori prosedural yang tahan lama.

Panduan tersebut menekankan:

- prosedur, bukan fakta/preferensi
- koreksi pengguna
- prosedur sukses yang tidak jelas
- jebakan yang berulang
- perbaikan skill yang basi/tipis/salah melalui append/replace
- menyimpan prosedur yang dapat digunakan ulang setelah loop alat yang panjang atau perbaikan sulit
- teks skill imperatif yang singkat
- tidak ada dump transkrip

Teks mode penulisan berubah dengan `approvalPolicy`:

- mode pending: antrekan saran; terapkan hanya setelah persetujuan eksplisit
- mode auto: terapkan pembaruan skill workspace yang aman saat jelas dapat digunakan ulang

## Biaya dan perilaku runtime

Capture heuristik tidak memanggil model.

Review LLM menggunakan run tersemat pada model agen aktif/default. Review ini
berbasis ambang sehingga secara default tidak berjalan pada setiap giliran.

Reviewer:

- menggunakan konteks provider/model yang sama saat tersedia
- fallback ke default agen runtime
- memiliki `reviewTimeoutMs`
- menggunakan konteks bootstrap yang ringan
- tidak memiliki alat
- tidak menulis apa pun secara langsung
- hanya dapat mengeluarkan proposal yang melewati scanner normal dan
  jalur persetujuan/karantina

Jika reviewer gagal, timeout, atau mengembalikan JSON tidak valid, Plugin mencatat
pesan peringatan/debug dan melewati lintasan review tersebut.

## Pola operasional

Gunakan Skill Workshop saat pengguna mengatakan:

- “next time, do X”
- “from now on, prefer Y”
- “make sure to verify Z”
- “save this as a workflow”
- “this took a while; remember the process”
- “update the local skill for this”

Teks skill yang baik:

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

Teks skill yang buruk:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

Alasan versi yang buruk tidak boleh disimpan:

- berbentuk transkrip
- tidak imperatif
- menyertakan detail sekali pakai yang berisik
- tidak memberi tahu agen berikutnya apa yang harus dilakukan

## Debugging

Periksa apakah Plugin dimuat:

```bash
openclaw plugins list --enabled
```

Periksa jumlah proposal dari konteks agen/alat:

```json
{ "action": "status" }
```

Periksa proposal pending:

```json
{ "action": "list_pending" }
```

Periksa proposal yang dikarantina:

```json
{ "action": "list_quarantine" }
```

Gejala umum:

| Symptom                               | Likely cause                                                                        | Check                                                                |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Alat tidak tersedia                   | Entri Plugin tidak diaktifkan                                                       | `plugins.entries.skill-workshop.enabled` dan `openclaw plugins list` |
| Tidak ada proposal otomatis muncul    | `autoCapture: false`, `reviewMode: "off"`, atau ambang belum tercapai               | Config, status proposal, log Gateway                                 |
| Heuristik tidak menangkap             | Kata-kata pengguna tidak cocok dengan pola koreksi                                  | Gunakan `skill_workshop.suggest` eksplisit atau aktifkan reviewer LLM |
| Reviewer tidak membuat proposal       | Reviewer mengembalikan `none`, JSON tidak valid, atau timeout                       | Log Gateway, `reviewTimeoutMs`, ambang                               |
| Proposal tidak diterapkan             | `approvalPolicy: "pending"`                                                         | `list_pending`, lalu `apply`                                         |
| Proposal hilang dari pending          | Proposal duplikat digunakan ulang, pruning max pending, atau sudah applied/rejected/quarantined | `status`, `list_pending` dengan filter status, `list_quarantine`     |
| File skill ada tetapi model melewatkannya | Snapshot skill tidak di-refresh atau gating skill mengecualikannya                | status `openclaw skills` dan kelayakan skill workspace               |

Log yang relevan:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## Skenario QA

Skenario QA berbasis repo:

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

Jalankan cakupan deterministik:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

Jalankan cakupan reviewer:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

Skenario reviewer sengaja dipisahkan karena mengaktifkan
`reviewMode: "llm"` dan menguji lintasan reviewer tersemat.

## Kapan tidak mengaktifkan auto apply

Hindari `approvalPolicy: "auto"` saat:

- workspace berisi prosedur sensitif
- agen bekerja pada input yang tidak tepercaya
- skill dibagikan ke tim yang luas
- Anda masih menyetel prompt atau aturan scanner
- model sering menangani konten web/email yang bermusuhan

Gunakan mode pending terlebih dahulu. Beralih ke mode auto hanya setelah meninjau jenis
skill yang diusulkan agen di workspace tersebut.

## Dokumentasi terkait

- [Skills](/id/tools/skills)
- [Plugins](/id/tools/plugin)
- [Testing](/id/reference/test)
