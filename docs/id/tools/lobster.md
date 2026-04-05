---
read_when:
    - Anda menginginkan alur kerja multi-langkah yang deterministik dengan persetujuan eksplisit
    - Anda perlu melanjutkan alur kerja tanpa menjalankan ulang langkah-langkah sebelumnya
summary: Runtime alur kerja bertipe untuk OpenClaw dengan gerbang persetujuan yang dapat dilanjutkan.
title: Lobster
x-i18n:
    generated_at: "2026-04-05T14:08:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82718c15d571406ad6f1507de22a528fdab873edfc6aafae10742e500f6a5eda
    source_path: tools/lobster.md
    workflow: 15
---

# Lobster

Lobster adalah shell alur kerja yang memungkinkan OpenClaw menjalankan urutan tool multi-langkah sebagai satu operasi deterministik dengan checkpoint persetujuan yang eksplisit.

Lobster adalah satu lapisan authoring di atas pekerjaan latar belakang yang terlepas. Untuk orkestrasi alur di atas tugas individual, lihat [Task Flow](/id/automation/taskflow) (`openclaw tasks flow`). Untuk ledger aktivitas tugas, lihat [`openclaw tasks`](/id/automation/tasks).

## Hook

Asisten Anda dapat membangun tool yang mengelola dirinya sendiri. Minta sebuah alur kerja, dan 30 menit kemudian Anda sudah memiliki CLI plus pipeline yang berjalan sebagai satu panggilan. Lobster adalah bagian yang hilang: pipeline deterministik, persetujuan eksplisit, dan status yang dapat dilanjutkan.

## Mengapa

Saat ini, alur kerja kompleks memerlukan banyak panggilan tool bolak-balik. Setiap panggilan memakan token, dan LLM harus mengorkestrasi setiap langkah. Lobster memindahkan orkestrasi itu ke runtime bertipe:

- **Satu panggilan alih-alih banyak**: OpenClaw menjalankan satu panggilan tool Lobster dan mendapatkan hasil terstruktur.
- **Persetujuan sudah bawaan**: Efek samping (mengirim email, memposting komentar) menghentikan alur kerja sampai disetujui secara eksplisit.
- **Dapat dilanjutkan**: Alur kerja yang dihentikan mengembalikan token; setujui dan lanjutkan tanpa menjalankan ulang semuanya.

## Mengapa DSL, bukan program biasa?

Lobster sengaja dibuat kecil. Tujuannya bukan "bahasa baru", melainkan spesifikasi pipeline yang dapat diprediksi dan ramah AI dengan persetujuan kelas satu dan token pelanjutan.

- **Setujui/lanjutkan sudah bawaan**: Program biasa dapat meminta input manusia, tetapi tidak dapat _berhenti dan melanjutkan_ dengan token tahan lama tanpa Anda menciptakan runtime itu sendiri.
- **Determinisme + auditabilitas**: Pipeline adalah data, sehingga mudah dicatat, dibandingkan diff-nya, diputar ulang, dan ditinjau.
- **Permukaan terbatas untuk AI**: Tata bahasa kecil + piping JSON mengurangi jalur kode “kreatif” dan membuat validasi menjadi realistis.
- **Kebijakan keamanan tertanam**: Timeout, batas output, pemeriksaan sandbox, dan allowlist ditegakkan oleh runtime, bukan oleh tiap skrip.
- **Tetap dapat diprogram**: Setiap langkah dapat memanggil CLI atau skrip apa pun. Jika Anda menginginkan JS/TS, hasilkan file `.lobster` dari kode.

## Cara kerjanya

OpenClaw meluncurkan CLI `lobster` lokal dalam **tool mode** dan mem-parsing envelope JSON dari stdout.
Jika pipeline dijeda untuk persetujuan, tool mengembalikan `resumeToken` sehingga Anda dapat melanjutkannya nanti.

## Pola: CLI kecil + pipe JSON + persetujuan

Buat perintah kecil yang berbicara JSON, lalu rangkai menjadi satu panggilan Lobster. (Nama perintah contoh di bawah — ganti dengan milik Anda sendiri.)

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

AI memicu alur kerja; Lobster mengeksekusi langkah-langkahnya. Gerbang persetujuan menjaga efek samping tetap eksplisit dan dapat diaudit.

Contoh: petakan item input ke dalam panggilan tool:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Langkah LLM JSON-saja (llm-task)

Untuk alur kerja yang membutuhkan **langkah LLM terstruktur**, aktifkan tool plugin opsional
`llm-task` dan panggil dari Lobster. Ini menjaga alur kerja tetap
deterministik sambil tetap memungkinkan Anda melakukan klasifikasi/ringkasan/draf dengan model.

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

Lihat [LLM Task](/tools/llm-task) untuk detail dan opsi konfigurasi.

## File alur kerja (.lobster)

