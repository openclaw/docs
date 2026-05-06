---
read_when:
    - Anda ingin agen mengubah koreksi atau prosedur yang dapat digunakan kembali menjadi Skills ruang kerja
    - Anda sedang mengonfigurasi memori keterampilan prosedural
    - Anda sedang men-debug perilaku alat skill_workshop
    - Anda sedang memutuskan apakah akan mengaktifkan pembuatan Skills otomatis
summary: Penangkapan eksperimental prosedur yang dapat digunakan kembali sebagai Skills ruang kerja dengan peninjauan, persetujuan, karantina, dan penyegaran skill secara langsung
title: Plugin lokakarya Skill
x-i18n:
    generated_at: "2026-05-06T09:23:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03c4259777823d256bd00374858b9f47d310e727db360db37f9ba7ad3583d9dc
    source_path: plugins/skill-workshop.md
    workflow: 16
---

Skill Workshop bersifat **eksperimental**. Fitur ini dinonaktifkan secara default, heuristik pengambilan dan prompt peninjaunya dapat berubah antar-rilis, dan penulisan otomatis sebaiknya digunakan hanya di ruang kerja tepercaya setelah meninjau output mode tertunda terlebih dahulu.

Skill Workshop adalah memori prosedural untuk Skills ruang kerja. Fitur ini memungkinkan agen mengubah alur kerja yang dapat digunakan kembali, koreksi pengguna, perbaikan yang diperoleh dengan susah payah, dan kendala berulang menjadi berkas `SKILL.md` di bawah:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Ini berbeda dari memori jangka panjang:

- **Memory** menyimpan fakta, preferensi, entitas, dan konteks sebelumnya.
- **Skills** menyimpan prosedur yang dapat digunakan kembali yang harus diikuti agen pada tugas mendatang.
- **Skill Workshop** adalah jembatan dari satu giliran yang berguna ke skill ruang kerja yang tahan lama, dengan pemeriksaan keselamatan dan persetujuan opsional.

Skill Workshop berguna ketika agen mempelajari prosedur seperti:

- cara memvalidasi aset GIF animasi yang bersumber dari luar
- cara mengganti aset tangkapan layar dan memverifikasi dimensi
- cara menjalankan skenario QA khusus repo
- cara men-debug kegagalan penyedia yang berulang
- cara memperbaiki catatan alur kerja lokal yang basi

Fitur ini tidak ditujukan untuk:

- fakta seperti "pengguna menyukai warna biru"
- memori autobiografis yang luas
- pengarsipan transkrip mentah
- rahasia, kredensial, atau teks prompt tersembunyi
- instruksi sekali pakai yang tidak akan berulang

## Status default

Plugin bawaan ini bersifat **eksperimental** dan **dinonaktifkan secara default** kecuali diaktifkan secara eksplisit di `plugins.entries.skill-workshop`.

Manifes Plugin tidak menetapkan `enabledByDefault: true`. Default `enabled: true` di dalam skema konfigurasi Plugin hanya berlaku setelah entri Plugin sudah dipilih dan dimuat.

Eksperimental berarti:

- Plugin didukung secukupnya untuk pengujian opt-in dan penggunaan internal
- penyimpanan proposal, ambang peninjau, dan heuristik pengambilan dapat berkembang
- persetujuan tertunda adalah mode awal yang direkomendasikan
- penerapan otomatis ditujukan untuk pengaturan pribadi/ruang kerja tepercaya, bukan lingkungan bersama atau tidak tepercaya yang padat input

## Mengaktifkan

Konfigurasi aman minimal:

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

Dengan konfigurasi ini:

- alat `skill_workshop` tersedia
- koreksi eksplisit yang dapat digunakan kembali diantrekan sebagai proposal tertunda
- pemeriksaan peninjau berbasis ambang dapat mengusulkan pembaruan skill
- tidak ada berkas skill yang ditulis sampai proposal tertunda diterapkan

Gunakan penulisan otomatis hanya di ruang kerja tepercaya:

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

`approvalPolicy: "auto"` tetap menggunakan pemindai dan jalur karantina yang sama. Ini tidak menerapkan proposal dengan temuan kritis.

## Konfigurasi

