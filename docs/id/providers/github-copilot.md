---
read_when:
    - Anda ingin menggunakan GitHub Copilot sebagai provider model
    - Anda memerlukan alur `openclaw models auth login-github-copilot`
summary: Masuk ke GitHub Copilot dari OpenClaw menggunakan device flow
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-24T09:23:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b54a063e30e9202c6b9de35a1a3736ef8c36020296215491fb719afe73a0c3e
    source_path: providers/github-copilot.md
    workflow: 15
---

GitHub Copilot adalah asisten coding AI milik GitHub. GitHub Copilot menyediakan akses ke
model Copilot untuk akun dan paket GitHub Anda. OpenClaw dapat menggunakan Copilot sebagai provider model dengan dua cara berbeda.

## Dua cara menggunakan Copilot di OpenClaw

<Tabs>
  <Tab title="Built-in provider (github-copilot)">
    Gunakan alur login perangkat native untuk memperoleh token GitHub, lalu tukarkan menjadi
    token API Copilot saat OpenClaw berjalan. Ini adalah jalur **default** dan paling sederhana
    karena tidak memerlukan VS Code.

    <Steps>
      <Step title="Jalankan perintah login">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Anda akan diminta mengunjungi URL dan memasukkan kode sekali pakai. Biarkan
        terminal tetap terbuka sampai proses selesai.
      </Step>
      <Step title="Tetapkan model default">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        Atau di konfigurasi:

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
    Gunakan ekstensi VS Code **Copilot Proxy** sebagai bridge lokal. OpenClaw berbicara ke
    endpoint `/v1` milik proxy dan menggunakan daftar model yang Anda konfigurasi di sana.

    <Note>
    Pilih ini ketika Anda sudah menjalankan Copilot Proxy di VS Code atau perlu melakukan perutean
    melaluinya. Anda harus mengaktifkan Plugin dan menjaga ekstensi VS Code tetap berjalan.
    </Note>

  </Tab>
</Tabs>

## Flag opsional

| Flag            | Deskripsi                                          |
| --------------- | -------------------------------------------------- |
| `--yes`         | Lewati prompt konfirmasi                           |
| `--set-default` | Juga terapkan model default yang direkomendasikan provider |

```bash
# Lewati konfirmasi
openclaw models auth login-github-copilot --yes

# Login dan tetapkan model default dalam satu langkah
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="Interactive TTY required">
    Alur login perangkat memerlukan TTY interaktif. Jalankan langsung di
    terminal, bukan di skrip non-interaktif atau pipeline CI.
  </Accordion>

  <Accordion title="Model availability depends on your plan">
    Ketersediaan model Copilot bergantung pada paket GitHub Anda. Jika sebuah model
    ditolak, coba ID lain (misalnya `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Transport selection">
    ID model Claude otomatis menggunakan transport Anthropic Messages. Model GPT,
    seri o, dan Gemini tetap menggunakan transport OpenAI Responses. OpenClaw
    memilih transport yang benar berdasarkan referensi model.
  </Accordion>

  <Accordion title="Environment variable resolution order">
    OpenClaw menyelesaikan auth Copilot dari environment variable dengan
    urutan prioritas berikut:

    | Priority | Variable               | Notes                                |
    | -------- | ---------------------- | ------------------------------------ |
    | 1        | `COPILOT_GITHUB_TOKEN` | Prioritas tertinggi, khusus Copilot  |
    | 2        | `GH_TOKEN`             | Token GitHub CLI (fallback)          |
    | 3        | `GITHUB_TOKEN`         | Token GitHub standar (terendah)      |

    Saat beberapa variable diatur, OpenClaw menggunakan yang berprioritas tertinggi.
    Alur login perangkat (`openclaw models auth login-github-copilot`) menyimpan
    tokennya di penyimpanan profil auth dan lebih diutamakan daripada semua environment
    variable.

  </Accordion>

  <Accordion title="Token storage">
    Login menyimpan token GitHub di penyimpanan profil auth dan menukarkannya
    menjadi token API Copilot saat OpenClaw berjalan. Anda tidak perlu mengelola
    token secara manual.
  </Accordion>
</AccordionGroup>

<Warning>
Memerlukan TTY interaktif. Jalankan perintah login langsung di terminal, bukan
di dalam skrip headless atau job CI.
</Warning>

## Embedding pencarian memori

GitHub Copilot juga dapat berfungsi sebagai provider embedding untuk
[pencarian memori](/id/concepts/memory-search). Jika Anda memiliki subscription Copilot dan
sudah login, OpenClaw dapat menggunakannya untuk embedding tanpa API key terpisah.

### Deteksi otomatis

Saat `memorySearch.provider` adalah `"auto"` (default), GitHub Copilot dicoba
pada prioritas 15 -- setelah embedding lokal tetapi sebelum OpenAI dan provider
berbayar lainnya. Jika token GitHub tersedia, OpenClaw menemukan model
embedding yang tersedia dari API Copilot dan memilih yang terbaik secara otomatis.

### Konfigurasi eksplisit

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Opsional: override model yang ditemukan otomatis
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Cara kerjanya

1. OpenClaw menyelesaikan token GitHub Anda (dari env vars atau profil auth).
2. Menukarkannya dengan token API Copilot berumur pendek.
3. Mengkueri endpoint `/models` Copilot untuk menemukan model embedding yang tersedia.
4. Memilih model terbaik (lebih mengutamakan `text-embedding-3-small`).
5. Mengirim permintaan embedding ke endpoint `/embeddings` Copilot.

Ketersediaan model bergantung pada paket GitHub Anda. Jika tidak ada model embedding
yang tersedia, OpenClaw melewati Copilot dan mencoba provider berikutnya.

## Terkait

<CardGroup cols={2}>
  <Card title="Model selection" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, referensi model, dan perilaku failover.
  </Card>
  <Card title="OAuth and auth" href="/id/gateway/authentication" icon="key">
    Detail auth dan aturan penggunaan ulang kredensial.
  </Card>
</CardGroup>
