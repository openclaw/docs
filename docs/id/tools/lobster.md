---
read_when:
    - Anda menginginkan alur kerja multilangkah yang deterministik dengan persetujuan eksplisit
    - Anda perlu melanjutkan alur kerja tanpa menjalankan ulang langkah-langkah sebelumnya
summary: Runtime alur kerja bertipe untuk OpenClaw dengan gerbang persetujuan yang dapat dilanjutkan kembali.
title: Lobster
x-i18n:
    generated_at: "2026-05-07T13:26:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 859cc29bd5b91d30e9f91a5b00a06d0fcf6f80d501aaaa7a7e266a4240573927
    source_path: tools/lobster.md
    workflow: 16
---

Lobster adalah shell alur kerja yang memungkinkan OpenClaw menjalankan rangkaian alat multi-langkah sebagai satu operasi deterministik dengan checkpoint persetujuan eksplisit.

Lobster adalah satu lapisan penulisan di atas pekerjaan latar belakang terlepas. Untuk orkestrasi alur di atas tugas individual, lihat [Task Flow](/id/automation/taskflow) (`openclaw tasks flow`). Untuk ledger aktivitas tugas, lihat [`openclaw tasks`](/id/automation/tasks).

## Hook

Asisten Anda dapat membangun alat yang mengelola dirinya sendiri. Minta sebuah alur kerja, dan 30 menit kemudian Anda memiliki CLI plus pipeline yang berjalan sebagai satu panggilan. Lobster adalah bagian yang hilang: pipeline deterministik, persetujuan eksplisit, dan status yang dapat dilanjutkan.

## Mengapa

Saat ini, alur kerja kompleks memerlukan banyak panggilan alat bolak-balik. Setiap panggilan menggunakan token, dan LLM harus mengorkestrasi setiap langkah. Lobster memindahkan orkestrasi itu ke runtime bertipe:

- **Satu panggilan, bukan banyak**: OpenClaw menjalankan satu panggilan alat Lobster dan mendapatkan hasil terstruktur.
- **Persetujuan bawaan**: Efek samping (mengirim email, memposting komentar) menghentikan alur kerja sampai disetujui secara eksplisit.
- **Dapat dilanjutkan**: Alur kerja yang dihentikan mengembalikan token; setujui dan lanjutkan tanpa menjalankan ulang semuanya.

## Mengapa DSL, bukan program biasa?

Lobster sengaja dibuat kecil. Tujuannya bukan "bahasa baru", melainkan spesifikasi pipeline yang dapat diprediksi dan ramah AI dengan persetujuan kelas utama dan token lanjutan.

- **Setujui/lanjutkan adalah bawaan**: Program normal dapat meminta input manusia, tetapi tidak dapat _menjeda dan melanjutkan_ dengan token tahan lama tanpa Anda menciptakan runtime itu sendiri.
- **Determinisme + auditabilitas**: Pipeline adalah data, sehingga mudah dicatat, dibandingkan, diputar ulang, dan ditinjau.
- **Permukaan terbatas untuk AI**: Tata bahasa kecil + piping JSON mengurangi jalur kode "kreatif" dan membuat validasi realistis.
- **Kebijakan keamanan tertanam**: Timeout, batas keluaran, pemeriksaan sandbox, dan allowlist diberlakukan oleh runtime, bukan oleh setiap skrip.
- **Tetap dapat diprogram**: Setiap langkah dapat memanggil CLI atau skrip apa pun. Jika Anda menginginkan JS/TS, hasilkan file `.lobster` dari kode.

## Cara kerjanya

OpenClaw menjalankan alur kerja Lobster **di dalam proses** menggunakan runner tertanam. Tidak ada subproses CLI eksternal yang dibuat; mesin alur kerja dieksekusi di dalam proses gateway dan mengembalikan envelope JSON secara langsung.
Jika pipeline berhenti untuk persetujuan, alat mengembalikan `resumeToken` sehingga Anda dapat melanjutkan nanti.

## Pola: CLI kecil + pipe JSON + persetujuan

Buat perintah kecil yang berbicara JSON, lalu rangkai menjadi satu panggilan Lobster. (Nama perintah contoh di bawah - ganti dengan milik Anda sendiri.)

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

AI memicu alur kerja; Lobster mengeksekusi langkah-langkahnya. Gate persetujuan menjaga efek samping tetap eksplisit dan dapat diaudit.

Contoh: petakan item input menjadi panggilan alat:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Langkah LLM khusus JSON (llm-task)

Untuk alur kerja yang memerlukan **langkah LLM terstruktur**, aktifkan alat Plugin opsional
`llm-task` dan panggil dari Lobster. Ini menjaga alur kerja tetap
deterministik sekaligus tetap memungkinkan Anda mengklasifikasi/meringkas/menyusun draf dengan model.

Aktifkan alat:

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

### Batasan penting: Lobster tertanam vs `openclaw.invoke`

Plugin Lobster bawaan menjalankan alur kerja **di dalam proses** di dalam gateway. Dalam mode tertanam itu, `openclaw.invoke` **tidak** secara otomatis mewarisi URL gateway/konteks autentikasi untuk panggilan alat CLI OpenClaw bersarang.

Artinya pola ini **saat ini tidak andal di runner tertanam**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Gunakan contoh di bawah hanya saat menjalankan **CLI Lobster mandiri** di lingkungan tempat `openclaw.invoke` sudah dikonfigurasi dengan konteks gateway/autentikasi yang benar.

Gunakan dalam pipeline CLI Lobster mandiri:

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

Jika Anda menggunakan Plugin Lobster tertanam saat ini, sebaiknya gunakan salah satu dari berikut:

