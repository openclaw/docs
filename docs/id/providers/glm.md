---
read_when:
    - Anda ingin model GLM di OpenClaw
    - Anda memerlukan konvensi penamaan model dan penyiapan
summary: Ikhtisar keluarga model GLM dan cara menggunakannya di OpenClaw
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-05-06T09:24:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 190b8834e3f11cdb90c9bdb1844bfad3a79383776540f733e601437157b7a093
    source_path: providers/glm.md
    workflow: 16
---

GLM adalah keluarga model (bukan perusahaan) yang tersedia melalui platform [Z.AI](https://z.ai). Di OpenClaw, model GLM diakses melalui penyedia `zai` bawaan dengan ref seperti `zai/glm-5.1`.

| Properti                 | Nilai                                                                       |
| ------------------------ | --------------------------------------------------------------------------- |
| ID penyedia              | `zai`                                                                       |
| Plugin                   | dibundel, `enabledByDefault: true`                                          |
| Variabel env autentikasi | `ZAI_API_KEY` atau `Z_AI_API_KEY`                                           |
| Pilihan onboarding       | `zai-api-key`, `zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn` |
| API                      | kompatibel dengan OpenAI                                                    |
| URL dasar default        | `https://api.z.ai/api/paas/v4`                                              |
| Default yang disarankan  | `zai/glm-5.1`                                                               |
| Model gambar default     | `zai/glm-4.6v`                                                              |

## Memulai

<Steps>
  <Step title="Pilih rute autentikasi dan jalankan onboarding">
    Pilih opsi onboarding yang cocok dengan paket dan wilayah Z.AI Anda. Opsi umum `zai-api-key` mendeteksi otomatis endpoint yang cocok dari bentuk kunci; gunakan opsi wilayah eksplisit saat Anda ingin memaksa Coding Plan tertentu atau permukaan API umum tertentu.

    | Pilihan autentikasi | Paling cocok untuk                                  |
    | ------------------- | --------------------------------------------------- |
    | `zai-api-key`       | Kunci API umum dengan deteksi otomatis endpoint     |
    | `zai-coding-global` | Pengguna Coding Plan (global)                       |
    | `zai-coding-cn`     | Pengguna Coding Plan (wilayah Tiongkok)             |
    | `zai-global`        | API umum (global)                                   |
    | `zai-cn`            | API umum (wilayah Tiongkok)                         |

    <CodeGroup>

```bash Deteksi otomatis
openclaw onboard --auth-choice zai-api-key
```

```bash Coding Plan (global)
openclaw onboard --auth-choice zai-coding-global
```

```bash Coding Plan (Tiongkok)
openclaw onboard --auth-choice zai-coding-cn
```

```bash API umum (global)
openclaw onboard --auth-choice zai-global
```

```bash API umum (Tiongkok)
openclaw onboard --auth-choice zai-cn
```

    </CodeGroup>

  </Step>
  <Step title="Tetapkan GLM sebagai model default">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="Verifikasi model tersedia">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## Contoh konfigurasi

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
  `zai-api-key` memungkinkan OpenClaw mendeteksi endpoint Z.AI yang cocok dari bentuk kunci dan menerapkan URL dasar yang benar secara otomatis. Gunakan opsi wilayah eksplisit saat Anda ingin menetapkan Coding Plan tertentu atau permukaan API umum tertentu.
</Tip>

## Katalog bawaan

Penyedia `zai` bawaan mengisi 13 ref model GLM. Semua entri mendukung penalaran kecuali ditandai sebaliknya; `glm-5v-turbo` dan `glm-4.6v` menerima input gambar sekaligus teks.

| Ref model            | Catatan                                                    |
| -------------------- | ---------------------------------------------------------- |
| `zai/glm-5.1`        | Model default. Penalaran, hanya teks, konteks 202k.        |
| `zai/glm-5`          | Penalaran, hanya teks, konteks 202k.                       |
| `zai/glm-5-turbo`    | Penalaran, hanya teks, konteks 202k.                       |
| `zai/glm-5v-turbo`   | Penalaran, teks + gambar, konteks 202k.                    |
| `zai/glm-4.7`        | Penalaran, hanya teks, konteks 204k.                       |
| `zai/glm-4.7-flash`  | Penalaran, hanya teks, konteks 200k.                       |
| `zai/glm-4.7-flashx` | Penalaran, hanya teks.                                     |
| `zai/glm-4.6`        | Penalaran, hanya teks.                                     |
| `zai/glm-4.6v`       | Penalaran, teks + gambar. Model gambar default.            |
| `zai/glm-4.5`        | Penalaran, hanya teks.                                     |
| `zai/glm-4.5-air`    | Penalaran, hanya teks.                                     |
| `zai/glm-4.5-flash`  | Penalaran, hanya teks.                                     |
| `zai/glm-4.5v`       | Penalaran, teks + gambar.                                  |

<Note>
  Versi dan ketersediaan GLM dapat berubah. Jalankan `openclaw models list --provider zai` untuk melihat baris katalog yang diketahui oleh versi terpasang Anda, dan periksa dokumentasi Z.AI untuk model yang baru ditambahkan atau dihentikan.
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Deteksi otomatis endpoint">
    Saat Anda menggunakan pilihan autentikasi `zai-api-key`, OpenClaw memeriksa bentuk kunci untuk menentukan URL dasar Z.AI yang benar. Pilihan wilayah eksplisit (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) menimpa deteksi otomatis dan menetapkan endpoint secara langsung.
  </Accordion>

  <Accordion title="Detail penyedia">
    Model GLM dilayani oleh penyedia runtime `zai`. Untuk konfigurasi penyedia lengkap, endpoint wilayah, dan kemampuan tambahan, lihat [halaman penyedia Z.AI](/id/providers/zai).
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Penyedia Z.AI" href="/id/providers/zai" icon="server">
    Konfigurasi penyedia Z.AI lengkap dan endpoint wilayah.
  </Card>
  <Card title="Penyedia model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="Mode berpikir" href="/id/tools/thinking" icon="brain">
    Level `/think` untuk keluarga GLM yang mendukung penalaran.
  </Card>
  <Card title="FAQ model" href="/id/help/faq-models" icon="circle-question">
    Profil autentikasi, beralih model, dan menyelesaikan kesalahan "no profile".
  </Card>
</CardGroup>
