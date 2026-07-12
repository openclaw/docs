---
read_when:
    - Anda menginginkan alur kerja bertahap yang deterministik dengan persetujuan eksplisit
    - Anda perlu melanjutkan alur kerja tanpa menjalankan ulang langkah-langkah sebelumnya
summary: Runtime alur kerja bertipe untuk OpenClaw dengan gerbang persetujuan yang dapat dilanjutkan.
title: Lobster
x-i18n:
    generated_at: "2026-07-12T14:42:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eedb6577133588b726992a882a92d94f1f414e55998d0fc80644dd3a64ffc1ab
    source_path: tools/lobster.md
    workflow: 16
---

Lobster menjalankan pipeline alat multi-langkah sebagai satu panggilan alat yang deterministik, dengan
titik pemeriksaan persetujuan eksplisit dan token pelanjutan. Lobster berada satu lapisan di atas
pekerjaan latar belakang terpisah: untuk mengatur alur di banyak tugas terpisah,
lihat [Task Flow](/id/automation/taskflow) (`openclaw tasks flow`); untuk buku besar
aktivitas tugas, lihat [Tugas Latar Belakang](/id/automation/tasks).

## Mengapa

Tanpa Lobster, pekerjaan multi-langkah memerlukan banyak panggilan alat bolak-balik, dengan
model yang mengatur setiap langkah. Lobster memindahkan pengaturan tersebut ke runtime
bertipe:

- **Satu panggilan, bukan banyak panggilan**: satu panggilan alat Lobster mengembalikan hasil
  terstruktur untuk seluruh pipeline.
- **Persetujuan terintegrasi**: efek samping (mengirim, memposting, menghapus) menghentikan alur kerja
  hingga disetujui secara eksplisit.
- **Dapat dilanjutkan**: alur kerja yang dihentikan mengembalikan token; setujui dan lanjutkan tanpa
  menjalankan ulang langkah sebelumnya.

Lobster adalah DSL kecil dan terbatas, bukan bahasa skrip serbaguna:
persetujuan/pelanjutan merupakan primitif bawaan yang tahan lama; pipeline adalah data (mudah
dicatat, dibandingkan, diputar ulang, dan ditinjau); tata bahasa yang ringkas membatasi jalur kode "kreatif" sehingga
validasi tetap realistis; batas waktu, batas keluaran, pemeriksaan sandbox, dan
daftar izin diberlakukan oleh runtime, bukan oleh setiap skrip. Setiap langkah tetap dapat
memanggil CLI atau skrip apa pun—hasilkan berkas `.lobster` dari alat lain jika Anda
menginginkan bahasa penulisan yang lebih kaya.

Tanpa Lobster, triase email berulang terlihat seperti:

```text
Pengguna: "Periksa email saya dan buat draf balasan"
→ openclaw memanggil gmail.list
→ LLM merangkum
→ Pengguna: "buat draf balasan untuk #2 dan #5"
→ LLM membuat draf
→ Pengguna: "kirim #2"
→ openclaw memanggil gmail.send
(diulang setiap hari, tanpa ingatan tentang apa yang telah ditriase)
```

Dengan Lobster, pekerjaan yang sama menjadi satu panggilan yang berhenti untuk meminta persetujuan dan kemudian dilanjutkan:

