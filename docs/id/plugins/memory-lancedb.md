---
read_when:
    - Anda sedang mengonfigurasi Plugin memory-lancedb bawaan
    - Anda menginginkan memori jangka panjang berbasis LanceDB dengan pemanggilan kembali otomatis atau penangkapan otomatis
    - Anda menggunakan embedding lokal yang kompatibel dengan OpenAI seperti Ollama
sidebarTitle: Memory LanceDB
summary: Konfigurasikan Plugin memori LanceDB bawaan, termasuk embedding lokal yang kompatibel dengan Ollama
title: Memori LanceDB
x-i18n:
    generated_at: "2026-05-02T09:28:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 671daa20e4f070f9beb0187ff76db9368297b3bc78873ebf3f09ac7ccffa00a2
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` adalah plugin memori bawaan yang menyimpan memori jangka panjang di
LanceDB dan menggunakan embedding untuk recall. Plugin ini dapat otomatis me-recall
memori yang relevan sebelum giliran model dan menangkap fakta penting setelah respons.

Gunakan saat Anda menginginkan basis data vektor lokal untuk memori, membutuhkan
endpoint embedding yang kompatibel dengan OpenAI, atau ingin menyimpan basis data memori di luar
penyimpanan memori bawaan default.

<Note>
`memory-lancedb` adalah plugin active memory. Aktifkan dengan memilih slot memori
dengan `plugins.slots.memory = "memory-lancedb"`. Plugin pendamping seperti
`memory-wiki` dapat berjalan di sampingnya, tetapi hanya satu plugin yang memiliki slot active memory.
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

Mulai ulang Gateway setelah mengubah konfigurasi plugin:

```bash
openclaw gateway restart
```

Lalu verifikasi bahwa plugin telah dimuat:

```bash
openclaw plugins list
```

## Embedding yang didukung penyedia

`memory-lancedb` dapat menggunakan adapter penyedia embedding memori yang sama seperti
`memory-core`. Atur `embedding.provider` dan hilangkan `embedding.apiKey` untuk menggunakan
profil autentikasi terkonfigurasi milik penyedia, variabel lingkungan, atau
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

Jalur ini berfungsi dengan profil autentikasi penyedia yang mengekspos kredensial embedding.
Misalnya, GitHub Copilot dapat digunakan ketika profil/paket Copilot mendukung
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

OpenAI Codex / ChatGPT OAuth (`openai-codex`) bukan kredensial embedding OpenAI Platform.
Untuk embedding OpenAI, gunakan profil autentikasi kunci API OpenAI,
`OPENAI_API_KEY`, atau `models.providers.openai.apiKey`. Pengguna yang hanya memakai OAuth dapat menggunakan
penyedia lain yang mendukung embedding seperti GitHub Copilot atau Ollama.

## Embedding Ollama

Untuk embedding Ollama, utamakan penyedia embedding Ollama bawaan. Penyedia ini menggunakan
endpoint Ollama native `/api/embed` dan mengikuti aturan autentikasi/base URL yang sama seperti
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
memerlukan nilai ini dalam konfigurasi agar LanceDB dapat membuat kolom vektor.

Untuk model embedding lokal kecil, turunkan `recallMaxChars` jika Anda melihat galat panjang
konteks dari server lokal.

## Penyedia yang kompatibel dengan OpenAI

Beberapa penyedia embedding yang kompatibel dengan OpenAI menolak parameter `encoding_format`,
sementara yang lain mengabaikannya dan selalu mengembalikan vektor `number[]`.
Karena itu, `memory-lancedb` menghilangkan `encoding_format` pada permintaan embedding dan
menerima respons array float maupun respons float32 berkode base64.

Jika Anda memiliki endpoint embedding mentah yang kompatibel dengan OpenAI yang tidak memiliki
adapter penyedia bawaan, hilangkan `embedding.provider` (atau biarkan sebagai `openai`) dan
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

## Batas recall dan capture

`memory-lancedb` memiliki dua batas teks terpisah:

| Pengaturan        | Default | Rentang   | Berlaku untuk                                |
| ----------------- | ------- | --------- | ------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000 | teks yang dikirim ke API embedding untuk recall |
| `captureMaxChars` | `500`   | 100-10000 | panjang pesan asisten yang layak untuk capture |

`recallMaxChars` mengontrol auto-recall, alat `memory_recall`, jalur kueri
`memory_forget`, dan `openclaw ltm search`. Auto-recall mengutamakan
pesan pengguna terbaru dari giliran tersebut dan hanya kembali ke prompt lengkap ketika tidak ada
pesan pengguna yang tersedia. Ini menjaga metadata channel dan blok prompt besar
agar tidak masuk ke permintaan embedding.

`captureMaxChars` mengontrol apakah sebuah respons cukup pendek untuk dipertimbangkan
bagi capture otomatis. Ini tidak membatasi embedding kueri recall.

## Perintah

Saat `memory-lancedb` menjadi plugin memori aktif, plugin ini mendaftarkan namespace CLI `ltm`:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

Plugin ini juga memperluas `openclaw memory` dengan subperintah `query` non-vektor
yang berjalan langsung terhadap tabel LanceDB:

```bash
openclaw memory query --cols id,text,createdAt --limit 20
openclaw memory query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: allowlist kolom yang dipisahkan koma (default ke `id`, `text`, `importance`, `category`, `createdAt`).
- `--filter <condition>`: klausa WHERE bergaya SQL; dibatasi hingga 200 karakter dan dibatasi ke alfanumerik, operator perbandingan, tanda kutip, tanda kurung, dan sekumpulan kecil tanda baca aman.
- `--limit <n>`: bilangan bulat positif; default `10`.
- `--order-by <column>:<asc|desc>`: pengurutan dalam memori yang diterapkan setelah filter; kolom pengurutan otomatis disertakan dalam proyeksi.

