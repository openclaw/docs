---
read_when:
    - Anda menginginkan alur kerja multi-langkah yang deterministik dengan persetujuan eksplisit
    - Anda perlu melanjutkan alur kerja tanpa menjalankan ulang langkah-langkah sebelumnya
summary: Runtime alur kerja bertipe untuk OpenClaw dengan gerbang persetujuan yang dapat dilanjutkan.
title: Lobster
x-i18n:
    generated_at: "2026-05-06T09:30:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6da8c7ca213dd4e9f85bcedabdb74da172bd3d82eceaf2c001f1a2692b01ca8
    source_path: tools/lobster.md
    workflow: 16
---

Lobster adalah shell workflow yang memungkinkan OpenClaw menjalankan urutan tool multi-langkah sebagai satu operasi deterministik dengan checkpoint persetujuan eksplisit.

Lobster adalah satu lapisan authoring di atas pekerjaan latar belakang yang dilepas. Untuk orkestrasi alur di atas tugas individual, lihat [Alur Tugas](/id/automation/taskflow) (`openclaw tasks flow`). Untuk ledger aktivitas tugas, lihat [`openclaw tasks`](/id/automation/tasks).

## Hook

Asisten Anda dapat membangun tool yang mengelola dirinya sendiri. Minta sebuah workflow, dan 30 menit kemudian Anda memiliki CLI plus pipeline yang berjalan sebagai satu panggilan. Lobster adalah bagian yang hilang: pipeline deterministik, persetujuan eksplisit, dan status yang dapat dilanjutkan.

## Mengapa

Saat ini, workflow kompleks memerlukan banyak panggilan tool bolak-balik. Setiap panggilan memakan token, dan LLM harus mengorkestrasi setiap langkah. Lobster memindahkan orkestrasi itu ke runtime bertipe:

- **Satu panggilan, bukan banyak**: OpenClaw menjalankan satu panggilan tool Lobster dan mendapatkan hasil terstruktur.
- **Persetujuan bawaan**: Efek samping (mengirim email, memposting komentar) menghentikan workflow sampai disetujui secara eksplisit.
- **Dapat dilanjutkan**: Workflow yang dihentikan mengembalikan token; setujui dan lanjutkan tanpa menjalankan ulang semuanya.

## Mengapa DSL, bukan program biasa?

Lobster sengaja dibuat kecil. Tujuannya bukan "bahasa baru," melainkan spesifikasi pipeline yang dapat diprediksi dan ramah AI, dengan persetujuan kelas utama dan token pelanjutan.

- **Setuju/lanjutkan sudah bawaan**: Program normal dapat meminta manusia, tetapi tidak dapat _menjeda dan melanjutkan_ dengan token tahan lama tanpa Anda menciptakan runtime itu sendiri.
- **Determinisme + auditabilitas**: Pipeline adalah data, jadi mudah dicatat, dibandingkan, diputar ulang, dan ditinjau.
- **Permukaan terbatas untuk AI**: Tata bahasa kecil + pemipaan JSON mengurangi jalur kode "kreatif" dan membuat validasi realistis.
- **Kebijakan keamanan tertanam**: Timeout, batas output, pemeriksaan sandbox, dan allowlist ditegakkan oleh runtime, bukan oleh masing-masing skrip.
- **Tetap dapat diprogram**: Setiap langkah dapat memanggil CLI atau skrip apa pun. Jika Anda menginginkan JS/TS, hasilkan file `.lobster` dari kode.

## Cara kerjanya

OpenClaw menjalankan workflow Lobster **dalam proses** menggunakan runner tertanam. Tidak ada subproses CLI eksternal yang dijalankan; mesin workflow dieksekusi di dalam proses gateway dan mengembalikan amplop JSON secara langsung.
Jika pipeline berhenti untuk persetujuan, tool mengembalikan `resumeToken` agar Anda dapat melanjutkannya nanti.

## Pola: CLI kecil + pipe JSON + persetujuan

Bangun perintah kecil yang berbicara JSON, lalu rantai menjadi satu panggilan Lobster. (Nama perintah contoh di bawah - ganti dengan milik Anda sendiri.)

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

AI memicu workflow; Lobster mengeksekusi langkah-langkahnya. Gerbang persetujuan menjaga efek samping tetap eksplisit dan dapat diaudit.

Contoh: petakan item input menjadi panggilan tool:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Langkah LLM khusus JSON (llm-task)

Untuk workflow yang membutuhkan **langkah LLM terstruktur**, aktifkan tool plugin opsional
`llm-task` dan panggil dari Lobster. Ini menjaga workflow tetap
deterministik sambil tetap memungkinkan Anda mengklasifikasikan/meringkas/menyusun draf dengan model.

Aktifkan tool:

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
        "tools": { "alsoAllow": ["llm-task"] }
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

Lihat [Tugas LLM](/id/tools/llm-task) untuk detail dan opsi konfigurasi.

## File workflow (.lobster)

Lobster dapat menjalankan file workflow YAML/JSON dengan field `name`, `args`, `steps`, `env`, `condition`, dan `approval`. Dalam panggilan tool OpenClaw, atur `pipeline` ke path file.

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
- `condition` (atau `when`) dapat membatasi langkah berdasarkan `$step.approved`.

