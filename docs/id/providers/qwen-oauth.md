---
read_when:
    - Anda ingin mengonfigurasi ID penyedia qwen-oauth
    - Anda sebelumnya menggunakan kredensial OAuth Qwen Portal
    - Anda memerlukan endpoint Portal Qwen atau panduan migrasi
summary: Gunakan ID penyedia Qwen Portal dengan OpenClaw
title: OAuth / Portal Qwen
x-i18n:
    generated_at: "2026-07-12T14:38:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b78f6f23e62e38d11e6fe4e2bf515b13b414f276d08f672740ad94747a22c8fb
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` adalah id penyedia Qwen Portal, yang didaftarkan oleh plugin Qwen
(`@openclaw/qwen-provider`). Penyedia ini menggunakan endpoint Qwen Portal di
`https://portal.qwen.ai/v1` dan mempertahankan agar penyiapan Qwen OAuth / portal
lama tetap dapat diakses melalui id penyedia yang berbeda, terpisah dari penyedia
kanonis `qwen`.

Pilih `qwen-oauth` jika Anda sudah memiliki token Qwen Portal yang berfungsi,
sedang memigrasikan alur kerja Qwen OAuth atau Qwen CLI lama, atau perlu menguji
endpoint Qwen Portal secara khusus. Untuk penyiapan baru, utamakan
[Qwen](/id/providers/qwen) dengan endpoint Standard ModelStudio: opsi ini mencakup
penyiapan kunci API baru, pilihan endpoint yang lebih luas, Standard bayar sesuai
pemakaian, Coding Plan, dan katalog lengkap plugin Qwen.

## Penyiapan

Instal plugin Qwen jika Anda belum melakukannya:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

Berikan token portal Anda melalui orientasi awal:

```bash
openclaw onboard --auth-choice qwen-oauth
```

Proses noninteraktif membaca token dari `--qwen-oauth-token <token>`, atau tetapkan:

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

Orientasi awal menyimpan token dalam profil autentikasi `qwen-oauth`, mengisi
katalog model portal, dan menetapkan `qwen-oauth/qwen3.5-plus` sebagai model
bawaan jika belum ada model yang dikonfigurasi.

## Nilai bawaan

- Penyedia: `qwen-oauth`
- Alias: `qwen-portal`, `qwen-cli`
- URL dasar: `https://portal.qwen.ai/v1`
- Variabel lingkungan: `QWEN_API_KEY`
- Gaya API: kompatibel dengan OpenAI
- Model bawaan: `qwen-oauth/qwen3.5-plus`

## Perbedaannya dengan Qwen

OpenClaw memiliki dua id penyedia yang berhubungan dengan Qwen:

| Penyedia     | Keluarga endpoint                                          | Paling sesuai untuk                                                                                          |
| ------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `qwen`       | Endpoint Qwen Cloud / Alibaba DashScope dan Coding Plan    | Penyiapan kunci API baru, Standard bayar sesuai pemakaian, Coding Plan, fitur DashScope multimodal            |
| `qwen-oauth` | Endpoint Qwen Portal di `portal.qwen.ai/v1`                | Token Qwen Portal yang sudah ada dan penyiapan Qwen OAuth / CLI lama                                         |

Kedua penyedia menggunakan bentuk permintaan yang kompatibel dengan OpenAI,
tetapi merupakan antarmuka autentikasi yang terpisah. Token yang disimpan untuk
`qwen-oauth` tidak boleh dianggap sebagai kunci DashScope atau ModelStudio, dan
kunci DashScope baru sebaiknya menggunakan penyedia kanonis `qwen`.

## Model

Plugin Qwen mengisi katalog statis ini untuk endpoint Qwen Portal. Semua entri
menggunakan keluaran maksimum 65.536 token; ketersediaannya bergantung pada akun
dan token Qwen Portal saat ini.

| Referensi model                    | Masukan     | Konteks   | Catatan       |
| ---------------------------------- | ----------- | --------- | ------------- |
| `qwen-oauth/qwen3.5-plus`          | teks, gambar | 1.000.000 | Model bawaan  |
| `qwen-oauth/qwen3.6-plus`          | teks, gambar | 1.000.000 |               |
| `qwen-oauth/qwen3-max-2026-01-23`  | teks         | 262.144   |               |
| `qwen-oauth/qwen3-coder-next`      | teks         | 262.144   |               |
| `qwen-oauth/qwen3-coder-plus`      | teks         | 1.000.000 |               |
| `qwen-oauth/MiniMax-M2.5`          | teks         | 1.000.000 | Penalaran     |
| `qwen-oauth/glm-5`                 | teks         | 202.752   |               |
| `qwen-oauth/glm-4.7`               | teks         | 202.752   |               |
| `qwen-oauth/kimi-k2.5`             | teks, gambar | 262.144   |               |

Jika akun Anda menggunakan kunci API ModelStudio / DashScope, konfigurasikan
penyedia kanonis `qwen`:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## Migrasi

Profil OAuth Qwen Portal lama tidak dapat disegarkan; `openclaw doctor`
menandainya. Jika profil portal berhenti berfungsi, jalankan kembali orientasi
awal dengan token terkini atau beralihlah ke penyedia Standard Qwen:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

ModelStudio global Standard menggunakan:

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## Pemecahan masalah

- Kegagalan penyegaran OAuth portal: profil OAuth Qwen Portal lama tidak dapat
  disegarkan. Jalankan kembali orientasi awal dengan token terkini.
- Kesalahan endpoint yang keliru: pastikan referensi model diawali dengan
  `qwen-oauth/` saat menggunakan token portal. Gunakan referensi `qwen/` hanya
  untuk penyedia kanonis Qwen.
- Kebingungan `QWEN_API_KEY`: kedua halaman Qwen menyebutkan variabel lingkungan
  ini, tetapi orientasi awal menyimpan kredensial di bawah id penyedia yang
  dipilih. Utamakan orientasi awal jika Anda menyediakan `qwen` dan `qwen-oauth`
  sekaligus di mesin yang sama.

## Terkait

- [Qwen](/id/providers/qwen)
- [Alibaba Model Studio](/id/providers/alibaba)
- [Penyedia model](/id/concepts/model-providers)
- [Semua penyedia](/id/providers/index)
