---
read_when:
    - Anda sedang mengonfigurasi plugin memory-lancedb
    - Anda menginginkan memori jangka panjang berbasis LanceDB dengan pemanggilan kembali otomatis atau perekaman otomatis
    - Anda menggunakan embedding lokal yang kompatibel dengan OpenAI seperti Ollama
sidebarTitle: Memory LanceDB
summary: Konfigurasikan plugin memori LanceDB eksternal resmi, termasuk embedding lokal yang kompatibel dengan Ollama
title: Memori LanceDB
x-i18n:
    generated_at: "2026-07-19T05:01:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 771b28b9775175f53d3e6543e66618a56dd40ef95598c00c7abf9b62fb261e47
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` adalah plugin eksternal resmi yang menyimpan memori jangka panjang di
LanceDB dengan pencarian vektor. Plugin ini dapat secara otomatis mengingat kembali memori yang relevan sebelum giliran
model dan secara otomatis menangkap fakta penting setelah respons.

Gunakan plugin ini untuk basis data vektor lokal, endpoint embedding yang kompatibel dengan OpenAI, atau
penyimpanan memori di luar backend memori bawaan default.

## Instalasi

```bash
openclaw plugins install @openclaw/memory-lancedb
```

Plugin ini dipublikasikan ke npm; plugin ini tidak dibundel dalam image runtime OpenClaw.
Menginstalnya akan menulis entri plugin, mengaktifkannya, dan mengalihkan
`plugins.slots.memory` ke `memory-lancedb`. Jika plugin lain saat ini memiliki
slot memori, plugin tersebut dinonaktifkan dengan peringatan.

<Note>
Plugin pendamping seperti `memory-wiki` dapat berjalan bersama `memory-lancedb`,
tetapi hanya satu plugin yang memiliki slot memori aktif pada satu waktu.
</Note>

<Note>
`memory_recall` milik LanceDB tidak menerima otorisasi transkrip privat terlindungi
yang digunakan oleh `memorySearch.rememberAcrossConversations`. Gunakan
`autoRecall` milik LanceDB atau alat `memory_recall`-nya melalui
[Active Memory lanjutan](/id/concepts/active-memory#lancedb-memory).
`openclaw doctor` melaporkan saat Remember across conversations tidak tersedia
dengan penyedia memori saat ini.
</Note>

## Mulai cepat

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "openai",
            model: "text-embedding-3-small",
          },
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

Mulai ulang Gateway setelah mengubah konfigurasi plugin, lalu verifikasi bahwa plugin telah dimuat:

```bash
openclaw gateway restart
openclaw plugins list
```

## Konfigurasi embedding

`embedding` wajib diisi dan harus menyertakan setidaknya satu bidang. `provider`
secara default adalah `openai`; `model` secara default adalah `text-embedding-3-small`.

| Bidang                 | Tipe          | Catatan                                                                  |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | string        | ID adaptor, misalnya `openai`, `github-copilot`, `ollama`. Default `openai`. |
| `embedding.model`      | string        | Default `text-embedding-3-small`.                                        |
| `embedding.apiKey`     | string        | Opsional; mendukung ekspansi `${ENV_VAR}`.                               |
| `embedding.baseUrl`    | string        | Opsional; mendukung ekspansi `${ENV_VAR}`.                               |
| `embedding.dimensions` | integer (>=1) | Wajib untuk model yang tidak ada dalam tabel bawaan (lihat di bawah).     |

Terdapat dua jalur permintaan:

- **Jalur adaptor penyedia** (default): tetapkan `embedding.provider` dan jangan sertakan
  `embedding.apiKey`/`embedding.baseUrl`. Plugin menyelesaikan profil autentikasi
  yang dikonfigurasi milik penyedia, variabel lingkungan, atau
  `models.providers.<provider>.apiKey` melalui adaptor embedding memori yang sama
  dengan yang digunakan `memory-core`. Ini adalah jalur untuk `github-copilot`, `ollama`,
  dan penyedia terbundel lainnya yang mendukung embedding.
- **Jalur klien langsung yang kompatibel dengan OpenAI**: biarkan `embedding.provider` tidak ditetapkan
  (atau `"openai"`) dan tetapkan `embedding.apiKey` serta `embedding.baseUrl`. Gunakan ini
  untuk endpoint embedding mentah yang kompatibel dengan OpenAI dan tidak memiliki adaptor
  penyedia terbundel.

OAuth OpenAI Codex / ChatGPT bukan kredensial embedding OpenAI Platform.
Untuk embedding OpenAI, gunakan profil autentikasi kunci API OpenAI, `OPENAI_API_KEY`, atau
`models.providers.openai.apiKey`. Pengguna yang hanya memiliki OAuth sebaiknya memilih penyedia lain
yang mendukung embedding, seperti `github-copilot` atau `ollama`.

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

Beberapa endpoint embedding yang kompatibel dengan OpenAI menolak parameter `encoding_format`;
yang lain mengabaikannya dan selalu mengembalikan `number[]`. `memory-lancedb`
tidak menyertakan `encoding_format` dalam permintaan dan menerima respons berupa array float atau
float32 yang dikodekan base64, sehingga kedua bentuk respons dapat digunakan tanpa konfigurasi.

### Dimensi

OpenClaw memiliki dimensi bawaan hanya untuk `text-embedding-3-small` (1536) dan
`text-embedding-3-large` (3072). Model lainnya memerlukan
`embedding.dimensions` eksplisit agar LanceDB dapat membuat kolom vektor, misalnya
ZhiPu `embedding-3` dengan 2048 dimensi:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            apiKey: "${ZHIPU_API_KEY}",
            baseUrl: "https://open.bigmodel.cn/api/paas/v4",
            model: "embedding-3",
            dimensions: 2048,
          },
        },
      },
    },
  },
}
```

