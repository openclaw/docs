---
read_when:
    - Anda ingin menggunakan pratinjau Tencent Hy3 dengan OpenClaw
    - Anda memerlukan penyiapan kunci API TokenHub
summary: Penyiapan Tencent Cloud TokenHub untuk pratinjau Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-24T09:24:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: c64afffc66dccca256ec658235ae1fbc18e46608b594bc07875118f54b2a494d
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud TokenHub

Tencent Cloud hadir sebagai **Plugin provider bawaan** di OpenClaw. Ini memberikan akses ke pratinjau Tencent Hy3 melalui endpoint TokenHub (`tencent-tokenhub`).

Provider ini menggunakan API yang kompatibel dengan OpenAI.

| Properti      | Nilai                                      |
| ------------- | ------------------------------------------ |
| Provider      | `tencent-tokenhub`                         |
| Model default | `tencent-tokenhub/hy3-preview`             |
| Autentikasi          | `TOKENHUB_API_KEY`                         |
| API           | chat completions yang kompatibel dengan OpenAI         |
| Base URL      | `https://tokenhub.tencentmaas.com/v1`      |
| URL global    | `https://tokenhub-intl.tencentmaas.com/v1` |

## Memulai dengan cepat

<Steps>
  <Step title="Buat kunci API TokenHub">
    Buat kunci API di Tencent Cloud TokenHub. Jika Anda memilih cakupan akses terbatas untuk kunci tersebut, sertakan **pratinjau Hy3** dalam model yang diizinkan.
  </Step>
  <Step title="Jalankan onboarding">
    ```bash
    openclaw onboard --auth-choice tokenhub-api-key
    ```
  </Step>
  <Step title="Verifikasi model">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## Penyiapan non-interaktif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Katalog bawaan

| Referensi model                      | Nama                   | Input | Konteks | Output maks | Catatan                      |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Pratinjau Hy3 (TokenHub) | text  | 256,000 | 64,000     | Default; reasoning-enabled |

Pratinjau Hy3 adalah model bahasa besar MoE Tencent Hunyuan untuk reasoning, mengikuti instruksi konteks panjang, kode, dan alur kerja agen. Contoh yang kompatibel dengan OpenAI dari Tencent menggunakan `hy3-preview` sebagai ID model dan mendukung pemanggilan alat chat-completions standar ditambah `reasoning_effort`.

<Tip>
ID modelnya adalah `hy3-preview`. Jangan bingung dengan model `HY-3D-*` milik Tencent, yang merupakan API pembuatan 3D dan bukan model chat OpenClaw yang dikonfigurasi oleh provider ini.
</Tip>

## Override endpoint

OpenClaw secara default menggunakan endpoint `https://tokenhub.tencentmaas.com/v1` milik Tencent Cloud. Tencent juga mendokumentasikan endpoint TokenHub internasional:

```bash
openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
```

Lakukan override endpoint hanya jika akun atau wilayah TokenHub Anda memerlukannya.

## Catatan

- Referensi model TokenHub menggunakan `tencent-tokenhub/<modelId>`.
- Katalog bawaan saat ini mencakup `hy3-preview`.
- Plugin menandai pratinjau Hy3 sebagai mampu reasoning dan mampu streaming-usage.
- Plugin disertai metadata harga Hy3 bertingkat, sehingga estimasi biaya terisi tanpa override harga manual.
- Override metadata harga, konteks, atau endpoint di `models.providers` hanya bila diperlukan.

## Catatan lingkungan

Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `TOKENHUB_API_KEY`
tersedia untuk proses tersebut (misalnya, di `~/.openclaw/.env` atau melalui
`env.shellEnv`).

## Dokumentasi terkait

- [Konfigurasi OpenClaw](/id/gateway/configuration)
- [Provider Model](/id/concepts/model-providers)
- [Halaman produk Tencent TokenHub](https://cloud.tencent.com/product/tokenhub)
- [Pembuatan teks Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130079)
- [Penyiapan Cline Tencent TokenHub untuk pratinjau Hy3](https://cloud.tencent.com/document/product/1823/130932)
- [Kartu model Tencent Hy3 preview](https://huggingface.co/tencent/Hy3-preview)