Lobster dapat menjalankan file alur kerja YAML/JSON dengan field `name`, `args`, `steps`, `env`, `condition`, dan `approval`. Dalam panggilan tool OpenClaw, setel `pipeline` ke path file tersebut.

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
- `condition` (atau `when`) dapat mengendalikan langkah berdasarkan `$step.approved`.

## Instal Lobster

Instal CLI Lobster pada **host yang sama** yang menjalankan Gateway OpenClaw (lihat [repo Lobster](https://github.com/openclaw/lobster)), dan pastikan `lobster` ada di `PATH`.

## Aktifkan tool

Lobster adalah tool plugin **opsional** (tidak aktif secara default).

Rekomendasi (aditif, aman):

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

Catatan: allowlist bersifat opt-in untuk plugin opsional. Jika allowlist Anda hanya menyebut
tool plugin (seperti `lobster`), OpenClaw tetap membiarkan tool inti aktif. Untuk membatasi tool inti,
sertakan juga tool atau grup inti yang Anda inginkan dalam allowlist.

## Contoh: Triase email

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

Mengembalikan envelope JSON (terpotong):

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

## Parameter tool

### `run`

Jalankan pipeline dalam tool mode.

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

- `cwd`: Working directory relatif untuk pipeline (harus tetap berada di dalam working directory proses saat ini).
- `timeoutMs`: Bunuh subprocess jika melebihi durasi ini (default: 20000).
- `maxStdoutBytes`: Bunuh subprocess jika stdout melebihi ukuran ini (default: 512000).
- `argsJson`: String JSON yang diteruskan ke `lobster run --args-json` (khusus file alur kerja).

## Envelope output

Lobster mengembalikan envelope JSON dengan salah satu dari tiga status:

- `ok` → selesai dengan sukses
- `needs_approval` → dijeda; `requiresApproval.resumeToken` diperlukan untuk melanjutkan
- `cancelled` → ditolak atau dibatalkan secara eksplisit

Tool ini menampilkan envelope tersebut di `content` (JSON yang dirapikan) dan `details` (objek mentah).

## Persetujuan

Jika `requiresApproval` ada, periksa prompt lalu putuskan:

- `approve: true` → lanjutkan dan teruskan efek samping
- `approve: false` → batalkan dan finalisasi alur kerja

Gunakan `approve --preview-from-stdin --limit N` untuk melampirkan pratinjau JSON ke permintaan persetujuan tanpa glue `jq`/heredoc kustom. Resume token kini ringkas: Lobster menyimpan status pelanjutan alur kerja di state dir-nya dan mengembalikan token key kecil.

## OpenProse

OpenProse cocok dipasangkan dengan Lobster: gunakan `/prose` untuk mengorkestrasi persiapan multi-agen, lalu jalankan pipeline Lobster untuk persetujuan yang deterministik. Jika program Prose memerlukan Lobster, izinkan tool `lobster` untuk sub-agen melalui `tools.subagents.tools`. Lihat [OpenProse](/id/prose).

## Keamanan

- **Hanya subprocess lokal** — tidak ada panggilan jaringan dari plugin itu sendiri.
- **Tanpa rahasia** — Lobster tidak mengelola OAuth; ia memanggil tool OpenClaw yang mengelolanya.
- **Sadar sandbox** — dinonaktifkan ketika konteks tool berada dalam sandbox.
- **Dikeraskan** — nama executable tetap (`lobster`) di `PATH`; timeout dan batas output ditegakkan.

## Pemecahan masalah

- **`lobster subprocess timed out`** → tingkatkan `timeoutMs`, atau pecah pipeline yang panjang.
- **`lobster output exceeded maxStdoutBytes`** → naikkan `maxStdoutBytes` atau kurangi ukuran output.
- **`lobster returned invalid JSON`** → pastikan pipeline berjalan dalam tool mode dan hanya mencetak JSON.
- **`lobster failed (code …)`** → jalankan pipeline yang sama di terminal untuk memeriksa stderr.

## Pelajari lebih lanjut

- [Plugins](/tools/plugin)
- [Penulisan tool plugin](/id/plugins/building-plugins#registering-agent-tools)

## Studi kasus: alur kerja komunitas

Salah satu contoh publik: CLI “second brain” + pipeline Lobster yang mengelola tiga vault Markdown (pribadi, pasangan, bersama). CLI tersebut menghasilkan JSON untuk statistik, daftar inbox, dan pemindaian item usang; Lobster merangkai perintah-perintah itu menjadi alur kerja seperti `weekly-review`, `inbox-triage`, `memory-consolidation`, dan `shared-task-sync`, masing-masing dengan gerbang persetujuan. AI menangani penilaian (kategorisasi) saat tersedia dan fallback ke aturan deterministik saat tidak tersedia.

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Terkait

- [Otomatisasi & Tugas](/id/automation) — penjadwalan alur kerja Lobster
- [Ikhtisar Otomatisasi](/id/automation) — semua mekanisme otomatisasi
- [Ikhtisar Tool](/tools) — semua tool agen yang tersedia
