---
read_when:
    - Anda ingin menggunakan Groq dengan OpenClaw
    - Anda memerlukan variabel lingkungan kunci API atau pilihan autentikasi CLI
summary: Penyiapan Groq (autentikasi + pemilihan model)
title: Groq
x-i18n:
    generated_at: "2026-04-30T10:07:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed612471939e7ac5362f8236f179d38ae07f9076709ff55020c1790f7c56a6fa
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) menyediakan inferensi ultra-cepat pada model sumber terbuka
(Llama, Gemma, Mistral, dan lainnya) menggunakan perangkat keras LPU khusus. OpenClaw terhubung
ke Groq melalui API-nya yang kompatibel dengan OpenAI.

| Properti | Nilai             |
| -------- | ----------------- |
| Penyedia | `groq`            |
| Autentikasi | `GROQ_API_KEY` |
| API      | Kompatibel dengan OpenAI |

## Memulai

<Steps>
  <Step title="Dapatkan kunci API">
    Buat kunci API di [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Atur kunci API">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
  </Step>
  <Step title="Atur model default">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
</Steps>

### Contoh file konfigurasi

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Katalog bawaan

Katalog model Groq sering berubah. Jalankan `openclaw models list | grep groq`
untuk melihat model yang saat ini tersedia, atau periksa
[console.groq.com/docs/models](https://console.groq.com/docs/models).

| Model                       | Catatan                            |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | Serbaguna, konteks besar           |
| **Llama 3.1 8B Instant**    | Cepat, ringan                      |
| **Gemma 2 9B**              | Ringkas, efisien                   |
| **Mixtral 8x7B**            | Arsitektur MoE, penalaran kuat     |

<Tip>
Gunakan `openclaw models list --provider groq` untuk daftar model paling mutakhir yang
tersedia di akun Anda.
</Tip>

## Model penalaran

OpenClaw memetakan level `/think` bersama ke nilai `reasoning_effort`
khusus model milik Groq. Untuk `qwen/qwen3-32b`, pemikiran yang dinonaktifkan mengirim
`none` dan pemikiran yang diaktifkan mengirim `default`. Untuk model penalaran Groq GPT-OSS,
OpenClaw mengirim `low`, `medium`, atau `high`; pemikiran yang dinonaktifkan menghilangkan
`reasoning_effort` karena model tersebut tidak mendukung nilai yang dinonaktifkan.

## Transkripsi audio

Groq juga menyediakan transkripsi audio cepat berbasis Whisper. Saat dikonfigurasi sebagai
penyedia pemahaman media, OpenClaw menggunakan model `whisper-large-v3-turbo`
milik Groq untuk mentranskripsikan pesan suara melalui permukaan bersama `tools.media.audio`.

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Detail transkripsi audio">
    | Properti | Nilai |
    |----------|-------|
    | Jalur konfigurasi bersama | `tools.media.audio` |
    | URL dasar default | `https://api.groq.com/openai/v1` |
    | Model default | `whisper-large-v3-turbo` |
    | Endpoint API | `/audio/transcriptions` yang kompatibel dengan OpenAI |
  </Accordion>

  <Accordion title="Catatan lingkungan">
    Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `GROQ_API_KEY`
    tersedia untuk proses tersebut (misalnya, di `~/.openclaw/.env` atau melalui
    `env.shellEnv`).

    <Warning>
    Kunci yang hanya diatur di shell interaktif Anda tidak terlihat oleh proses
    gateway yang dikelola daemon. Gunakan konfigurasi `~/.openclaw/.env` atau `env.shellEnv` untuk
    ketersediaan persisten.
    </Warning>

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Skema konfigurasi lengkap termasuk pengaturan penyedia dan audio.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Dasbor Groq, dokumentasi API, dan harga.
  </Card>
  <Card title="Daftar model Groq" href="https://console.groq.com/docs/models" icon="list">
    Katalog model resmi Groq.
  </Card>
</CardGroup>