| Kunci                | Default     | Rentang / nilai                            | Makna                                                                 |
| -------------------- | ----------- | ------------------------------------------ | --------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                    | Mengaktifkan Plugin setelah entri Plugin dimuat.                      |
| `autoCapture`        | `true`      | boolean                                    | Mengaktifkan pengambilan/peninjauan pasca-giliran pada giliran agen yang berhasil. |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                      | Mengantrekan proposal atau menulis proposal aman secara otomatis.      |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | Memilih pengambilan koreksi eksplisit, peninjau LLM, keduanya, atau tidak keduanya. |
| `reviewInterval`     | `15`        | `1..200`                                   | Menjalankan peninjau setelah jumlah giliran berhasil ini.              |
| `reviewMinToolCalls` | `8`         | `1..500`                                   | Menjalankan peninjau setelah jumlah panggilan alat yang diamati ini.   |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                             | Batas waktu untuk proses peninjau tertanam.                            |
| `maxPending`         | `50`        | `1..200`                                   | Maksimum proposal tertunda/dikarantina yang disimpan per ruang kerja.  |
| `maxSkillBytes`      | `40000`     | `1024..200000`                             | Ukuran maksimum berkas skill/pendukung yang dihasilkan.                |

Profil yang direkomendasikan:

```json5
// Konservatif: hanya penggunaan alat eksplisit, tanpa pengambilan otomatis.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Dahulukan peninjauan: ambil secara otomatis, tetapi wajibkan persetujuan.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Otomatisasi tepercaya: tulis proposal aman segera.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Biaya rendah: tanpa panggilan LLM peninjau, hanya frasa koreksi eksplisit.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## Jalur pengambilan

Skill Workshop memiliki tiga jalur pengambilan.

### Saran alat

Model dapat memanggil `skill_workshop` secara langsung ketika melihat prosedur yang dapat digunakan kembali atau ketika pengguna memintanya untuk menyimpan/memperbarui skill.

Ini adalah jalur yang paling eksplisit dan berfungsi bahkan dengan `autoCapture: false`.

### Pengambilan heuristik

Ketika `autoCapture` diaktifkan dan `reviewMode` adalah `heuristic` atau `hybrid`, Plugin memindai giliran yang berhasil untuk frasa koreksi pengguna eksplisit:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

Heuristik membuat proposal dari instruksi pengguna terbaru yang cocok. Ini menggunakan petunjuk topik untuk memilih nama skill untuk alur kerja umum:

- tugas GIF animasi -> `animated-gif-workflow`
- tugas tangkapan layar atau aset -> `screenshot-asset-workflow`
- tugas QA atau skenario -> `qa-scenario-workflow`
- tugas PR GitHub -> `github-pr-workflow`
- cadangan -> `learned-workflows`

Pengambilan heuristik sengaja dibuat sempit. Ini ditujukan untuk koreksi yang jelas dan catatan proses yang dapat diulang, bukan untuk peringkasan transkrip umum.

### Peninjau LLM

Ketika `autoCapture` diaktifkan dan `reviewMode` adalah `llm` atau `hybrid`, Plugin menjalankan peninjau tertanam yang ringkas setelah ambang tercapai.

Peninjau menerima:

- teks transkrip terbaru, dibatasi hingga 12.000 karakter terakhir
- hingga 12 skill ruang kerja yang sudah ada
- hingga 2.000 karakter dari setiap skill yang sudah ada
- instruksi khusus JSON

Peninjau tidak memiliki alat:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

Peninjau mengembalikan `{ "action": "none" }` atau satu proposal. Bidang `action` adalah `create`, `append`, atau `replace` - utamakan `append`/`replace` ketika skill yang relevan sudah ada; gunakan `create` hanya ketika tidak ada skill yang cocok.

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

`append` menambahkan `section` + `body`. `replace` menukar `oldText` dengan `newText` di skill bernama.

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

Status disimpan per workspace di bawah direktori status Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Proposal tertunda dan dikarantina didedupplikasi berdasarkan nama skill dan payload
perubahan. Penyimpanan menyimpan proposal tertunda/dikarantina terbaru hingga
`maxPending`.

## Referensi tool

Plugin mendaftarkan satu tool agent:

```text
skill_workshop
```

### `status`

Hitung proposal berdasarkan status untuk workspace aktif.

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

Cantumkan proposal tertunda.

```json
{ "action": "list_pending" }
```

Untuk mencantumkan status lain:

```json
{ "action": "list_pending", "status": "applied" }
```

Nilai `status` yang valid:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

Cantumkan proposal yang dikarantina.

```json
{ "action": "list_quarantine" }
```

Gunakan ini saat penangkapan otomatis tampaknya tidak melakukan apa pun dan log menyebutkan
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
  <Accordion title="Force a safe write (apply: true)">

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

  <Accordion title="Force pending under auto policy (apply: false)">

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

  <Accordion title="Append to a named section">

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

  <Accordion title="Replace exact text">

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

Terapkan proposal tertunda.

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

File pendukung dicakupkan ke ruang kerja, diperiksa jalurnya, dibatasi byte oleh
`maxSkillBytes`, dipindai, dan ditulis secara atomik.

## Penulisan Skill

Skill Workshop hanya menulis di bawah:

```text
<workspace>/skills/<normalized-skill-name>/
```

Nama Skill dinormalisasi:

- diubah menjadi huruf kecil
- rangkaian non `[a-z0-9_-]` menjadi `-`
- non-alfanumerik di awal/akhir dihapus
- panjang maksimum adalah 80 karakter
- nama akhir harus cocok dengan `[a-z0-9][a-z0-9_-]{1,79}`

Untuk `create`:

- jika skill belum ada, Skill Workshop menulis `SKILL.md` baru
- jika sudah ada, Skill Workshop menambahkan isi ke `## Workflow`

