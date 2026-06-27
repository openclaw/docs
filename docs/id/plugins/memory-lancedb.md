---
read_when:
    - Anda sedang mengonfigurasi plugin memory-lancedb
    - Anda menginginkan memori jangka panjang berbasis LanceDB dengan auto-recall atau auto-capture
    - Anda menggunakan embedding lokal yang kompatibel dengan OpenAI seperti Ollama
sidebarTitle: Memory LanceDB
summary: Konfigurasikan Plugin memori eksternal resmi LanceDB, termasuk embedding lokal yang kompatibel dengan Ollama
title: Memori LanceDB
x-i18n:
    generated_at: "2026-06-27T17:49:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4142a755e788418a8b9c64a6ff3a8ce3c520bd6be09b685929478ae0754f7d39
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` adalah Plugin memori eksternal resmi yang menyimpan memori jangka panjang di
LanceDB dan menggunakan embedding untuk pemanggilan kembali. Plugin ini dapat secara otomatis memanggil kembali
memori yang relevan sebelum giliran model dan menangkap fakta penting setelah respons.

Gunakan saat Anda menginginkan basis data vektor lokal untuk memori, membutuhkan
endpoint embedding yang kompatibel dengan OpenAI, atau ingin menyimpan basis data memori di luar
penyimpanan memori bawaan default.

## Instalasi

Instal `memory-lancedb` sebelum mengatur `plugins.slots.memory = "memory-lancedb"`:

```bash
openclaw plugins install @openclaw/memory-lancedb
```

Plugin ini dipublikasikan ke npm dan tidak dibundel ke dalam image runtime OpenClaw.
Installer menulis entri Plugin dan mengganti slot memori saat tidak ada Plugin lain yang
memilikinya.

<Note>
`memory-lancedb` adalah Plugin Active Memory. Aktifkan dengan memilih slot memori
dengan `plugins.slots.memory = "memory-lancedb"`. Plugin pendamping seperti
`memory-wiki` dapat berjalan di sampingnya, tetapi hanya satu Plugin yang memiliki slot memori aktif.
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

Mulai ulang Gateway setelah mengubah konfigurasi Plugin:

```bash
openclaw gateway restart
```

Lalu verifikasi bahwa Plugin sudah dimuat:

```bash
openclaw plugins list
```

## Embedding yang didukung penyedia

`memory-lancedb` dapat menggunakan adapter penyedia embedding memori yang sama seperti
`memory-core`. Atur `embedding.provider` dan hilangkan `embedding.apiKey` untuk menggunakan
profil autentikasi yang dikonfigurasi milik penyedia, variabel lingkungan, atau
`models.providers.<provider>.apiKey`.

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
        },
      },
    },
  },
}
```

Jalur ini bekerja dengan profil autentikasi penyedia yang mengekspos kredensial embedding.
Misalnya, GitHub Copilot dapat digunakan saat profil/paket Copilot mendukung
embedding:

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
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

OpenAI Codex / ChatGPT OAuth bukan kredensial embedding OpenAI Platform.
Untuk embedding OpenAI, gunakan profil autentikasi kunci API OpenAI,
`OPENAI_API_KEY`, atau `models.providers.openai.apiKey`. Pengguna khusus OAuth dapat menggunakan
penyedia lain yang mendukung embedding seperti GitHub Copilot atau Ollama.

## Embedding Ollama

Untuk embedding Ollama, lebih baik gunakan penyedia embedding Ollama yang dibundel. Penyedia ini menggunakan
endpoint Ollama `/api/embed` native dan mengikuti aturan autentikasi/base URL yang sama seperti
penyedia Ollama yang didokumentasikan di [Ollama](/id/providers/ollama).

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

Atur `dimensions` untuk model embedding non-standar. OpenClaw mengetahui
dimensi untuk `text-embedding-3-small` dan `text-embedding-3-large`; model kustom
memerlukan nilai tersebut dalam konfigurasi agar LanceDB dapat membuat kolom vektor.

Untuk model embedding lokal kecil, turunkan `recallMaxChars` jika Anda melihat error
panjang konteks dari server lokal.

## Penyedia yang kompatibel dengan OpenAI

Sebagian penyedia embedding yang kompatibel dengan OpenAI menolak parameter
`encoding_format`, sementara yang lain mengabaikannya dan selalu mengembalikan vektor `number[]`.
Karena itu, `memory-lancedb` menghilangkan `encoding_format` pada permintaan embedding dan
menerima respons array float atau respons float32 yang dikodekan base64.

Jika Anda memiliki endpoint embedding mentah yang kompatibel dengan OpenAI yang tidak memiliki
adapter penyedia yang dibundel, hilangkan `embedding.provider` (atau biarkan sebagai `openai`) dan
atur `embedding.apiKey` plus `embedding.baseUrl`. Ini mempertahankan jalur klien langsung
yang kompatibel dengan OpenAI.

Atur `embedding.dimensions` untuk penyedia yang dimensi modelnya tidak tersedia secara bawaan.
Misalnya, ZhiPu `embedding-3` menggunakan dimensi `2048`:

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

## Batas pemanggilan kembali dan penangkapan