## Instal Lobster

Workflow Lobster bawaan berjalan dalam proses; tidak diperlukan biner `lobster` terpisah. Runner tertanam dikirim bersama plugin Lobster.

Jika Anda membutuhkan CLI Lobster mandiri untuk pengembangan atau pipeline eksternal, instal dari [repo Lobster](https://github.com/openclaw/lobster) dan pastikan `lobster` ada di `PATH`.

## Aktifkan tool

Lobster adalah tool plugin **opsional** (tidak diaktifkan secara default).

Direkomendasikan (aditif, aman):

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

Hindari penggunaan `tools.allow: ["lobster"]` kecuali Anda berniat berjalan dalam mode allowlist restriktif.

<Note>
Allowlist bersifat opt-in untuk plugin opsional. `alsoAllow` hanya mengaktifkan tool plugin opsional yang disebutkan sambil mempertahankan set tool inti normal. Untuk membatasi tool inti, gunakan `tools.allow` dengan tool atau grup inti yang Anda inginkan.
</Note>

## Contoh: Triage email

Tanpa Lobster:

```
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

Dengan Lobster:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

Mengembalikan amplop JSON (dipotong):

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

## Parameter tool

### `run`

Jalankan pipeline dalam mode tool.

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

Lanjutkan workflow yang dihentikan setelah persetujuan.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Input opsional

- `cwd`: Direktori kerja relatif untuk pipeline (harus tetap berada di dalam direktori kerja gateway).
- `timeoutMs`: Batalkan workflow jika melebihi durasi ini (default: 20000).
- `maxStdoutBytes`: Batalkan workflow jika output melebihi ukuran ini (default: 512000).
- `argsJson`: String JSON yang diteruskan ke `lobster run --args-json` (hanya file workflow).

## Amplop output

Lobster mengembalikan amplop JSON dengan salah satu dari tiga status:

- `ok` → selesai dengan sukses
- `needs_approval` → dijeda; `requiresApproval.resumeToken` diperlukan untuk melanjutkan
- `cancelled` → ditolak atau dibatalkan secara eksplisit

Tool menampilkan amplop di `content` (JSON rapi) dan `details` (objek mentah).

## Persetujuan

Jika `requiresApproval` ada, periksa prompt dan putuskan:

- `approve: true` → lanjutkan dan teruskan efek samping
- `approve: false` → batalkan dan finalisasi workflow

Gunakan `approve --preview-from-stdin --limit N` untuk melampirkan pratinjau JSON ke permintaan persetujuan tanpa lem jq/heredoc khusus. Token pelanjutan kini ringkas: Lobster menyimpan status pelanjutan workflow di bawah direktori statusnya dan mengembalikan kunci token kecil.

## OpenProse

OpenProse cocok dipasangkan dengan Lobster: gunakan `/prose` untuk mengorkestrasi persiapan multi-agen, lalu jalankan pipeline Lobster untuk persetujuan deterministik. Jika program Prose membutuhkan Lobster, izinkan tool `lobster` untuk sub-agen melalui `tools.subagents.tools`. Lihat [OpenProse](/id/prose).

## Keamanan

- **Hanya lokal dalam proses** - workflow dieksekusi di dalam proses gateway; tidak ada panggilan jaringan dari plugin itu sendiri.
- **Tanpa rahasia** - Lobster tidak mengelola OAuth; ia memanggil tool OpenClaw yang melakukannya.
- **Sadar sandbox** - dinonaktifkan ketika konteks tool berada dalam sandbox.
- **Diperkuat** - timeout dan batas output ditegakkan oleh runner tertanam.

## Pemecahan masalah

- **`lobster timed out`** → tingkatkan `timeoutMs`, atau pecah pipeline panjang.
- **`lobster output exceeded maxStdoutBytes`** → naikkan `maxStdoutBytes` atau kurangi ukuran output.
- **`lobster returned invalid JSON`** → pastikan pipeline berjalan dalam mode tool dan hanya mencetak JSON.
- **`lobster failed`** → periksa log gateway untuk detail error runner tertanam.

## Pelajari lebih lanjut

- [Plugin](/id/tools/plugin)
- [Authoring tool plugin](/id/plugins/building-plugins#registering-agent-tools)

## Studi kasus: workflow komunitas

Satu contoh publik: CLI "second brain" + pipeline Lobster yang mengelola tiga vault Markdown (pribadi, pasangan, bersama). CLI memancarkan JSON untuk statistik, daftar inbox, dan pemindaian usang; Lobster merangkai perintah-perintah itu menjadi workflow seperti `weekly-review`, `inbox-triage`, `memory-consolidation`, dan `shared-task-sync`, masing-masing dengan gerbang persetujuan. AI menangani penilaian (kategorisasi) saat tersedia dan fallback ke aturan deterministik saat tidak.

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Terkait

- [Automasi & Tugas](/id/automation) - menjadwalkan workflow Lobster
- [Ikhtisar Automasi](/id/automation) - semua mekanisme automasi
- [Ikhtisar Tool](/id/tools) - semua tool agen yang tersedia