## Embedding Ollama

Gunakan jalur adaptor penyedia Ollama terbundel (`embedding.provider: "ollama"`).
Jalur ini memanggil endpoint native `/api/embed` milik Ollama dan mengikuti aturan autentikasi/URL dasar
yang sama dengan penyedia [Ollama](/id/providers/ollama).

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "ollama",
            baseUrl: "http://127.0.0.1:11434",
            model: "mxbai-embed-large",
            dimensions: 1024,
          },
          recallMaxChars: 400,
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

`mxbai-embed-large` tidak ada dalam tabel dimensi bawaan, sehingga `dimensions`
wajib diisi. Untuk model embedding lokal berukuran kecil, turunkan `recallMaxChars` jika
server lokal mengembalikan galat panjang konteks.

## Batas pengingatan kembali dan penangkapan

| Pengaturan        | Default | Rentang                      | Berlaku untuk                                               |
| ----------------- | ------- | ---------------------------- | ----------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000                    | Teks yang dikirim ke API embedding untuk pengingatan kembali. |
| `captureMaxChars` | `500`   | 100-10000                    | Panjang pesan yang memenuhi syarat untuk penangkapan otomatis. |
| `customTriggers`  | `[]`    | 0-50 item, masing-masing <=100 karakter | Frasa literal yang membuat penangkapan otomatis mempertimbangkan suatu pesan. |

`recallMaxChars` membatasi kueri pengingatan kembali otomatis `before_prompt_build`,
alat `memory_recall`, jalur kueri `memory_forget`, dan `openclaw ltm
search`. Pengingatan kembali otomatis menyematkan pesan pengguna terbaru dari giliran tersebut dan beralih
ke prompt lengkap hanya ketika tidak ada pesan pengguna, sehingga metadata saluran
dan blok prompt besar tidak masuk dalam permintaan embedding.

`captureMaxChars` menentukan apakah pesan pengguna dari peristiwa `agent_end`
pada giliran tersebut cukup pendek untuk dipertimbangkan dalam penangkapan otomatis; pengaturan ini tidak memengaruhi
kueri pengingatan kembali.

`customTriggers` menambahkan frasa penangkapan otomatis literal tanpa regex. Pemicu bawaan
mencakup frasa memori umum dalam bahasa Inggris, Ceko, Tionghoa, Jepang, dan Korea
(`remember`, `prefer`, `记住`, `覚えて`, `기억해`, dan yang serupa).

Penangkapan otomatis juga menolak teks yang menyerupai metadata amplop/transportasi,
payload injeksi prompt, atau konteks `<relevant-memories>` yang sudah diinjeksi,
dan membatasi penangkapan hingga 3 memori per giliran agen.

Setiap memori dimiliki oleh satu agen. Pengingatan kembali, deteksi duplikat, penangkapan,
pencantuman, kueri mentah, dan penghapusan semuanya memberlakukan kepemilikan tersebut sebelum mengembalikan atau
mengubah baris. Agen dengan `memorySearch.enabled: false` (di `agents.list[]`
atau melalui `agents.defaults`) juga tidak mendapatkan alat `memory_recall`, `memory_store`,
atau `memory_forget` dan tidak berpartisipasi dalam pengingatan kembali atau
penangkapan otomatis, bahkan ketika flag `autoRecall`/`autoCapture` tingkat plugin aktif.

## Perintah

`memory-lancedb` mendaftarkan namespace CLI `ltm` setiap kali diinstal
(tidak hanya ketika memiliki slot memori aktif):

```bash
openclaw ltm list [--agent <id>] [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--agent <id>] [--limit <n>]
openclaw ltm stats [--agent <id>]
```

`ltm query` menjalankan kueri nonvektor secara langsung terhadap tabel LanceDB:

```bash
openclaw ltm query --agent research --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| Flag                              | Default                                 | Catatan                                                                                                                                   |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--agent <id>`                    | agen default yang dikonfigurasi          | Memilih namespace agen privat. Tersedia pada `list`, `search`, `query`, dan `stats`.                                                 |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | Daftar kolom yang diizinkan dan dipisahkan koma.                                                                                          |
| `--filter <condition>`            | tidak ada                               | Satu perbandingan terhadap kolom keluaran, seperti `category = 'preference'` atau `importance >= 0.8`. Nilai string harus diberi tanda kutip.             |
| `--limit <n>`                     | `10`                                    | Bilangan bulat positif.                                                                                                                    |
| `--order-by <column>:<asc\|desc>` | tidak ada                               | Diurutkan dalam memori setelah filter dijalankan; kolom pengurutan otomatis ditambahkan ke proyeksi dan dihapus dari keluaran jika tidak diminta. |

