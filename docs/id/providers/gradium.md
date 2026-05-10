---
read_when:
    - Anda menginginkan Gradium untuk teks-ke-ucapan
    - Anda memerlukan kunci API Gradium, suara, atau konfigurasi token direktif
summary: Gunakan teks-ke-ucapan Gradium di OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-05-10T19:50:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c79da6ec63532061a8112965a679f1113bbefcc91ee00def8153dd39b5b5e58
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) adalah penyedia teks-ke-ucapan bawaan untuk OpenClaw. Plugin dapat merender balasan audio normal (WAV), output Opus yang kompatibel dengan catatan suara, dan audio u-law 8 kHz untuk permukaan telepon.

| Properti      | Nilai                                |
| ------------- | ------------------------------------ |
| ID penyedia   | `gradium`                            |
| Autentikasi   | `GRADIUM_API_KEY` atau config `apiKey` |
| URL dasar     | `https://api.gradium.ai` (default)   |
| Suara default | `Emma` (`YTpq7expH9539ERJ`)          |

## Penyiapan

Buat kunci API Gradium, lalu ekspos ke OpenClaw dengan env var atau kunci config.

<Tabs>
  <Tab title="Env var">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="Kunci config">
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

Plugin memeriksa `apiKey` yang telah di-resolve terlebih dahulu dan melakukan fallback ke variabel lingkungan `GRADIUM_API_KEY`.

## Config

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          voiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

| Kunci                                    | Tipe   | Deskripsi                                                                                   |
| ---------------------------------------- | ------ | ------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`  | string | Kunci API yang telah di-resolve. Mendukung `${ENV}` dan referensi rahasia.                  |
| `messages.tts.providers.gradium.baseUrl` | string | Mengganti origin API. Garis miring penutup dihapus. Default ke `https://api.gradium.ai`.    |
| `messages.tts.providers.gradium.voiceId` | string | ID suara default yang digunakan saat tidak ada penggantian direktif.                        |

Format audio output dipilih secara otomatis oleh runtime berdasarkan permukaan target dan tidak dapat dikonfigurasi dari `openclaw.json`. Lihat [Output](#output) di bawah.

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

### Penggantian suara per pesan

Saat kebijakan ucapan aktif mengizinkan penggantian suara, Anda dapat mengganti suara secara inline menggunakan token direktif. Semua ini di-resolve ke penggantian `voiceId` yang sama:

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

Jika kebijakan ucapan menonaktifkan penggantian suara, direktif akan dikonsumsi tetapi diabaikan.

## Output

Runtime memilih format output dari permukaan target. Penyedia tidak mensintesis format lain saat ini.

| Target         | Format      | Ekstensi file | Laju sampel | Flag kompatibel suara |
| -------------- | ----------- | ------------- | ----------- | --------------------- |
| Audio standar  | `wav`       | `.wav`        | penyedia    | tidak                 |
| Catatan suara  | `opus`      | `.opus`       | penyedia    | ya                    |
| Telepon        | `ulaw_8000` | n/a           | 8 kHz       | n/a                   |

## Urutan pemilihan otomatis

Di antara penyedia TTS yang dikonfigurasi, urutan pemilihan otomatis Gradium adalah `30`. Lihat [Teks-ke-Ucapan](/id/tools/tts) untuk mengetahui cara OpenClaw memilih penyedia aktif saat `messages.tts.provider` tidak dipin.

## Terkait

- [Teks-ke-Ucapan](/id/tools/tts)
- [Ikhtisar Media](/id/tools/media-overview)
