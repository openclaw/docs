---
read_when:
    - Anda menginginkan workflow multi-langkah deterministik dengan persetujuan eksplisit
    - Anda perlu melanjutkan workflow tanpa menjalankan ulang langkah-langkah sebelumnya
summary: Runtime workflow bertipe untuk OpenClaw dengan gate persetujuan yang dapat dilanjutkan kembali.
title: Lobster
x-i18n:
    generated_at: "2026-04-24T09:31:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce1dbd73cc90091d02862af183a2f8658d6cbe6623c100baf7992b5e18041edb
    source_path: tools/lobster.md
    workflow: 15
---

Lobster adalah shell workflow yang memungkinkan OpenClaw menjalankan urutan alat multi-langkah sebagai satu operasi deterministik, dengan checkpoint persetujuan yang eksplisit.

Lobster adalah satu lapisan authoring di atas pekerjaan background yang dipisahkan. Untuk orkestrasi alur di atas tugas individual, lihat [TaskFlow](/id/automation/taskflow) (`openclaw tasks flow`). Untuk ledger aktivitas tugas, lihat [`openclaw tasks`](/id/automation/tasks).

## Hook

Asisten Anda dapat membangun alat yang mengelola dirinya sendiri. Minta sebuah workflow, dan 30 menit kemudian Anda memiliki CLI plus pipeline yang berjalan sebagai satu pemanggilan. Lobster adalah bagian yang hilang: pipeline deterministik, persetujuan eksplisit, dan state yang dapat dilanjutkan kembali.

## Mengapa

Saat ini, workflow yang kompleks memerlukan banyak pemanggilan alat bolak-balik. Setiap pemanggilan memakan token, dan LLM harus mengorkestrasi setiap langkah. Lobster memindahkan orkestrasi itu ke runtime bertipe:

- **Satu pemanggilan, bukan banyak**: OpenClaw menjalankan satu pemanggilan alat Lobster dan mendapatkan hasil terstruktur.
- **Persetujuan bawaan**: Efek samping (kirim email, posting komentar) menghentikan workflow sampai disetujui secara eksplisit.
- **Dapat dilanjutkan kembali**: Workflow yang terhenti mengembalikan token; setujui dan lanjutkan tanpa menjalankan ulang semuanya.

## Mengapa DSL alih-alih program biasa?

Lobster sengaja dibuat kecil. Tujuannya bukan "bahasa baru", melainkan spesifikasi pipeline yang dapat diprediksi dan ramah AI, dengan persetujuan kelas satu dan token lanjutkan.

- **Approve/resume sudah bawaan**: Program biasa dapat meminta input manusia, tetapi tidak dapat _pause dan resume_ dengan token yang tahan lama tanpa Anda membuat runtime itu sendiri.
- **Determinisme + dapat diaudit**: Pipeline adalah data, sehingga mudah dicatat, di-diff, diulang, dan direview.
- **Permukaan terbatas untuk AI**: Tata bahasa kecil + piping JSON mengurangi jalur kode “kreatif” dan membuat validasi menjadi realistis.
- **Kebijakan keamanan sudah baked in**: Timeout, batas output, pemeriksaan sandbox, dan allowlist ditegakkan oleh runtime, bukan oleh setiap skrip.
- **Tetap dapat diprogram**: Setiap langkah dapat memanggil CLI atau skrip apa pun. Jika Anda ingin JS/TS, hasilkan file `.lobster` dari kode.

## Cara kerjanya

OpenClaw menjalankan workflow Lobster **in-process** menggunakan runner tersemat. Tidak ada subprocess CLI eksternal yang di-spawn; engine workflow dieksekusi di dalam proses gateway dan mengembalikan envelope JSON secara langsung.
Jika pipeline pause untuk persetujuan, alat mengembalikan `resumeToken` sehingga Anda dapat melanjutkan nanti.

## Pola: CLI kecil + pipe JSON + persetujuan

Bangun perintah kecil yang berbicara JSON, lalu rangkai menjadi satu pemanggilan Lobster. (Nama perintah contoh di bawah — ganti dengan milik Anda sendiri.)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

Jika pipeline meminta persetujuan, lanjutkan dengan token:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI memicu workflow; Lobster mengeksekusi langkah-langkahnya. Gate persetujuan menjaga efek samping tetap eksplisit dan dapat diaudit.

Contoh: petakan item input menjadi pemanggilan alat:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Langkah LLM khusus JSON (`llm-task`)

Untuk workflow yang memerlukan **langkah LLM terstruktur**, aktifkan alat Plugin opsional
`llm-task` dan panggil dari Lobster. Ini menjaga workflow tetap
deterministik sambil tetap memungkinkan Anda melakukan klasifikasi/ringkasan/draf dengan model.

Aktifkan alatnya:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

Gunakan dalam pipeline:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

Lihat [LLM Task](/id/tools/llm-task) untuk detail dan opsi konfigurasi.

## File workflow (.lobster)

Lobster dapat menjalankan file workflow YAML/JSON dengan field `name`, `args`, `steps`, `env`, `condition`, dan `approval`. Dalam pemanggilan alat OpenClaw, tetapkan `pipeline` ke path file.

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

Catatan:

- `stdin: $step.stdout` dan `stdin: $step.json` meneruskan output langkah sebelumnya.
- `condition` (atau `when`) dapat menjadi gate langkah berdasarkan `$step.approved`.

## Instal Lobster

