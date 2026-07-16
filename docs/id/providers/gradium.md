---
read_when:
    - Anda ingin Gradium untuk teks-ke-ucapan
    - Anda memerlukan konfigurasi kunci API, suara, atau token direktif Gradium
summary: Gunakan text-to-speech Gradium di OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-07-16T18:33:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 80120b1951115b6c81247c6bc6bc3c8834ef454c30d32f1d854cd3cca0870750
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) adalah penyedia text-to-speech untuk OpenClaw. Penyedia ini menghasilkan balasan audio standar (WAV), keluaran Opus yang kompatibel dengan pesan suara, dan audio u-law 8 kHz untuk antarmuka telepon.

| Properti      | Nilai                                |
| ------------- | ------------------------------------ |
| ID penyedia   | `gradium`                            |
| Autentikasi   | `GRADIUM_API_KEY` atau konfigurasi `apiKey` |
| URL dasar     | `https://api.gradium.ai` (default)   |
| Suara default | `Emma` (`YTpq7expH9539ERJ`)          |

## Instal Plugin

Gradium adalah Plugin eksternal resmi. Instal Plugin tersebut, lalu mulai ulang Gateway:

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## Penyiapan

Buat kunci API Gradium, lalu sediakan melalui variabel lingkungan atau kunci konfigurasi. Konfigurasi lebih diprioritaskan daripada variabel lingkungan.

<Tabs>
  <Tab title="Variabel lingkungan">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="Kunci konfigurasi">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "gradium",
          providers: {
            gradium: {
              apiKey: "${GRADIUM_API_KEY}",
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Konfigurasi

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          speakerVoiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

| Kunci                                           | Tipe   | Deskripsi                                                                                             |
| ----------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | string | Kunci API yang telah diresolusi. Mendukung `${ENV}` dan referensi rahasia.                                                    |
| `messages.tts.providers.gradium.baseUrl`        | string | URL API HTTPS Gradium pada `api.gradium.ai`. Garis miring di akhir dihapus. Default `https://api.gradium.ai`. |
| `messages.tts.providers.gradium.speakerVoiceId` | string | ID suara default yang digunakan ketika tidak ada penggantian melalui direktif.                                            |

Format keluaran dipilih secara otomatis berdasarkan antarmuka target (lihat [Keluaran](#output)) dan tidak dapat dikonfigurasi di `openclaw.json`.

## Suara

| Nama               | ID Suara           |
| ------------------ | ------------------ |
| Arthur             | `3jUdJyOi9pgbxBTK` |
| Christina          | `2H4HY2CBNyJHBCrP` |
| Emma **(default)** | `YTpq7expH9539ERJ` |
| John               | `KWJiFWu2O9nMPYcR` |
| Kent               | `LFZvm12tW_z0xfGo` |
| Sydney             | `jtEKaLYNn6iif5PR` |
| Tiffany            | `Eu9iL_CYe8N-Gkx_` |

### Penggantian suara per pesan

Saat kebijakan suara aktif mengizinkan penggantian suara, ganti suara secara inline dengan token direktif (semuanya setara dan menerima ID suara bawaan penyedia):

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

Jika kebijakan suara menonaktifkan penggantian suara, direktif tersebut diproses tetapi diabaikan.

## Keluaran

Format keluaran dipilih berdasarkan antarmuka target; penyedia tidak menyintesis format lain.

| Target         | Format      | Ekstensi file | Laju sampel | Penanda kompatibel dengan suara |
| -------------- | ----------- | ------------- | ----------- | ------------------------------- |
| Audio standar  | `wav`       | `.wav`   | penyedia    | tidak                           |
| Pesan suara    | `opus`      | `.opus`  | penyedia    | ya                              |
| Telepon        | `ulaw_8000` | n/a           | 8 kHz       | n/a                             |

## Urutan pemilihan otomatis

Di antara penyedia TTS yang dikonfigurasi, urutan pemilihan otomatis Gradium adalah `30`. Lihat [Text-to-Speech](/id/tools/tts) untuk mengetahui cara OpenClaw memilih penyedia aktif saat `messages.tts.provider` tidak ditetapkan.

## Terkait

- [Text-to-Speech](/id/tools/tts)
- [Ikhtisar Media](/id/tools/media-overview)