Agen juga mendapatkan alat memori LanceDB dari plugin memori aktif:

- `memory_recall` untuk recall yang didukung LanceDB
- `memory_store` untuk menyimpan fakta, preferensi, keputusan, dan entitas penting
- `memory_forget` untuk menghapus memori yang cocok

## Penyimpanan

Secara default, data LanceDB berada di bawah `~/.openclaw/memory/lancedb`. Ganti
path dengan `dbPath`:

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
memperlakukan paket tersebut sebagai bagian dari paket plugin. Startup Gateway
tidak memperbaiki dependensi plugin; jika dependensi hilang, instal ulang atau
perbarui paket plugin dan mulai ulang Gateway.

Jika instalasi lama mencatat galat `dist/package.json` yang hilang atau
`@lancedb/lancedb` yang hilang selama pemuatan plugin, tingkatkan OpenClaw dan mulai ulang
Gateway.

Jika plugin mencatat bahwa LanceDB tidak tersedia pada `darwin-x64`, gunakan backend
memori default di mesin tersebut, pindahkan Gateway ke platform yang didukung, atau
nonaktifkan `memory-lancedb`.

## Pemecahan masalah

### Panjang input melebihi panjang konteks

Ini biasanya berarti model embedding menolak kueri recall:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

Atur `recallMaxChars` yang lebih rendah, lalu mulai ulang Gateway:

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
Untuk model embedding lokal atau kustom, atur `embedding.dimensions` ke ukuran vektor
yang dilaporkan oleh model tersebut.

### Plugin dimuat tetapi tidak ada memori yang muncul

Periksa bahwa `plugins.slots.memory` mengarah ke `memory-lancedb`, lalu jalankan:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Jika `autoCapture` dinonaktifkan, plugin akan me-recall memori yang ada tetapi
tidak akan otomatis menyimpan yang baru. Gunakan alat `memory_store` atau aktifkan
`autoCapture` jika Anda menginginkan capture otomatis.

## Terkait

- [Ikhtisar memori](/id/concepts/memory)
- [Active memory](/id/concepts/active-memory)
- [Pencarian memori](/id/concepts/memory-search)
- [Memory Wiki](/id/plugins/memory-wiki)
- [Ollama](/id/providers/ollama)
