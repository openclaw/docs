---
read_when:
    - Anda menginginkan alur kerja multilangkah yang deterministik dengan persetujuan eksplisit
    - Anda perlu melanjutkan alur kerja tanpa menjalankan ulang langkah-langkah sebelumnya
summary: Runtime alur kerja bertipe untuk OpenClaw dengan gerbang persetujuan yang dapat dilanjutkan.
title: Lobster
x-i18n:
    generated_at: "2026-07-19T05:14:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 85b7900f86bfedc9d73fcc91c3d0dac37b81f7413b1e68c54dd8a797b70f79fc
    source_path: tools/lobster.md
    workflow: 16
---

Lobster menjalankan pipeline alat multi-langkah sebagai satu pemanggilan alat deterministik, dengan
titik pemeriksaan persetujuan eksplisit dan token pelanjutan. Lobster berada satu lapisan di atas
pekerjaan latar belakang terpisah: untuk mengorkestrasi alur di banyak tugas terpisah,
lihat [Task Flow](/id/automation/taskflow) (`openclaw tasks flow`); untuk buku besar aktivitas
tugas, lihat [Tugas Latar Belakang](/id/automation/tasks).

## Mengapa

Tanpa Lobster, pekerjaan multi-langkah memerlukan banyak pemanggilan alat bolak-balik, dengan
model yang mengorkestrasi setiap langkah. Lobster memindahkan orkestrasi tersebut ke runtime
bertipe:

- **Satu pemanggilan, bukan banyak**: satu pemanggilan alat Lobster mengembalikan hasil
  terstruktur untuk seluruh pipeline.
- **Persetujuan bawaan**: efek samping (kirim, posting, hapus) menghentikan alur kerja
  hingga disetujui secara eksplisit.
- **Dapat dilanjutkan**: alur kerja yang dihentikan mengembalikan token; setujui dan lanjutkan tanpa
  menjalankan ulang langkah sebelumnya.

Lobster adalah DSL kecil dan terbatas, bukan bahasa skrip serbaguna:
persetujuan/pelanjutan merupakan primitif bawaan yang persisten; pipeline adalah data (mudah
dicatat, dibandingkan, diputar ulang, ditinjau); tata bahasa yang ringkas membatasi jalur kode "kreatif" agar
validasi tetap realistis; batas waktu, batas keluaran, pemeriksaan sandbox, dan
daftar izin diberlakukan oleh runtime, bukan oleh setiap skrip. Setiap langkah tetap dapat
memanggil CLI atau skrip apa pun - buat file `.lobster` dari alat lain jika Anda
menginginkan bahasa penulisan yang lebih lengkap.

Tanpa Lobster, triase email berulang terlihat seperti:

```text
Pengguna: "Periksa email saya dan buat draf balasan"
→ openclaw memanggil gmail.list
→ LLM meringkas
→ Pengguna: "buat draf balasan untuk #2 dan #5"
→ LLM membuat draf
→ Pengguna: "kirim #2"
→ openclaw memanggil gmail.send
(diulang setiap hari, tanpa ingatan tentang apa yang telah ditriase)
```

Dengan Lobster, pekerjaan yang sama menjadi satu pemanggilan yang berhenti untuk meminta persetujuan dan kemudian dilanjutkan:

```json
{ "action": "run", "pipeline": "email.triage --limit 20", "timeoutMs": 30000 }
```

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 memerlukan balasan, 2 memerlukan tindakan" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Kirim 2 draf balasan?",
    "items": [],
    "resumeToken": "..."
  }
}
```

## Cara kerjanya

OpenClaw menjalankan alur kerja Lobster **dalam proses** menggunakan paket
`@clawdbot/lobster` yang disertakan sebagai runner tertanam. Tidak ada subproses
`lobster` eksternal yang dijalankan; pemanggilan alat langsung mengembalikan amplop JSON. Jika
pipeline berhenti untuk meminta persetujuan, amplop tersebut membawa token pelanjutan (atau ID
persetujuan singkat) agar Anda dapat melanjutkannya nanti.

## Mengaktifkan

Lobster adalah alat Plugin **opsional** yang tidak diaktifkan secara default. Alat ini
disertakan, sehingga tidak diperlukan langkah instalasi terpisah - cukup izinkan alat tersebut:

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
daftar izin yang restriktif.
</Note>

Alat ini dinonaktifkan sepenuhnya untuk konteks alat yang di-sandbox.

Jika Anda memerlukan CLI Lobster mandiri untuk pengembangan atau pipeline eksternal
(di luar runner gateway tertanam), instal dari
[repositori Lobster](https://github.com/openclaw/lobster) dan tempatkan `lobster` pada
`PATH`.

## Pola: CLI kecil + pipe JSON + persetujuan

Buat perintah kecil yang berkomunikasi menggunakan JSON, lalu rangkai menjadi satu pemanggilan Lobster.
(Nama perintah contoh di bawah - ganti dengan nama Anda sendiri.)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Terapkan perubahan?'",
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

Contoh: petakan item masukan ke pemanggilan alat:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Langkah LLM khusus JSON (llm-task)

Untuk **langkah LLM terstruktur** di dalam alur kerja, aktifkan alat Plugin
`llm-task` opsional dan panggil dari Lobster:

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

Plugin Lobster yang disertakan menjalankan alur kerja **dalam proses** di dalam gateway.
Dalam mode tertanam tersebut, `openclaw.invoke` **tidak** secara otomatis mewarisi
konteks URL/autentikasi gateway untuk pemanggilan alat CLI OpenClaw bertingkat.

Artinya, pola ini **saat ini tidak andal dalam runner tertanam**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Gunakan contoh di bawah hanya saat menjalankan **CLI Lobster mandiri** dalam
lingkungan tempat `openclaw.invoke` telah dikonfigurasi dengan konteks
gateway/autentikasi yang benar.

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

Jika Anda menggunakan Plugin Lobster tertanam saat ini, pilih salah satu:

- pemanggilan alat `llm-task` langsung di luar Lobster, atau
- langkah non-`openclaw.invoke` di dalam pipeline Lobster hingga jembatan
  tertanam yang didukung ditambahkan.

Lihat [Tugas LLM](/id/tools/llm-task) untuk detail dan opsi konfigurasi.

## File alur kerja (.lobster)

Lobster dapat menjalankan file alur kerja YAML/JSON dengan bidang `name`, `args`, `steps`, `env`,
`condition`, dan `approval`. Atur `pipeline` ke jalur file dalam pemanggilan
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
- `condition` (atau `when`) dapat mengendalikan langkah berdasarkan `$step.approved`.

### Variabel lingkungan yang diinjeksi

Setiap shell langkah mewarisi lingkungan induk beserta variabel yang diinjeksi
Lobster berikut, sehingga perintah dapat merujuk argumen alur kerja yang telah diuraikan tanpa menyematkan
nilai mentah ke dalam string perintah:

- `LOBSTER_ARG_<NAME>` - satu untuk setiap argumen alur kerja. Namanya diubah menjadi huruf kapital dengan setiap
  rangkaian karakter nonalfanumerik diciutkan menjadi `_`, sehingga argumen `user-id` menjadi
  `LOBSTER_ARG_USER_ID`.
- `LOBSTER_ARGS_JSON` - semua argumen yang telah diuraikan sebagai satu string JSON.

Itulah seluruh kumpulan yang diinjeksi. **Tidak ada** variabel keluaran per langkah
seperti `LOBSTER_STEP_<id>_STDOUT` atau `LOBSTER_STEP_<id>_JSON_<field>`; shell
menganggap nama tersebut tidak disetel, sehingga nilai default ekspansi parameter dapat menyembunyikan kesalahan.
Baca keluaran langkah sebelumnya melalui referensi langkah - `$step.stdout`,
`$step.json`, atau `$step.json.<field>` - dalam nilai `stdin:`, `env:`, atau `condition:`.
(`LOBSTER_STATE_DIR` adalah pengaturan runtime terpisah untuk direktori
status, bukan argumen per eksekusi.)

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

Jalankan file alur kerja dengan argumen:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

| Bidang           | Default     | Catatan                                                                                                      |
| ---------------- | ----------- | ------------------------------------------------------------------------------------------------------------ |
| `pipeline`       | wajib       | String pipeline sebaris, atau jalur yang berakhiran `.lobster`/`.yaml`/`.yml`/`.json` untuk file alur kerja. |
| `cwd`            | cwd gateway | Direktori kerja relatif; harus diuraikan di dalam direktori kerja gateway (jalur absolut ditolak).            |
| `timeoutMs`      | `20000`     | Membatalkan eksekusi jika terlampaui.                                                                         |
| `maxStdoutBytes` | `512000`    | Membatalkan eksekusi jika stdout atau stderr yang ditangkap melebihi ukuran ini.                               |
| `argsJson`       | -           | String JSON berisi argumen untuk file alur kerja (diabaikan untuk pipeline sebaris).                           |

### `resume`

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

`resume` menerima `token` (token pelanjutan lengkap dari `requiresApproval`)
atau `approvalId` (ID singkat dari objek yang sama) - gunakan nilai yang dikembalikan oleh eksekusi
yang dihentikan. `approve` wajib diisi.

### Mode Task Flow terkelola

Meneruskan `flowControllerId` dan `flowGoal` pada `run` (atau `flowId` dan
`flowExpectedRevision` pada `resume`) mengarahkan pemanggilan melalui API
[Task Flow](/id/automation/taskflow) terkelola milik runtime Plugin, alih-alih mengembalikan
amplop biasa: OpenClaw membuat atau melanjutkan catatan alur persisten, menerapkan
amplop Lobster kepadanya (`waiting` saat persetujuan, `succeeded`/`failed` saat
selesai), dan mengembalikan `{ ok, envelope, flow, mutation }`. Mode ini memerlukan
runtime Task Flow yang terikat dan ditujukan untuk kode Plugin/pengontrol yang memerlukan
status alur persisten setelah gateway dimulai ulang, bukan untuk penggunaan agen ad hoc biasa.

## Amplop keluaran

Lobster mengembalikan amplop JSON dengan salah satu dari tiga status:

- `ok` - selesai dengan sukses
- `needs_approval` - dijeda; `requiresApproval` membawa `resumeToken` dan
  `approvalId` singkat, salah satunya dapat melanjutkan eksekusi
- `cancelled` - ditolak atau dibatalkan secara eksplisit

Alat menampilkan amplop dalam `content` (JSON yang diformat rapi) dan `details`
(objek mentah).

## Persetujuan

Jika `requiresApproval` tersedia, periksa perintahnya dan tentukan:

- `approve: true` - lanjutkan dan teruskan efek samping
- `approve: false` - batalkan dan selesaikan alur kerja

Gunakan `approve --preview-from-stdin --limit N` untuk melampirkan pratinjau JSON ke
permintaan persetujuan tanpa kode penghubung jq/heredoc khusus. Status pelanjutan disimpan sebagai
file JSON kecil di bawah direktori status Lobster (`~/.lobster/state` secara
default, ganti dengan `LOBSTER_STATE_DIR`); token itu sendiri hanya mengodekan
penunjuk ke status tersebut, bukan seluruh status pipeline.

## OpenProse

OpenProse cocok dipasangkan dengan Lobster: gunakan `/prose` untuk mengorkestrasi persiapan
multiagen, lalu jalankan pipeline Lobster untuk persetujuan deterministik. Jika program Prose
memerlukan Lobster, izinkan alat `lobster` untuk subagen melalui
`tools.subagents.tools`. Lihat [OpenProse](/id/prose).

## Keamanan

- **Hanya dalam proses lokal** - alur kerja dijalankan di dalam proses Gateway; tidak ada
  panggilan jaringan dari plugin itu sendiri.
- **Tanpa rahasia** - Lobster tidak mengelola OAuth; Lobster memanggil alat OpenClaw yang
  melakukannya.
- **Sadar sandbox** - dinonaktifkan saat konteks alat berada dalam sandbox.
- **Diperkuat** - batas waktu dan batas keluaran diberlakukan oleh runner tertanam.

## Pemecahan masalah

| Kesalahan                                                     | Penyebab / perbaikan                                                              |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `lobster runtime timed out`                                   | Pipeline melampaui `timeoutMs`. Tingkatkan nilainya atau pisahkan pipeline.      |
| `lobster stdout exceeded maxStdoutBytes` (atau `stderr`)        | Keluaran yang ditangkap melampaui batas. Tingkatkan `maxStdoutBytes` atau kurangi keluaran. |
| `run --args-json must be valid JSON`                          | `argsJson` (eksekusi berkas alur kerja) gagal diurai. Perbaiki string JSON.     |
| `lobster runtime failed` (atau pesan `runtime_error` lainnya) | Runtime tertanam mengembalikan amplop kesalahan. Periksa log Gateway untuk detail. |

## Pelajari lebih lanjut

- [Plugin](/id/tools/plugin)
- [Pembuatan alat Plugin](/id/plugins/building-plugins#registering-agent-tools)

## Studi kasus: alur kerja komunitas

Salah satu contoh publik: CLI "otak kedua" + pipeline Lobster yang mengelola tiga
vault Markdown (pribadi, pasangan, bersama). CLI menghasilkan JSON untuk statistik,
daftar kotak masuk, dan pemindaian item usang; Lobster merangkai perintah tersebut menjadi alur kerja
seperti `weekly-review`, `inbox-triage`, `memory-consolidation`, dan
`shared-task-sync`, masing-masing dengan gerbang persetujuan. AI menangani penilaian
(kategorisasi) jika tersedia dan beralih ke aturan deterministik jika
tidak tersedia.

- Utas: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repositori: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Terkait

- [Otomatisasi](/id/automation) - semua mekanisme otomatisasi
- [Ikhtisar Alat](/id/tools) - semua alat agen yang tersedia