```json
{ "action": "run", "pipeline": "email.triage --limit 20", "timeoutMs": 30000 }
```

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 perlu dibalas, 2 perlu ditindaklanjuti" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Kirim 2 draf balasan?",
    "items": [],
    "resumeToken": "..."
  }
}
```

## Cara kerjanya

OpenClaw menjalankan alur kerja Lobster **dalam proses** menggunakan paket bawaan
`@clawdbot/lobster` sebagai pengeksekusi tersemat. Tidak ada subproses `lobster`
eksternal yang dibuat; panggilan alat langsung mengembalikan amplop JSON. Jika
pipeline berhenti untuk meminta persetujuan, amplop tersebut membawa token pelanjutan (atau ID
persetujuan singkat) agar Anda dapat melanjutkannya nanti.

## Mengaktifkan

Lobster adalah alat Plugin **opsional** yang tidak diaktifkan secara default. Alat ini disertakan
sebagai bawaan, jadi tidak diperlukan langkah instalasi terpisah—cukup izinkan alat tersebut:

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

<Note>
`alsoAllow` menambahkan `lobster` di atas profil alat aktif tanpa
membatasi alat inti lainnya. Gunakan `tools.allow` hanya jika Anda menginginkan mode
daftar izin yang membatasi.
</Note>

Alat ini dinonaktifkan sepenuhnya untuk konteks alat yang berada dalam sandbox.

Jika Anda memerlukan CLI Lobster mandiri untuk pengembangan atau pipeline eksternal
(di luar pengeksekusi Gateway tersemat), instal dari
[repositori Lobster](https://github.com/openclaw/lobster) dan tempatkan `lobster` di
`PATH`.

## Pola: CLI kecil + pipa JSON + persetujuan

Buat perintah kecil yang berkomunikasi dengan JSON, lalu rangkai menjadi satu panggilan Lobster.
(Nama perintah contoh di bawah—ganti dengan nama Anda sendiri.)

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

Contoh: petakan item masukan ke panggilan alat:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Langkah LLM khusus JSON (llm-task)

Untuk **langkah LLM terstruktur** di dalam alur kerja, aktifkan alat Plugin opsional
`llm-task` dan panggil dari Lobster:

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

### Batasan penting: Lobster tersemat dibandingkan dengan `openclaw.invoke`

Plugin Lobster bawaan menjalankan alur kerja **dalam proses** di dalam Gateway.
Dalam mode tersemat tersebut, `openclaw.invoke` **tidak** secara otomatis mewarisi
konteks URL/autentikasi Gateway untuk panggilan alat CLI OpenClaw bertingkat.

Artinya, pola ini **saat ini tidak andal dalam pengeksekusi tersemat**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Gunakan contoh di bawah hanya saat menjalankan **CLI Lobster mandiri** dalam
lingkungan tempat `openclaw.invoke` telah dikonfigurasi dengan konteks
Gateway/autentikasi yang benar.

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Berdasarkan email masukan, kembalikan maksud dan draf.",
  "thinking": "low",
  "input": { "subject": "Halo", "body": "Bisakah Anda membantu?" },
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

Jika saat ini Anda menggunakan Plugin Lobster tersemat, sebaiknya gunakan salah satu dari:

- panggilan alat `llm-task` langsung di luar Lobster, atau
- langkah non-`openclaw.invoke` di dalam pipeline Lobster hingga jembatan
  tersemat yang didukung ditambahkan.

Lihat [Tugas LLM](/id/tools/llm-task) untuk detail dan opsi konfigurasi.

## Berkas alur kerja (.lobster)

Lobster dapat menjalankan berkas alur kerja YAML/JSON dengan kolom `name`, `args`, `steps`, `env`,
`condition`, dan `approval`. Tetapkan `pipeline` ke jalur berkas dalam panggilan
alat.

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

## Parameter alat

### `run`

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Jalankan berkas alur kerja dengan argumen:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

| Kolom            | Default     | Catatan                                                                                                        |
| ---------------- | ----------- | -------------------------------------------------------------------------------------------------------------- |
| `pipeline`       | wajib       | String pipeline sebaris, atau jalur yang berakhiran `.lobster`/`.yaml`/`.yml`/`.json` untuk berkas alur kerja. |
| `cwd`            | cwd Gateway | Direktori kerja relatif; harus diselesaikan di dalam direktori kerja Gateway (jalur absolut ditolak).          |
| `timeoutMs`      | `20000`     | Membatalkan proses jika batas ini terlampaui.                                                                  |
| `maxStdoutBytes` | `512000`    | Membatalkan proses jika stdout atau stderr yang ditangkap melebihi ukuran ini.                                 |
| `argsJson`       | -           | String argumen JSON untuk berkas alur kerja (diabaikan untuk pipeline sebaris).                                |

### `resume`

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

`resume` menerima `token` (token pelanjutan lengkap dari `requiresApproval`)
atau `approvalId` (ID singkat dari objek yang sama)—gunakan nilai yang dikembalikan oleh
proses yang dihentikan. `approve` wajib diisi.

### Mode Task Flow terkelola

Meneruskan `flowControllerId` dan `flowGoal` pada `run` (atau `flowId` dan
`flowExpectedRevision` pada `resume`) mengarahkan panggilan melalui API
[Task Flow](/id/automation/taskflow) terkelola milik runtime Plugin, alih-alih mengembalikan
amplop polos: OpenClaw membuat atau melanjutkan catatan alur yang tahan lama, menerapkan
amplop Lobster padanya (`waiting` saat menunggu persetujuan, `succeeded`/`failed` saat
selesai), dan mengembalikan `{ ok, envelope, flow, mutation }`. Mode ini memerlukan
runtime Task Flow yang terikat dan ditujukan bagi kode Plugin/pengontrol yang memerlukan
status alur tahan lama setelah Gateway dimulai ulang, bukan untuk penggunaan agen ad hoc biasa.

## Amplop keluaran

Lobster mengembalikan amplop JSON dengan salah satu dari tiga status:

- `ok`—selesai dengan sukses
- `needs_approval`—dijeda; `requiresApproval` membawa `resumeToken` dan
  `approvalId` singkat, yang masing-masing dapat melanjutkan proses
- `cancelled`—ditolak atau dibatalkan secara eksplisit

Alat menyediakan amplop dalam `content` (JSON yang diformat rapi) dan `details`
(objek mentah).

## Persetujuan

Jika `requiresApproval` tersedia, periksa perintahnya dan putuskan:

- `approve: true`—lanjutkan dan teruskan efek samping
- `approve: false`—batalkan dan selesaikan alur kerja

Gunakan `approve --preview-from-stdin --limit N` untuk melampirkan pratinjau JSON ke
permintaan persetujuan tanpa perekat jq/heredoc khusus. Status pelanjutan disimpan sebagai
berkas JSON kecil di bawah direktori status Lobster (`~/.lobster/state` secara
default, timpa dengan `LOBSTER_STATE_DIR`); token itu sendiri hanya mengodekan
penunjuk ke status tersebut, bukan status pipeline lengkap.

## OpenProse

OpenProse cocok dipasangkan dengan Lobster: gunakan `/prose` untuk mengatur persiapan
multiagen, lalu jalankan pipeline Lobster untuk persetujuan deterministik. Jika program
Prose memerlukan Lobster, izinkan alat `lobster` bagi subagen melalui
`tools.subagents.tools`. Lihat [OpenProse](/id/prose).

## Keamanan

- **Hanya dalam proses lokal**—alur kerja dijalankan di dalam proses Gateway; Plugin itu sendiri
  tidak melakukan panggilan jaringan.
- **Tanpa rahasia**—Lobster tidak mengelola OAuth; Lobster memanggil alat OpenClaw yang
  melakukannya.
- **Sadar sandbox**—dinonaktifkan ketika konteks alat berada dalam sandbox.
- **Diperkuat**—batas waktu dan batas keluaran diberlakukan oleh pengeksekusi tersemat.

## Pemecahan masalah

| Kesalahan                                                     | Penyebab/perbaikan                                                                     |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `lobster runtime timed out`                                   | Pipeline melampaui `timeoutMs`. Tingkatkan nilainya atau pecah pipeline.               |
| `lobster stdout exceeded maxStdoutBytes` (atau `stderr`)      | Keluaran yang ditangkap melebihi batas. Naikkan `maxStdoutBytes` atau kurangi keluaran. |
| `run --args-json must be valid JSON`                          | `argsJson` (proses berkas alur kerja) gagal diurai. Perbaiki string JSON.               |
| `lobster runtime failed` (atau pesan `runtime_error` lainnya) | Runtime tersemat mengembalikan amplop kesalahan. Periksa log Gateway untuk detailnya.   |

## Pelajari lebih lanjut

- [Plugin](/id/tools/plugin)
- [Penulisan alat Plugin](/id/plugins/building-plugins#registering-agent-tools)

## Studi kasus: alur kerja komunitas

Satu contoh publik: CLI "otak kedua" + pipeline Lobster yang mengelola tiga
vault Markdown (pribadi, pasangan, bersama). CLI menghasilkan JSON untuk statistik,
daftar kotak masuk, dan pemindaian data usang; Lobster merangkai perintah tersebut menjadi alur kerja
seperti `weekly-review`, `inbox-triage`, `memory-consolidation`, dan
`shared-task-sync`, masing-masing dengan gerbang persetujuan. AI menangani penilaian
(kategorisasi) jika tersedia dan beralih ke aturan deterministik jika
tidak tersedia.

- Utas: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repositori: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Terkait

- [Otomatisasi](/id/automation) - semua mekanisme otomatisasi
- [Ikhtisar Alat](/id/tools) - semua alat agen yang tersedia
