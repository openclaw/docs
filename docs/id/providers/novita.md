---
read_when:
    - Anda ingin menjalankan OpenClaw dengan model NovitaAI
    - Anda memerlukan ID penyedia, kunci, atau titik akhir Novita
summary: Gunakan API NovitaAI yang kompatibel dengan OpenAI bersama OpenClaw
title: NovitaAI
x-i18n:
    generated_at: "2026-07-12T14:36:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83e0e43e68d85d73e790023858a49f971b683129dbbdf6092fbd8bba4d8da331
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI adalah penyedia infrastruktur AI terkelola dengan API yang kompatibel dengan OpenAI.
Penyedia ini disertakan sebagai penyedia bawaan OpenClaw (tidak perlu menginstal plugin terpisah), sehingga
kredensial diproses melalui alur autentikasi model biasa dan referensi model terlihat seperti
`novita/deepseek/deepseek-v3-0324`.

## Penyiapan

Buat kunci API di [novita.ai/settings/key-management](https://novita.ai/settings/key-management), lalu jalankan:

```bash
openclaw onboard --auth-choice novita-api-key
```

Atau tetapkan:

```bash
export NOVITA_API_KEY="<your-novita-api-key>" # pragma: allowlist secret
```

## Nilai default

| Pengaturan       | Nilai                              |
| ---------------- | ---------------------------------- |
| ID penyedia      | `novita`                           |
| Alias            | `novita-ai`, `novitaai`            |
| URL dasar        | `https://api.novita.ai/openai/v1`  |
| Variabel lingkungan | `NOVITA_API_KEY`                |
| Model default    | `novita/deepseek/deepseek-v3-0324` |

## Katalog model bawaan

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

Ini adalah titik awal, bukan katalog langsung. Akun, wilayah, atau
penawaran Novita saat ini mungkin menambah, menghapus, atau membatasi rute. Periksa sebelum
menetapkan nilai default jangka panjang:

```bash
openclaw models list --provider novita
```

## Kapan memilih Novita

- Akses model berbobot terbuka yang dikelola dengan API yang kompatibel dengan OpenAI.
- Rute keluarga DeepSeek, Kimi, MiniMax, GLM, atau Qwen melalui satu akun
  penyedia.
- Jalur cadangan terkelola lainnya selain DeepInfra, GMI, OpenRouter, atau API
  vendor langsung.
- Hosting model di sisi penyedia alih-alih memelihara infrastruktur LM Studio, Ollama,
  SGLang, atau vLLM.

Pilih penyedia vendor langsung ketika Anda memerlukan parameter permintaan
khusus vendor atau kontrak dukungan. Pilih penyedia lokal ketika model harus
berjalan pada perangkat keras Anda sendiri atau dalam batas jaringan Anda.

## Pemecahan masalah

- `401`/`403`: verifikasi kunci di halaman pengelolaan kunci Novita dan jalankan kembali
  `openclaw onboard --auth-choice novita-api-key` jika profil yang tersimpan
  sudah kedaluwarsa.
- Galat model tidak dikenal: gunakan `novita/<route-id>` persis seperti yang ditampilkan oleh
  `openclaw models list --provider novita`.
- Rute lambat atau gagal: coba rute model Novita lainnya, atau tetapkan Novita sebagai
  penyedia cadangan untuk beban kerja yang dapat menoleransi variasi
  khusus penyedia.

## Terkait

- [Penyedia model](/id/concepts/model-providers)
- [Direktori penyedia](/id/providers/index)
