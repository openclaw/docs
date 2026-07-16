---
read_when:
    - Mengubah perilaku fallback model atau UX pemilihan
    - Men-debug "model is not allowed" atau fallback penyedia default yang usang
    - Menangani perilaku penggabungan/rahasia models.json
sidebarTitle: Models CLI
summary: Cara OpenClaw menyelesaikan referensi penyedia/model, kunci konfigurasi, dan perintah chat `/model`
title: CLI Model
x-i18n:
    generated_at: "2026-07-16T17:59:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 20a5e4861bdafa1f5ff549fc54968051b653611f1ef05e836df855638a7aa967
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Failover model" href="/id/concepts/model-failover">
    Rotasi profil autentikasi, masa jeda, dan interaksinya dengan fallback.
  </Card>
  <Card title="Penyedia model" href="/id/concepts/model-providers">
    Ikhtisar singkat penyedia dan contoh.
  </Card>
  <Card title="Referensi CLI model" href="/id/cli/models">
    Referensi lengkap perintah dan flag `openclaw models`.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/config-agents#agent-defaults">
    Kunci konfigurasi model, nilai default, dan contoh.
  </Card>
</CardGroup>

Referensi model (`provider/model`) memilih penyedia dan model, bukan runtime agen tingkat rendah.
Jika kebijakan runtime tidak ditetapkan atau `auto`, kebijakan rute milik penyedia OpenAI
dapat memilih Codex hanya untuk rute resmi HTTPS Platform Responses atau ChatGPT Responses
yang sama persis tanpa penggantian permintaan yang ditentukan pengguna; prefiks
`openai/*` saja tidak pernah memilih Codex. Adaptor Completions, endpoint khusus,
dan perilaku permintaan yang ditentukan pengguna tetap menggunakan OpenClaw. Endpoint HTTP
teks biasa resmi ditolak. Lihat [runtime agen implisit OpenAI](/id/providers/openai#implicit-agent-runtime).

Referensi Copilot langganan (`github-copilot/*`) dapat diikutsertakan dalam Plugin runtime agen
GitHub Copilot eksternal, tetapi jalur tersebut selalu eksplisit (tidak pernah
dipilih oleh `auto`). Penggantian runtime ditempatkan pada kebijakan penyedia/model, bukan pada
seluruh agen atau sesi. Pemilihan runtime tidak menentukan penagihan:
kredensial kunci API OpenAI dan langganan ChatGPT/Codex tetap terpisah. Lihat
[Runtime agen](/id/concepts/agent-runtimes) dan
[runtime agen GitHub Copilot](/id/plugins/copilot).

## Urutan pemilihan

<Steps>
  <Step title="Model utama">
    `agents.defaults.model.primary` (atau `agents.defaults.model` sebagai string biasa).
  </Step>
  <Step title="Fallback">
    `agents.defaults.model.fallbacks`, dicoba secara berurutan.
  </Step>
  <Step title="Failover autentikasi">
    Rotasi profil autentikasi berlangsung di dalam penyedia sebelum OpenClaw beralih ke model fallback berikutnya.
  </Step>
</Steps>

Permukaan konfigurasi model terkait:

- `agents.defaults.models` adalah daftar izin/katalog model yang dapat digunakan OpenClaw, beserta aliasnya. Gunakan entri `provider/*` untuk mengizinkan setiap model yang ditemukan dari suatu penyedia tanpa mencantumkannya satu per satu.
- `agents.defaults.utilityModel` adalah model opsional berbiaya lebih rendah untuk tugas internal singkat seperti judul sesi dasbor yang dihasilkan, judul utas/topik saluran yang didukung, dan narasi progres. `agents.list[].utilityModel` per agen menggantikannya. Jika tidak ditetapkan, OpenClaw menggunakan model kecil default yang dideklarasikan oleh penyedia utama jika tersedia (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`); jika tidak, model utama agen digunakan. Tetapkan ke string kosong untuk menonaktifkan perutean utilitas. Tugas utilitas merupakan panggilan model terpisah dan dapat mengirim konten tugas terbatas kepada penyedia model yang dipilih.
- `agents.defaults.imageModel` hanya digunakan ketika model utama tidak dapat menerima gambar.
- `agents.defaults.pdfModel` digunakan oleh alat `pdf`. Jika tidak ditetapkan, alat tersebut menggunakan fallback `imageModel`, lalu model sesi/default yang telah ditentukan.
- `agents.defaults.imageGenerationModel`, `musicGenerationModel`, dan `videoGenerationModel` mendukung alat pembuatan media bersama. Jika tidak ditetapkan, setiap alat menyimpulkan default penyedia yang didukung autentikasi: penyedia default saat ini terlebih dahulu, lalu penyedia terdaftar lainnya untuk kapabilitas tersebut menurut urutan ID penyedia. Tetapkan `agents.defaults.mediaGenerationAutoProviderFallback: false` untuk menonaktifkan inferensi lintas penyedia tersebut sambil mempertahankan fallback eksplisit.
- `agents.list[].model` per agen (beserta binding) menggantikan `agents.defaults.model` — lihat [Perutean multiagen](/id/concepts/multi-agent).

Referensi lengkap kunci, nilai default, dan contoh JSON5: [Referensi konfigurasi](/id/gateway/config-agents#agent-defaults).

## Sumber pemilihan dan keketatan fallback

`provider/model` yang sama berperilaku berbeda bergantung pada asalnya:

| Sumber                                                                  | Perilaku                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default yang dikonfigurasi (`agents.defaults.model.primary`, utama per agen) | Titik awal normal; menggunakan `agents.defaults.model.fallbacks`.                                                                                                                                                                                                 |
| Fallback otomatis                                                       | Status pemulihan sementara, disimpan sebagai `modelOverrideSource: "auto"`. OpenClaw secara berkala menguji ulang model utama asli, menghapus pilihan otomatis setelah pulih, dan mengumumkan transisi fallback/pemulihan satu kali untuk setiap perubahan status.                              |
| Pemilihan sesi pengguna                                                 | Eksak dan ketat. `/model`, pemilih model, `session_status(model=...)`, dan `sessions.patch` menyimpan `modelOverrideSource: "user"`. Jika penyedia/model tersebut tidak dapat dijangkau, proses gagal secara jelas alih-alih beralih ke model lain yang dikonfigurasi. |
| Cron `--model` / payload `model`                                        | Model utama per tugas. Tetap menggunakan fallback yang dikonfigurasi kecuali tugas menyediakan payload `fallbacks` sendiri (`fallbacks: []` memaksakan proses yang ketat).                                                                                                                    |

Aturan pemilihan lainnya:

- Mengubah `agents.defaults.model.primary` tidak menulis ulang penyematan sesi yang sudah ada. Jika status melaporkan `This session is pinned to X; config primary Y will apply to new/unpinned sessions.`, jalankan `/model default` untuk menghapus penyematan.
- Pemilih model default CLI dan daftar izin mematuhi `models.mode: "replace"` dengan hanya mencantumkan `models.providers.*.models`, bukan seluruh katalog bawaan.
- Pemilih model Control UI meminta tampilan model yang dikonfigurasi dari Gateway: `agents.defaults.models` jika ditetapkan (termasuk entri wildcard `provider/*`); jika tidak, `models.providers.*.models` beserta penyedia yang memiliki autentikasi yang dapat digunakan. Seluruh katalog bawaan hanya digunakan untuk tampilan penelusuran eksplisit (`models.list` dengan `view: "all"`, atau `openclaw models list --all`).
- UI inventaris penyedia menggunakan `models.list` dengan `view: "provider-config"` untuk menampilkan baris `models.providers.*.models` yang ditentukan sumber tanpa menerapkan daftar izin pemilih.

Mekanisme lengkap: [Failover model](/id/concepts/model-failover).

## Kebijakan model singkat

- Tetapkan model utama ke model generasi terbaru terkuat yang tersedia bagi Anda.
- Gunakan fallback untuk tugas yang sensitif terhadap biaya/latensi dan percakapan berisiko lebih rendah.
- Untuk agen yang mendukung alat atau input yang tidak tepercaya, hindari tingkatan model yang lebih lama/lemah.

## Orientasi awal

```bash
openclaw onboard
```

Menyiapkan model dan autentikasi untuk penyedia umum tanpa mengedit konfigurasi secara manual, termasuk OAuth langganan OpenAI Codex dan Anthropic (kunci API atau penggunaan kembali Claude CLI).

Jika tidak ada model utama yang dikonfigurasi, penyiapan kunci API OpenAI baru memilih
`openai/gpt-5.6`; ID API langsung tanpa kualifikasi ditentukan ke tingkatan Sol. Penyiapan
OAuth ChatGPT/Codex baru memilih referensi katalog `openai/gpt-5.6-sol` yang eksak.
Autentikasi ulang mempertahankan model utama eksplisit yang sudah ada, termasuk
`openai/gpt-5.5`. Jika GPT-5.6 tidak tersedia untuk akun tersebut, pilih
`openai/gpt-5.5` secara eksplisit; OpenClaw tidak menurunkan tingkatannya secara diam-diam.

## "Model tidak diizinkan" (dan alasan balasan berhenti)

Jika `agents.defaults.models` ditetapkan, nilai tersebut menjadi daftar izin untuk `/model` dan penggantian sesi. Memilih model di luar daftar izin tersebut menghasilkan pesan berikut sebelum balasan normal dibuat:

```text
Model "provider/model" tidak diizinkan. Gunakan /models untuk mencantumkan penyedia, atau /models <provider> untuk mencantumkan model.
Tambahkan dengan: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

Perbaiki dengan menambahkan model ke `agents.defaults.models`, menghapus seluruh daftar izin (hapus kuncinya), atau memilih model dari `/model list`. Jika perintah yang ditolak menyertakan penggantian runtime seperti `/model openai/gpt-5.5 --runtime codex`, perbaiki daftar izin terlebih dahulu, lalu coba kembali perintah `/model ... --runtime ...` yang sama.

Untuk model lokal/GGUF, daftar izin memerlukan referensi lengkap berprefiks penyedia, misalnya `ollama/gemma4:26b` atau `lmstudio/Gemma4-26b-a4-it-gguf` — periksa `openclaw models list --provider <provider>` untuk string yang eksak. Nama file tanpa kualifikasi atau nama tampilan tidak cukup setelah daftar izin aktif.

Untuk membatasi penyedia tanpa mencantumkan setiap model, gunakan entri wildcard `provider/*`:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

`/model`, `/models`, dan pemilih model kemudian hanya menampilkan katalog yang ditemukan untuk penyedia tersebut, dan model baru dapat muncul tanpa mengedit daftar izin. Gabungkan entri `provider/model` eksak dengan entri `provider/*` untuk menyertakan satu model tertentu dari penyedia lain.

Contoh daftar izin dengan alias:

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-6" },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
}
```

<Accordion title="Pengeditan daftar izin yang aman dari CLI">
Gunakan `--merge` untuk perubahan aditif:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` menolak penetapan objek biasa ke `agents.defaults.models`, `models.providers`, atau `models.providers.<id>.models` jika tindakan tersebut akan menghapus entri yang ada; gunakan `--replace` hanya jika nilai baru harus menjadi nilai target yang lengkap. Penyiapan penyedia interaktif dan `openclaw configure --section model` sudah menggabungkan pilihan dalam cakupan penyedia ke daftar izin, sehingga menambahkan penyedia tidak menghapus entri yang tidak terkait; configure mempertahankan `agents.defaults.model.primary` yang sudah ada. Perintah eksplisit seperti `openclaw models auth login --provider <id> --set-default` dan `openclaw models set <model>` tetap mengganti model utama.
</Accordion>

## `/model` dalam percakapan

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model default
/model status
```

- `/model` dan `/model list` menampilkan pemilih bernomor yang ringkas (keluarga model + penyedia yang tersedia); `/model <#>` memilih darinya. Di Discord, tindakan ini membuka menu tarik-turun penyedia/model dengan langkah Submit; di Telegram, pilihan pemilih dibatasi pada sesi dan tidak pernah menulis ulang default persisten agen di `openclaw.json`. `/models add` telah dihentikan dan mengembalikan pesan alih-alih mendaftarkan model dari obrolan.
- `/model` langsung menyimpan pilihan sesi baru. Jika agen sedang tidak aktif, eksekusi berikutnya langsung menggunakannya; jika eksekusi sudah aktif, peralihan diantrekan hingga titik percobaan ulang bersih berikutnya (atau titik berikutnya lagi, jika aktivitas alat atau keluaran balasan sudah dimulai).
- `/model default` menghapus pilihan sesi sehingga kembali mewarisi model utama yang dikonfigurasi.
- Referensi `/model` yang dipilih pengguna berlaku ketat untuk sesi tersebut: jika referensi itu tidak dapat dijangkau, balasan akan gagal secara jelas alih-alih diam-diam beralih melalui `agents.defaults.model.fallbacks`. Default yang dikonfigurasi dan model utama tugas cron tetap menggunakan rantai fallback.
- `/model status` adalah tampilan terperinci: kandidat autentikasi per penyedia, serta (jika dikonfigurasi) endpoint penyedia `baseUrl` beserta mode `api`.
- Referensi model diurai dengan memisahkannya pada `/` pertama; ketik `provider/model`. Jika ID model itu sendiri memuat `/` (gaya OpenRouter), sertakan prefiks penyedia, misalnya `/model openrouter/moonshotai/kimi-k2`. Jika penyedia dihilangkan, OpenClaw mencoba: (1) kecocokan alias, (2) kecocokan unik penyedia yang dikonfigurasi untuk ID model persis tanpa prefiks tersebut, (3) penyedia default yang dikonfigurasi (fallback yang telah dihentikan) — dan jika penyedia tersebut tidak lagi menyediakan model default yang dikonfigurasi, gunakan penyedia/model pertama yang dikonfigurasi sebagai gantinya, agar default penyedia yang telah dihapus dan kedaluwarsa tidak ditampilkan.
- Referensi model dinormalisasi menjadi huruf kecil; selain itu, ID penyedia harus persis, jadi gunakan ID yang diumumkan oleh plugin.

Perilaku dan konfigurasi perintah lengkap: [Perintah garis miring](/id/tools/slash-commands).

## CLI

```bash
openclaw models status
openclaw models list
openclaw models set <provider/model>
openclaw models set-image <provider/model>
openclaw models scan
openclaw models aliases list|add|remove
openclaw models fallbacks list|add|remove|clear
openclaw models image-fallbacks list|add|remove|clear
openclaw models auth list|add|login|paste-api-key|paste-token|setup-token|order
```

`openclaw models` tanpa subperintah merupakan pintasan untuk `models status`, yang juga menampilkan masa kedaluwarsa OAuth untuk profil penyimpanan autentikasi (secara default memperingatkan dalam 24 jam). Flag lengkap, struktur JSON, dan subperintah profil autentikasi: [Referensi CLI model](/id/cli/models).

<AccordionGroup>
  <Accordion title="Pemindaian (model gratis OpenRouter)">
    `openclaw models scan` memeriksa katalog model gratis publik OpenRouter dan dapat menguji kandidat secara langsung untuk dukungan alat dan gambar. Katalog itu sendiri bersifat publik, sehingga pemindaian khusus metadata (`--no-probe`) tidak memerlukan kunci; pengujian langsung dan `--set-default`/`--set-image` memerlukan kunci API OpenRouter (profil autentikasi atau `OPENROUTER_API_KEY`) dan tanpa kunci akan gagal secara tertutup dengan hanya menghasilkan keluaran metadata.

    Hasil diurutkan berdasarkan: dukungan gambar, lalu latensi alat, lalu ukuran konteks, lalu jumlah parameter. Di TTY, hasil yang diuji akan meminta pemilihan fallback secara interaktif; mode noninteraktif memerlukan `--yes` untuk menerima default.

  </Accordion>
</AccordionGroup>

## Registri model (`models.json`)

Penyedia khusus yang dikonfigurasi di bawah `models.providers` ditulis ke `models.json` di dalam direktori agen (default `~/.openclaw/agents/<agentId>/agent/models.json`). Katalog plugin penyedia disimpan secara terpisah sebagai fragmen katalog buatan yang dimiliki plugin dan dimuat secara otomatis. Secara default, file ini digabungkan dengan konfigurasi; tetapkan `models.mode: "replace"` agar hanya menggunakan penyedia yang Anda konfigurasi.

<AccordionGroup>
  <Accordion title="Prioritas mode penggabungan">
    Untuk ID penyedia yang cocok:

    - `baseUrl` yang tidak kosong dan sudah ada di `models.json` agen akan diprioritaskan.
    - `apiKey` yang tidak kosong di `models.json` hanya diprioritaskan jika penyedia tersebut tidak dikelola oleh SecretRef dalam konteks konfigurasi/profil autentikasi saat ini.
    - Nilai `apiKey` yang dikelola oleh SecretRef diperbarui dari penanda sumber alih-alih menyimpan rahasia yang telah diuraikan: nama variabel lingkungan untuk referensi lingkungan, `secretref-managed` untuk referensi file/exec.
    - Nilai header yang dikelola oleh SecretRef diperbarui dengan cara yang sama, menggunakan `secretref-env:ENV_VAR_NAME` untuk referensi lingkungan.
    - `apiKey`/`baseUrl` yang kosong atau tidak ada di `models.json` kembali menggunakan `models.providers` dari konfigurasi.
    - Kolom penyedia lainnya diperbarui dari konfigurasi dan data katalog yang telah dinormalisasi.

  </Accordion>
</AccordionGroup>

Persistensi penanda menjadikan sumber sebagai acuan utama: OpenClaw menulis penanda dari snapshot konfigurasi sumber yang aktif (sebelum resolusi), bukan dari nilai rahasia runtime yang telah diuraikan, setiap kali meregenerasi `models.json` — termasuk melalui jalur yang digerakkan oleh perintah seperti `openclaw agent`.

## Terkait

- [Runtime agen](/id/concepts/agent-runtimes) — OpenClaw, Codex, dan runtime loop agen lainnya
- [Referensi konfigurasi](/id/gateway/config-agents#agent-defaults) — kunci konfigurasi model
- [Pembuatan gambar](/id/tools/image-generation) — konfigurasi model gambar
- [Failover model](/id/concepts/model-failover) — rantai fallback
- [Penyedia model](/id/concepts/model-providers) — perutean penyedia dan autentikasi
- [Referensi CLI model](/id/cli/models) — referensi lengkap perintah dan flag
- [Pembuatan musik](/id/tools/music-generation) — konfigurasi model musik
- [Pembuatan video](/id/tools/video-generation) — konfigurasi model video
