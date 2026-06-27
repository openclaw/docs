---
read_when:
    - Anda menginginkan Gradium untuk teks-ke-ucapan
    - Anda memerlukan konfigurasi kunci API, suara, atau token direktif Gradium
summary: Gunakan teks-ke-ucapan Gradium di OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-06-27T18:04:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5178bfaf5087e18d5d71f46d04b16d52e0e132257b9ef772b7869ac11b49a0da
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) adalah penyedia text-to-speech untuk OpenClaw. Plugin ini dapat merender balasan audio normal (WAV), keluaran Opus yang kompatibel dengan catatan suara, dan audio u-law 8 kHz untuk permukaan teleponi.

| Properti      | Nilai                                |
| ------------- | ------------------------------------ |
| Id penyedia   | `gradium`                            |
| Autentikasi   | `GRADIUM_API_KEY` atau config `apiKey` |
| URL dasar     | `https://api.gradium.ai` (default)   |
| Suara default | `Emma` (`YTpq7expH9539ERJ`)          |

## Instal Plugin

Instal Plugin resmi, lalu mulai ulang Gateway:

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## Penyiapan

Buat kunci API Gradium, lalu ekspos ke OpenClaw dengan variabel lingkungan atau kunci config.

<Tabs>
  <Tab title="Env var">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="Config key">
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

Plugin memeriksa `apiKey` yang telah di-resolve terlebih dahulu dan kembali menggunakan variabel lingkungan `GRADIUM_API_KEY`.

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

| Kunci                                           | Jenis  | Deskripsi                                                                                   |
| ----------------------------------------------- | ------ | ------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | string | Kunci API yang telah di-resolve. Mendukung `${ENV}` dan referensi rahasia.                  |
| `messages.tts.providers.gradium.baseUrl`        | string | Mengganti origin API. Garis miring di akhir akan dihapus. Default ke `https://api.gradium.ai`. |
| `messages.tts.providers.gradium.speakerVoiceId` | string | Id suara default yang digunakan saat tidak ada penggantian direktif.                        |

Format audio keluaran dipilih otomatis oleh runtime berdasarkan permukaan target dan tidak dapat dikonfigurasi dari `openclaw.json`. Lihat [Keluaran](#output) di bawah.

## Suara

| Nama      | ID Suara           |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

Suara default: Emma.

### Penimpaan suara per pesan

Ketika kebijakan ucapan aktif mengizinkan penimpaan suara, Anda dapat mengganti suara secara inline menggunakan token direktif. Gunakan `speakerVoiceId` untuk ID suara native penyedia.

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

Jika kebijakan ucapan menonaktifkan penimpaan suara, direktif tersebut diproses tetapi diabaikan.

## Keluaran

Runtime memilih format keluaran dari permukaan target. Penyedia saat ini tidak menyintesis format lain.

| Target         | Format      | Ekstensi file | Laju sampel | Flag kompatibel suara |
| -------------- | ----------- | ------------- | ----------- | --------------------- |
| Audio standar  | `wav`       | `.wav`        | penyedia    | tidak                 |
| Catatan suara  | `opus`      | `.opus`       | penyedia    | ya                    |
| Telefoni       | `ulaw_8000` | n/a           | 8 kHz       | n/a                   |

## Urutan pemilihan otomatis

Di antara penyedia TTS yang dikonfigurasi, urutan pemilihan otomatis Gradium adalah `30`. Lihat [Text-to-Speech](/id/tools/tts) untuk cara OpenClaw memilih penyedia aktif ketika `messages.tts.provider` tidak dipasangkan.

## Terkait

- [Text-to-Speech](/id/tools/tts)
- [Ikhtisar Media](/id/tools/media-overview)