Workflow Lobster bawaan berjalan in-process; tidak diperlukan biner `lobster` terpisah. Runner tersemat dikirim bersama Plugin Lobster.

Jika Anda memerlukan CLI Lobster mandiri untuk pengembangan atau pipeline eksternal, instal dari [repo Lobster](https://github.com/openclaw/lobster) dan pastikan `lobster` ada di `PATH`.

## Aktifkan alat

Lobster adalah alat Plugin **opsional** (tidak diaktifkan secara default).

Disarankan (aditif, aman):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

Atau per agen:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

Hindari menggunakan `tools.allow: ["lobster"]` kecuali Anda memang berniat menjalankan mode allowlist yang ketat.

Catatan: allowlist bersifat opt-in untuk Plugin opsional. Jika allowlist Anda hanya menyebut
alat Plugin (seperti `lobster`), OpenClaw tetap mengaktifkan alat inti. Untuk membatasi alat inti,
sertakan juga alat inti atau grup yang Anda inginkan di allowlist.

## Contoh: triase email

Tanpa Lobster:

```
User: "Check my email and draft replies"
→ openclaw memanggil gmail.list
→ LLM merangkum
→ User: "draft replies to #2 and #5"
→ LLM membuat draf
→ User: "send #2"
→ openclaw memanggil gmail.send
(berulang setiap hari, tanpa memori tentang apa yang sudah ditriase)
```

Dengan Lobster:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

Mengembalikan envelope JSON (dipotong):

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

Pengguna menyetujui → lanjutkan:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Satu workflow. Deterministik. Aman.

## Parameter alat

### `run`

Jalankan pipeline dalam mode alat.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Jalankan file workflow dengan argumen:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Lanjutkan workflow yang terhenti setelah persetujuan.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Input opsional

- `cwd`: Direktori kerja relatif untuk pipeline (harus tetap berada dalam direktori kerja gateway).
- `timeoutMs`: Batalkan workflow jika melebihi durasi ini (default: 20000).
- `maxStdoutBytes`: Batalkan workflow jika output melebihi ukuran ini (default: 512000).
- `argsJson`: string JSON yang diteruskan ke `lobster run --args-json` (khusus file workflow).

## Envelope output

Lobster mengembalikan envelope JSON dengan salah satu dari tiga status:

- `ok` → selesai dengan sukses
- `needs_approval` → pause; `requiresApproval.resumeToken` diperlukan untuk melanjutkan
- `cancelled` → ditolak atau dibatalkan secara eksplisit

Alat menampilkan envelope di `content` (JSON yang dirapikan) dan `details` (objek mentah).

## Persetujuan

Jika `requiresApproval` ada, periksa prompt dan tentukan:

- `approve: true` → lanjutkan dan teruskan efek samping
- `approve: false` → batalkan dan selesaikan workflow

Gunakan `approve --preview-from-stdin --limit N` untuk melampirkan pratinjau JSON ke permintaan persetujuan tanpa glue jq/heredoc kustom. Resume token sekarang ringkas: Lobster menyimpan state lanjutkan workflow di bawah direktori state-nya dan mengembalikan kunci token kecil.

## OpenProse

OpenProse cocok dipasangkan dengan Lobster: gunakan `/prose` untuk mengorkestrasi persiapan multi-agen, lalu jalankan pipeline Lobster untuk persetujuan yang deterministik. Jika program Prose memerlukan Lobster, izinkan alat `lobster` untuk subagen melalui `tools.subagents.tools`. Lihat [OpenProse](/id/prose).

## Keamanan

- **Hanya lokal dan in-process** — workflow dieksekusi di dalam proses gateway; tidak ada pemanggilan jaringan dari Plugin itu sendiri.
- **Tanpa secret** — Lobster tidak mengelola OAuth; Lobster memanggil alat OpenClaw yang melakukannya.
- **Sadar sandbox** — dinonaktifkan saat konteks alat berada dalam sandbox.
- **Diperkeras** — timeout dan batas output ditegakkan oleh runner tersemat.

## Pemecahan masalah

- **`lobster timed out`** → tingkatkan `timeoutMs`, atau pecah pipeline yang panjang.
- **`lobster output exceeded maxStdoutBytes`** → naikkan `maxStdoutBytes` atau kurangi ukuran output.
- **`lobster returned invalid JSON`** → pastikan pipeline berjalan dalam mode alat dan hanya mencetak JSON.
- **`lobster failed`** → periksa log gateway untuk detail error runner tersemat.

## Pelajari lebih lanjut

- [Plugin](/id/tools/plugin)
- [Authoring alat Plugin](/id/plugins/building-plugins#registering-agent-tools)

## Studi kasus: workflow komunitas

Satu contoh publik: CLI “otak kedua” + pipeline Lobster yang mengelola tiga vault Markdown (pribadi, pasangan, bersama). CLI tersebut mengeluarkan JSON untuk statistik, daftar inbox, dan stale scan; Lobster merangkai perintah-perintah itu menjadi workflow seperti `weekly-review`, `inbox-triage`, `memory-consolidation`, dan `shared-task-sync`, masing-masing dengan gate persetujuan. AI menangani penilaian (kategorisasi) saat tersedia dan kembali ke aturan deterministik saat tidak tersedia.

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Terkait

- [Automation & Tasks](/id/automation) — menjadwalkan workflow Lobster
- [Ikhtisar Automation](/id/automation) — semua mekanisme otomasi
- [Ikhtisar alat](/id/tools) — semua alat agen yang tersedia