Agen mendapatkan tiga alat dari plugin memori aktif:

- `memory_recall`: pencarian vektor pada memori yang tersimpan.
- `memory_store`: menyimpan fakta, preferensi, keputusan, atau entitas (menolak teks
  yang menyerupai payload injeksi prompt; melewati penyimpanan yang hampir duplikat).
- `memory_forget`: menghapus berdasarkan `memoryId`, atau berdasarkan `query` (secara otomatis menghapus satu
  kecocokan dengan skor di atas 90%, atau mencantumkan ID kandidat untuk menghilangkan ambiguitas).

## Penyimpanan

Data LanceDB secara default disimpan di `~/.openclaw/memory/lancedb`. Ganti dengan `dbPath`:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "~/.openclaw/memory/lancedb",
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

Plugin mempertahankan satu tabel LanceDB dan menyimpan pemilik agen yang dinormalisasi pada setiap
baris. Ini adalah batas penyimpanan, bukan filter pascapencarian: kepemilikan agen
diterapkan sebelum pemeringkatan vektor dan disertakan dalam predikat pencantuman, kueri, penghitungan, serta penghapusan.
`ltm query --filter` menerima satu perbandingan tervalidasi terhadap
kolom keluaran publik. Penyimpanan membangun perbandingan tersebut secara terpisah dari
predikat pemilik wajib, sehingga filter tidak dapat memperluas kueri ke agen
lain.

Basis data yang dibuat sebelum adanya kepemilikan per agen tidak memiliki asal-usul baris yang dapat diandalkan.
Saat peningkatan versi, `openclaw doctor --fix` menetapkan baris lama tersebut satu kali kepada
agen default yang dikonfigurasi. Akses runtime gagal secara tertutup sampai migrasi tersebut
selesai; agen lain tidak pernah mewarisi baris bersama yang lama.

`storageOptions` menerima pasangan kunci/nilai string untuk backend penyimpanan LanceDB
(misalnya penyimpanan objek yang kompatibel dengan S3) dan mendukung ekspansi `${ENV_VAR}`:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "s3://memory-bucket/openclaw",
          storageOptions: {
            access_key: "${AWS_ACCESS_KEY_ID}",
            secret_key: "${AWS_SECRET_ACCESS_KEY}",
            endpoint: "${AWS_ENDPOINT_URL}",
          },
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

## Dependensi runtime dan dukungan platform

`memory-lancedb` bergantung pada paket native `@lancedb/lancedb`, yang dimiliki oleh
paket plugin (bukan distribusi inti OpenClaw). Proses awal Gateway tidak memperbaiki
dependensi plugin; jika dependensi native tidak ada atau gagal dimuat,
instal ulang atau perbarui paket plugin, lalu mulai ulang Gateway.

`@lancedb/lancedb` tidak menerbitkan build native untuk `darwin-x64` (Mac
Intel). Pada platform tersebut, plugin mencatat saat pemuatan bahwa LanceDB tidak
tersedia; gunakan backend memori default, jalankan Gateway pada
platform/arsitektur yang didukung, atau nonaktifkan `memory-lancedb`.

## Pemecahan masalah

### Panjang input melebihi panjang konteks

Model embedding menolak kueri pemanggilan kembali:

```text
memory-lancedb: pemanggilan kembali gagal: Error: 400 panjang input melebihi panjang konteks
```

Kurangi `recallMaxChars`, lalu mulai ulang Gateway:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        config: {
          recallMaxChars: 400,
        },
      },
    },
  },
}
```

Untuk Ollama, pastikan juga server embedding dapat dijangkau dari host Gateway
menggunakan endpoint embed native-nya:

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Model embedding tidak didukung

Tanpa `embedding.dimensions`, hanya dimensi embedding bawaan OpenAI yang
diketahui (`text-embedding-3-small`, `text-embedding-3-large`). Untuk model
lainnya, atur `embedding.dimensions` ke ukuran vektor yang dilaporkan model tersebut.

### Plugin dimuat tetapi tidak ada memori yang muncul

Pastikan `plugins.slots.memory` mengarah ke `memory-lancedb`, lalu jalankan:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Jika `autoCapture` dinonaktifkan, plugin tetap memanggil kembali memori yang ada tetapi
tidak menyimpan memori baru secara otomatis. Gunakan alat `memory_store`, atau aktifkan
`autoCapture`.

## Terkait

- [Ikhtisar memori](/id/concepts/memory)
- [Active Memory](/id/concepts/active-memory)
- [Pencarian memori](/id/concepts/memory-search)
- [Wiki Memori](/id/plugins/memory-wiki)
- [Ollama](/id/providers/ollama)
