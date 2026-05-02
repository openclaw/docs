---
read_when:
    - Anda ingin menggunakan Groq dengan OpenClaw
    - Anda memerlukan variabel lingkungan kunci API atau pilihan autentikasi CLI
summary: Penyiapan Groq (autentikasi + pemilihan model)
title: Groq
x-i18n:
    generated_at: "2026-05-02T09:29:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2cf6678047581a438906420894b250bafb68d71254fbaf30ea5dfcfc4799eac7
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) menyediakan inferensi sangat cepat pada model sumber terbuka
(Llama, Gemma, Mistral, dan lainnya) menggunakan perangkat keras LPU khusus. OpenClaw terhubung
ke Groq melalui API-nya yang kompatibel dengan OpenAI.

| Properti | Nilai             |
| -------- | ----------------- |
| Penyedia | `groq`            |
| Auth     | `GROQ_API_KEY`    |
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

OpenClaw menyertakan katalog Groq berbasis manifes untuk daftar model cepat
yang difilter berdasarkan penyedia. Jalankan `openclaw models list --all --provider groq` untuk melihat baris
bawaan, atau periksa
[console.groq.com/docs/models](https://console.groq.com/docs/models).

| Model                       | Catatan                            |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | Serbaguna, konteks besar           |
| **Llama 3.1 8B Instant**    | Cepat, ringan                      |
| **Gemma 2 9B**              | Ringkas, efisien                   |
| **Mixtral 8x7B**            | Arsitektur MoE, penalaran kuat     |

<Tip>
Gunakan `openclaw models list --all --provider groq` untuk baris Groq berbasis manifes
yang diketahui oleh versi OpenClaw ini.
</Tip>

## Model penalaran

OpenClaw memetakan level `/think` bersama ke nilai `reasoning_effort`
khusus model milik Groq. Untuk `qwen/qwen3-32b`, penalaran yang dinonaktifkan mengirim
`none` dan penalaran yang diaktifkan mengirim `default`. Untuk model penalaran Groq GPT-OSS,
OpenClaw mengirim `low`, `medium`, atau `high`; penalaran yang dinonaktifkan menghilangkan
`reasoning_effort` karena model tersebut tidak mendukung nilai nonaktif.

## Transkripsi audio

Groq juga menyediakan transkripsi audio berbasis Whisper yang cepat. Saat dikonfigurasi sebagai
penyedia pemahaman media, OpenClaw menggunakan model `whisper-large-v3-turbo`
milik Groq untuk mentranskripsi pesan suara melalui permukaan bersama `tools.media.audio`.

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
    | URL dasar default   | `https://api.groq.com/openai/v1` |
    | Model default      | `whisper-large-v3-turbo` |
    | Endpoint API       | `/audio/transcriptions` kompatibel dengan OpenAI |
  </Accordion>

  <Accordion title="Catatan lingkungan">
    Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `GROQ_API_KEY` tersedia
    untuk proses tersebut (misalnya, di `~/.openclaw/.env` atau melalui
    `env.shellEnv`).

    <Warning>
    Kunci yang hanya diatur di shell interaktif Anda tidak terlihat oleh proses Gateway
    yang dikelola daemon. Gunakan konfigurasi `~/.openclaw/.env` atau `env.shellEnv` untuk
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