Untuk `append`:

- jika skill ada, Skill Workshop menambahkan ke bagian yang diminta
- jika belum ada, Skill Workshop membuat skill minimal lalu menambahkannya

Untuk `replace`:

- skill harus sudah ada
- `oldText` harus ada secara persis
- hanya kecocokan persis pertama yang diganti

Semua penulisan bersifat atomik dan langsung menyegarkan snapshot skill dalam memori, sehingga
skill baru atau yang diperbarui dapat terlihat tanpa memulai ulang Gateway.

## Model keamanan

Skill Workshop memiliki pemindai keamanan pada konten `SKILL.md` yang dihasilkan dan file
pendukung.

Temuan kritis mengarantina proposal:

| ID aturan                              | Memblokir konten yang...                                                |
| -------------------------------------- | ----------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | menyuruh agen mengabaikan instruksi sebelumnya/lebih tinggi             |
| `prompt-injection-system`              | merujuk prompt sistem, pesan developer, atau instruksi tersembunyi      |
| `prompt-injection-tool`                | mendorong bypass izin/persetujuan tool                                  |
| `shell-pipe-to-shell`                  | menyertakan `curl`/`wget` yang dipipe ke `sh`, `bash`, atau `zsh`       |
| `secret-exfiltration`                  | tampak mengirim data env/process env melalui jaringan                   |

Temuan peringatan dipertahankan tetapi tidak memblokir sendiri:

| ID aturan            | Memperingatkan pada...                  |
| -------------------- | --------------------------------------- |
| `destructive-delete` | perintah luas bergaya `rm -rf`          |
| `unsafe-permissions` | penggunaan izin bergaya `chmod 777`     |

Proposal yang dikarantina:

- menyimpan `scanFindings`
- menyimpan `quarantineReason`
- muncul di `list_quarantine`
- tidak dapat diterapkan melalui `apply`

Untuk memulihkan dari proposal yang dikarantina, buat proposal aman baru dengan
konten tidak aman dihapus. Jangan edit JSON penyimpanan secara manual.

## Panduan prompt

Saat diaktifkan, Skill Workshop menyisipkan bagian prompt singkat yang memberi tahu agen
untuk menggunakan `skill_workshop` bagi memori prosedural yang tahan lama.

Panduan menekankan:

- prosedur, bukan fakta/preferensi
- koreksi pengguna
- prosedur berhasil yang tidak jelas
- jebakan berulang
- perbaikan skill yang usang/tipis/salah melalui append/replace
- menyimpan prosedur yang dapat digunakan ulang setelah loop tool panjang atau perbaikan sulit
- teks skill imperatif singkat
- tanpa dump transkrip