- panggilan alat `llm-task` langsung di luar Lobster, atau
- langkah non-`openclaw.invoke` di dalam pipeline Lobster sampai bridge tertanam yang didukung ditambahkan.

Lihat [Tugas LLM](/id/tools/llm-task) untuk detail dan opsi konfigurasi.

## File alur kerja (.lobster)

Lobster dapat menjalankan file alur kerja YAML/JSON dengan field `name`, `args`, `steps`, `env`, `condition`, dan `approval`. Dalam panggilan alat OpenClaw, setel `pipeline` ke path file.

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

- `stdin: $step.stdout` dan `stdin: $step.json` meneruskan keluaran langkah sebelumnya.
- `condition` (atau `when`) dapat membatasi langkah berdasarkan `$step.approved`.

## Instal Lobster

Alur kerja Lobster bawaan berjalan di dalam proses; tidak diperlukan binary `lobster` terpisah. Runner tertanam dikirim bersama Plugin Lobster.

Jika Anda memerlukan CLI Lobster mandiri untuk pengembangan atau pipeline eksternal, instal dari [repo Lobster](https://github.com/openclaw/lobster) dan pastikan `lobster` ada di `PATH`.

## Aktifkan alat

Lobster adalah alat Plugin **opsional** (tidak diaktifkan secara default).

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

Hindari menggunakan `tools.allow: ["lobster"]` kecuali Anda bermaksud berjalan dalam mode allowlist terbatas.

<Note>
Allowlist bersifat opt-in untuk Plugin opsional. `alsoAllow` hanya mengaktifkan alat Plugin opsional yang disebutkan sambil mempertahankan set alat inti normal. Untuk membatasi alat inti, gunakan `tools.allow` dengan alat atau grup inti yang Anda inginkan.
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

Satu alur kerja. Deterministik. Aman.

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

Jalankan file alur kerja dengan argumen:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Lanjutkan alur kerja yang dihentikan setelah persetujuan.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Input opsional

- `cwd`: Direktori kerja relatif untuk pipeline (harus tetap berada dalam direktori kerja gateway).
- `timeoutMs`: Batalkan alur kerja jika melebihi durasi ini (default: 20000).
- `maxStdoutBytes`: Batalkan alur kerja jika keluaran melebihi ukuran ini (default: 512000).
- `argsJson`: String JSON yang diteruskan ke `lobster run --args-json` (hanya file alur kerja).

## Envelope keluaran

Lobster mengembalikan envelope JSON dengan salah satu dari tiga status:

- `ok` → selesai dengan sukses
- `needs_approval` → dijeda; `requiresApproval.resumeToken` diperlukan untuk melanjutkan
- `cancelled` → ditolak atau dibatalkan secara eksplisit

Alat menampilkan envelope di `content` (JSON rapi) dan `details` (objek mentah).

## Persetujuan

Jika `requiresApproval` ada, periksa prompt dan putuskan:

- `approve: true` → lanjutkan dan teruskan efek samping
- `approve: false` → batalkan dan finalisasi alur kerja

Gunakan `approve --preview-from-stdin --limit N` untuk melampirkan pratinjau JSON ke permintaan persetujuan tanpa perekat jq/heredoc khusus. Token lanjutan kini ringkas: Lobster menyimpan status lanjutan alur kerja di bawah direktori statusnya dan mengembalikan kunci token kecil.

## OpenProse

OpenProse cocok dipasangkan dengan Lobster: gunakan `/prose` untuk mengorkestrasi persiapan multi-agen, lalu jalankan pipeline Lobster untuk persetujuan deterministik. Jika program Prose membutuhkan Lobster, izinkan alat `lobster` untuk sub-agen melalui `tools.subagents.tools`. Lihat [OpenProse](/id/prose).

## Keamanan

- **Hanya lokal di dalam proses** - alur kerja dieksekusi di dalam proses gateway; tidak ada panggilan jaringan dari Plugin itu sendiri.
- **Tanpa rahasia** - Lobster tidak mengelola OAuth; ia memanggil alat OpenClaw yang melakukannya.
- **Sadar sandbox** - dinonaktifkan saat konteks alat berada dalam sandbox.
- **Diperkeras** - timeout dan batas keluaran diberlakukan oleh runner tertanam.

## Pemecahan masalah

- **`lobster timed out`** → naikkan `timeoutMs`, atau pecah pipeline panjang.
- **`lobster output exceeded maxStdoutBytes`** → naikkan `maxStdoutBytes` atau kurangi ukuran keluaran.
- **`lobster returned invalid JSON`** → pastikan pipeline berjalan dalam mode alat dan hanya mencetak JSON.
- **`lobster failed`** → periksa log gateway untuk detail error runner tertanam.

## Pelajari selengkapnya

- [Plugin](/id/tools/plugin)
- [Penulisan alat Plugin](/id/plugins/building-plugins#registering-agent-tools)

## Studi kasus: alur kerja komunitas

Satu contoh publik: CLI "second brain" + pipeline Lobster yang mengelola tiga vault Markdown (pribadi, pasangan, bersama). CLI mengeluarkan JSON untuk statistik, daftar inbox, dan pemindaian usang; Lobster merangkai perintah tersebut menjadi alur kerja seperti `weekly-review`, `inbox-triage`, `memory-consolidation`, dan `shared-task-sync`, masing-masing dengan gate persetujuan. AI menangani penilaian (kategorisasi) saat tersedia dan kembali ke aturan deterministik saat tidak tersedia.

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Terkait

- [Automasi & Tugas](/id/automation) - menjadwalkan alur kerja Lobster
- [Gambaran Umum Automasi](/id/automation) - semua mekanisme automasi
- [Gambaran Umum Alat](/id/tools) - semua alat agen yang tersedia
