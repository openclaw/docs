---
read_when:
    - Anda ingin mengonfigurasi id penyedia qwen-oauth
    - Anda sebelumnya menggunakan kredensial OAuth Qwen Portal
    - Anda memerlukan endpoint Qwen Portal atau panduan migrasi
summary: Gunakan ID penyedia Qwen Portal dengan OpenClaw
title: Qwen OAuth / Portal
x-i18n:
    generated_at: "2026-06-27T18:07:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 46f147e3730024bf63e99827f666e2be791318723eace98941ca067c440dddd0
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` adalah id penyedia Qwen Portal. Ini menargetkan endpoint Qwen Portal
dan membuat penyiapan Qwen OAuth / portal lama tetap dapat dialamati melalui id
penyedia yang berbeda.

Gunakan penyedia ini saat Anda secara khusus memiliki token Qwen Portal saat ini untuk
`https://portal.qwen.ai/v1`, atau saat Anda memigrasikan penyiapan Qwen Portal /
Qwen CLI lama dan ingin memisahkan kredensial tersebut dari penyedia Qwen Cloud
kanonis. Ini bukan pilihan pertama yang direkomendasikan untuk pengguna Qwen baru.

Untuk penyiapan Qwen Cloud baru, utamakan [Qwen](/id/providers/qwen) dengan endpoint
Standard ModelStudio kecuali Anda secara khusus memiliki token Qwen Portal saat ini.

## Penyiapan

Berikan token portal Anda melalui onboarding:

```bash
openclaw onboard --auth-choice qwen-oauth
```

Atau tetapkan:

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

## Default

- Penyedia: `qwen-oauth`
- Alias: `qwen-portal`, `qwen-cli`
- URL dasar: `https://portal.qwen.ai/v1`
- Variabel env: `QWEN_API_KEY`
- Gaya API: kompatibel dengan OpenAI
- Model default: `qwen-oauth/qwen3.5-plus`

## Perbedaannya dari Qwen

OpenClaw memiliki dua id penyedia yang menghadap Qwen:

| Penyedia     | Keluarga endpoint                                      | Paling cocok untuk                                                                    |
| ------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `qwen`       | Endpoint Qwen Cloud / Alibaba DashScope dan Coding Plan | Penyiapan kunci API baru, Standard bayar sesuai penggunaan, Coding Plan, fitur multimodal DashScope |
| `qwen-oauth` | Endpoint Qwen Portal di `portal.qwen.ai/v1`             | Token Qwen Portal yang ada dan penyiapan Qwen OAuth / CLI lama                        |

Kedua penyedia menggunakan bentuk permintaan yang kompatibel dengan OpenAI, tetapi keduanya adalah permukaan auth
yang terpisah. Token yang disimpan untuk `qwen-oauth` tidak boleh diperlakukan sebagai kunci DashScope
atau ModelStudio, dan kunci DashScope baru sebaiknya menggunakan penyedia `qwen`
kanonis.

## Kapan memilih Qwen OAuth / Portal

- Anda sudah memiliki token Qwen Portal yang berfungsi.
- Anda mempertahankan alur kerja Qwen OAuth atau Qwen CLI lama sambil berpindah ke
  model penyedia OpenClaw.
- Anda perlu menguji kompatibilitas secara khusus dengan endpoint Qwen Portal.

Pilih [Qwen](/id/providers/qwen) untuk penyiapan baru, pilihan endpoint yang lebih luas, Standard
ModelStudio, Coding Plan, dan katalog plugin Qwen lengkap.

## Model

Katalog plugin Qwen mengisi default Qwen Portal:

- `qwen-oauth/qwen3.5-plus`

Ketersediaan bergantung pada akun dan token Qwen Portal saat ini. Jika akun Anda
menggunakan kunci API ModelStudio / DashScope, konfigurasikan penyedia
`qwen` kanonis:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## Migrasi

Profil OAuth Qwen Portal lama mungkin tidak dapat disegarkan. Jika profil portal
berhenti berfungsi, autentikasi ulang dengan token saat ini atau beralih ke penyedia Qwen
Standard:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

ModelStudio global Standard menggunakan:

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## Pemecahan masalah

- Kegagalan penyegaran OAuth portal: profil OAuth Qwen Portal lama mungkin tidak dapat
  disegarkan. Jalankan ulang onboarding dengan token saat ini.
- Kesalahan endpoint yang salah: pastikan ref model diawali dengan `qwen-oauth/` saat
  menggunakan token portal. Gunakan ref `qwen/` hanya untuk penyedia Qwen kanonis.
- Kebingungan `QWEN_API_KEY`: kedua halaman Qwen menyebutkan variabel env ini, tetapi onboarding
  menyimpan kredensial di bawah id penyedia yang dipilih. Utamakan onboarding saat Anda
  membuat `qwen` dan `qwen-oauth` sama-sama tersedia di mesin yang sama.

## Terkait

- [Qwen](/id/providers/qwen)
- [Alibaba Model Studio](/id/providers/alibaba)
- [Penyedia model](/id/concepts/model-providers)
- [Semua penyedia](/id/providers/index)