Teks mode penulisan berubah dengan `approvalPolicy`:

- mode pending: antrekan saran; terapkan hanya setelah persetujuan eksplisit
- mode auto: terapkan pembaruan skill ruang kerja yang aman saat jelas dapat digunakan ulang

## Biaya dan perilaku runtime

Penangkapan heuristik tidak memanggil model.

Tinjauan LLM menggunakan run tertanam pada model agen aktif/default. Ini berbasis
ambang batas sehingga secara default tidak berjalan pada setiap giliran.

Reviewer:

- menggunakan konteks provider/model terkonfigurasi yang sama saat tersedia
- fallback ke default agen runtime
- memiliki `reviewTimeoutMs`
- menggunakan konteks bootstrap ringan
- tidak memiliki tool
- tidak menulis apa pun secara langsung
- hanya dapat menerbitkan proposal yang melewati jalur pemindai normal dan
  persetujuan/karantina

Jika reviewer gagal, timeout, atau mengembalikan JSON tidak valid, plugin mencatat
pesan peringatan/debug dan melewati pass tinjauan tersebut.

## Pola operasi

Gunakan Skill Workshop saat pengguna mengatakan:

- "next time, do X"
- "from now on, prefer Y"
- "make sure to verify Z"
- "save this as a workflow"
- "this took a while; remember the process"
- "update the local skill for this"

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

Alasan versi buruk tidak boleh disimpan:

- berbentuk transkrip
- tidak imperatif
- menyertakan detail sekali pakai yang bising
- tidak memberi tahu agen berikutnya apa yang harus dilakukan

## Debugging

Periksa apakah plugin dimuat:

```bash
openclaw plugins list --enabled
```

Periksa jumlah proposal dari konteks agen/tool:

```json
{ "action": "status" }
```

Inspeksi proposal tertunda:

```json
{ "action": "list_pending" }
```

Inspeksi proposal yang dikarantina:

```json
{ "action": "list_quarantine" }
```

Gejala umum:

| Gejala                                | Kemungkinan penyebab                                                                | Periksa                                                              |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Tool tidak tersedia                   | Entri Plugin tidak diaktifkan                                                       | `plugins.entries.skill-workshop.enabled` dan `openclaw plugins list` |
| Tidak ada proposal otomatis muncul    | `autoCapture: false`, `reviewMode: "off"`, atau ambang batas tidak terpenuhi        | Konfigurasi, status proposal, log Gateway                            |
| Heuristik tidak menangkap             | Susunan kata pengguna tidak cocok dengan pola koreksi                               | Gunakan `skill_workshop.suggest` eksplisit atau aktifkan reviewer LLM |
| Reviewer tidak membuat proposal       | Reviewer mengembalikan `none`, JSON tidak valid, atau timeout                       | Log Gateway, `reviewTimeoutMs`, ambang batas                         |
| Proposal tidak diterapkan             | `approvalPolicy: "pending"`                                                         | `list_pending`, lalu `apply`                                         |
| Proposal hilang dari pending          | Proposal duplikat digunakan ulang, pemangkasan pending maksimum, atau diterapkan/ditolak/dikarantina | `status`, `list_pending` dengan filter status, `list_quarantine` |
| File skill ada tetapi model melewatkannya | Snapshot skill tidak disegarkan atau gating skill mengecualikannya               | status `openclaw skills` dan kelayakan skill ruang kerja             |

Log relevan:

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
`reviewMode: "llm"` dan menguji pass reviewer tertanam.

## Kapan tidak mengaktifkan penerapan otomatis

Hindari `approvalPolicy: "auto"` ketika:

- ruang kerja berisi prosedur sensitif
- agen sedang menangani input tidak tepercaya
- skills dibagikan ke tim yang luas
- Anda masih menyetel prompt atau aturan pemindai
- model sering menangani konten web/email yang bermusuhan

Gunakan mode pending terlebih dahulu. Beralih ke mode auto hanya setelah meninjau jenis
skills yang diusulkan agen di ruang kerja tersebut.

## Dokumen terkait

- [Skills](/id/tools/skills)
- [Plugins](/id/tools/plugin)
- [Pengujian](/id/reference/test)