`memory-lancedb` memiliki dua batas teks terpisah:

| Pengaturan        | Default | Rentang   | Berlaku untuk                                             |
| ----------------- | ------- | --------- | --------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000 | teks yang dikirim ke API embedding untuk pemanggilan kembali |
| `captureMaxChars` | `500`   | 100-10000 | panjang pesan yang memenuhi syarat untuk penangkapan otomatis |
| `customTriggers`  | `[]`    | 0-50      | frasa literal yang membuat penangkapan otomatis mempertimbangkan sebuah pesan |

`recallMaxChars` mengontrol pemanggilan kembali otomatis, alat `memory_recall`, jalur kueri
`memory_forget`, dan `openclaw ltm search`. Pemanggilan kembali otomatis lebih memilih
pesan pengguna terbaru dari giliran tersebut dan hanya kembali ke prompt lengkap saat tidak ada
pesan pengguna yang tersedia. Ini menjaga metadata channel dan blok prompt besar
tetap di luar permintaan embedding.

`captureMaxChars` mengontrol apakah respons cukup pendek untuk dipertimbangkan
bagi penangkapan otomatis. Ini tidak membatasi embedding kueri pemanggilan kembali.

`customTriggers` memungkinkan Anda menambahkan frasa penangkapan otomatis literal tanpa menulis
ekspresi reguler. Pemicu bawaan mencakup frasa memori umum dalam bahasa Inggris,
Ceko, Mandarin, Jepang, dan Korea.

## Perintah

Saat `memory-lancedb` adalah Plugin Active Memory yang aktif, ia mendaftarkan namespace CLI
`ltm`:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

Subperintah `query` menjalankan kueri non-vektor terhadap tabel LanceDB
secara langsung:

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: daftar kolom yang diizinkan dan dipisahkan koma (default ke `id`, `text`, `importance`, `category`, `createdAt`).
- `--filter <condition>`: klausa WHERE bergaya SQL; dibatasi hingga 200 karakter dan dibatasi pada alfanumerik, operator perbandingan, tanda kutip, tanda kurung, serta sekumpulan kecil tanda baca yang aman.
- `--limit <n>`: bilangan bulat positif; default `10`.
- `--order-by <column>:<asc|desc>`: pengurutan dalam memori yang diterapkan setelah filter; kolom pengurutan otomatis disertakan dalam proyeksi.

Agen juga mendapatkan alat memori LanceDB dari Plugin Active Memory:

- `memory_recall` untuk pemanggilan memori yang didukung LanceDB
- `memory_store` untuk menyimpan fakta, preferensi, keputusan, dan entitas penting
- `memory_forget` untuk menghapus memori yang cocok

## Penyimpanan

Secara default, data LanceDB berada di bawah `~/.openclaw/memory/lancedb`. Timpa
jalur dengan `dbPath`:

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

`storageOptions` menerima pasangan kunci/nilai string untuk backend penyimpanan LanceDB dan
mendukung ekspansi `${ENV_VAR}`:

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

## Dependensi runtime

`memory-lancedb` bergantung pada paket native `@lancedb/lancedb`. OpenClaw yang dikemas
memperlakukan paket tersebut sebagai bagian dari paket Plugin. Startup Gateway
tidak memperbaiki dependensi Plugin; jika dependensi hilang, instal ulang atau
perbarui paket Plugin dan mulai ulang Gateway.

Jika instalasi lama mencatat error `dist/package.json` yang hilang atau
`@lancedb/lancedb` yang hilang selama pemuatan Plugin, tingkatkan OpenClaw dan mulai ulang
Gateway.

Jika Plugin mencatat bahwa LanceDB tidak tersedia di `darwin-x64`, gunakan backend
memori default di mesin tersebut, pindahkan Gateway ke platform yang didukung, atau
nonaktifkan `memory-lancedb`.

## Pemecahan masalah

### Panjang input melebihi panjang konteks

Ini biasanya berarti model embedding menolak kueri pemanggilan memori:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

Tetapkan `recallMaxChars` yang lebih rendah, lalu mulai ulang Gateway:

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

Untuk Ollama, verifikasi juga bahwa server embedding dapat dijangkau dari host Gateway:

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Model embedding tidak didukung

Tanpa `dimensions`, hanya dimensi embedding OpenAI bawaan yang diketahui.
Untuk model embedding lokal atau kustom, tetapkan `embedding.dimensions` ke ukuran
vektor yang dilaporkan oleh model tersebut.

### Plugin dimuat tetapi tidak ada memori yang muncul

Periksa bahwa `plugins.slots.memory` mengarah ke `memory-lancedb`, lalu jalankan:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Jika `autoCapture` dinonaktifkan, Plugin akan memanggil memori yang ada tetapi
tidak akan menyimpan memori baru secara otomatis. Gunakan alat `memory_store` atau aktifkan
`autoCapture` jika Anda menginginkan penangkapan otomatis.

## Terkait

- [Ikhtisar memori](/id/concepts/memory)
- [Active Memory](/id/concepts/active-memory)
- [Pencarian memori](/id/concepts/memory-search)
- [Wiki Memori](/id/plugins/memory-wiki)
- [Ollama](/id/providers/ollama)
