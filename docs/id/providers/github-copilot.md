---
read_when:
    - Anda ingin menggunakan GitHub Copilot sebagai penyedia model
    - Anda memerlukan alur `openclaw models auth login-github-copilot`
summary: Masuk ke GitHub Copilot dari OpenClaw menggunakan alur perangkat
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-21T19:20:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5169839322f64b24b194302b61c5bad67c6cb6595989f9a1ef65867d8b68659
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

GitHub Copilot adalah asisten coding AI dari GitHub. Ini menyediakan akses ke model Copilot untuk akun dan paket GitHub Anda. OpenClaw dapat menggunakan Copilot sebagai penyedia model dengan dua cara yang berbeda.

## Dua cara untuk menggunakan Copilot di OpenClaw

<Tabs>
  <Tab title="Built-in provider (github-copilot)">
    Gunakan alur login perangkat bawaan untuk mendapatkan token GitHub, lalu menukarkannya dengan token API Copilot saat OpenClaw berjalan. Ini adalah jalur **default** dan paling sederhana karena tidak memerlukan VS Code.

    <Steps>
      <Step title="Jalankan perintah login">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Anda akan diminta untuk mengunjungi URL dan memasukkan kode sekali pakai. Biarkan terminal tetap terbuka sampai selesai.
      </Step>
      <Step title="Tetapkan model default">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        Atau di config:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.7" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Copilot Proxy plugin (copilot-proxy)">
    Gunakan ekstensi VS Code **Copilot Proxy** sebagai jembatan lokal. OpenClaw berkomunikasi dengan endpoint `/v1` milik proxy dan menggunakan daftar model yang Anda konfigurasi di sana.

    <Note>
    Pilih ini jika Anda sudah menjalankan Copilot Proxy di VS Code atau perlu merutekan melalui itu. Anda harus mengaktifkan Plugin dan menjaga ekstensi VS Code tetap berjalan.
    </Note>

  </Tab>
</Tabs>

## Flag opsional

| Flag            | Deskripsi                                         |
| --------------- | ------------------------------------------------- |
| `--yes`         | Lewati prompt konfirmasi                          |
| `--set-default` | Juga terapkan model default yang direkomendasikan penyedia |

```bash
# Lewati konfirmasi
openclaw models auth login-github-copilot --yes

# Login dan tetapkan model default dalam satu langkah
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="TTY interaktif diperlukan">
    Alur login perangkat memerlukan TTY interaktif. Jalankan langsung di terminal, bukan dalam skrip non-interaktif atau pipeline CI.
  </Accordion>

  <Accordion title="Ketersediaan model bergantung pada paket Anda">
    Ketersediaan model Copilot bergantung pada paket GitHub Anda. Jika suatu model ditolak, coba ID lain (misalnya `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Pemilihan transport">
    ID model Claude menggunakan transport Anthropic Messages secara otomatis. Model GPT, o-series, dan Gemini tetap menggunakan transport OpenAI Responses. OpenClaw memilih transport yang benar berdasarkan ref model.
  </Accordion>

  <Accordion title="Urutan resolusi variabel lingkungan">
    OpenClaw menyelesaikan auth Copilot dari variabel lingkungan dalam urutan prioritas berikut:

    | Prioritas | Variabel              | Catatan                         |
    | --------- | --------------------- | ------------------------------- |
    | 1         | `COPILOT_GITHUB_TOKEN` | Prioritas tertinggi, khusus Copilot |
    | 2         | `GH_TOKEN`            | Token GitHub CLI (fallback)     |
    | 3         | `GITHUB_TOKEN`        | Token GitHub standar (terendah) |

    Saat beberapa variabel ditetapkan, OpenClaw menggunakan yang berprioritas tertinggi. Alur login perangkat (`openclaw models auth login-github-copilot`) menyimpan tokennya di penyimpanan profil auth dan didahulukan daripada semua variabel lingkungan.

  </Accordion>

  <Accordion title="Penyimpanan token">
    Login menyimpan token GitHub di penyimpanan profil auth dan menukarkannya dengan token API Copilot saat OpenClaw berjalan. Anda tidak perlu mengelola token secara manual.
  </Accordion>
</AccordionGroup>

<Warning>
Memerlukan TTY interaktif. Jalankan perintah login langsung di terminal, bukan di dalam skrip headless atau job CI.
</Warning>

## Embedding pencarian memori

GitHub Copilot juga dapat berfungsi sebagai penyedia embedding untuk
[pencarian memori](/id/concepts/memory-search). Jika Anda memiliki langganan Copilot dan sudah login, OpenClaw dapat menggunakannya untuk embedding tanpa API key terpisah.

### Deteksi otomatis

Saat `memorySearch.provider` adalah `"auto"` (default), GitHub Copilot dicoba pada prioritas 15 -- setelah embedding lokal tetapi sebelum OpenAI dan penyedia berbayar lainnya. Jika token GitHub tersedia, OpenClaw menemukan model embedding yang tersedia dari API Copilot dan memilih yang terbaik secara otomatis.

### Config eksplisit

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Opsional: timpa model yang ditemukan secara otomatis
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Cara kerjanya

1. OpenClaw menyelesaikan token GitHub Anda (dari variabel lingkungan atau profil auth).
2. Menukarkannya dengan token API Copilot berumur pendek.
3. Mengueri endpoint Copilot `/models` untuk menemukan model embedding yang tersedia.
4. Memilih model terbaik (mengutamakan `text-embedding-3-small`).
5. Mengirim permintaan embedding ke endpoint Copilot `/embeddings`.

Ketersediaan model bergantung pada paket GitHub Anda. Jika tidak ada model embedding yang tersedia, OpenClaw melewati Copilot dan mencoba penyedia berikutnya.

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="OAuth dan auth" href="/id/gateway/authentication" icon="key">
    Detail auth dan aturan penggunaan ulang kredensial.
  </Card>
</CardGroup>
