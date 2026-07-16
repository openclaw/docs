---
read_when:
    - Anda ingin mengubah model default atau melihat status autentikasi penyedia
    - Anda ingin memindai model/penyedia yang tersedia dan men-debug profil autentikasi
summary: Referensi CLI untuk `openclaw models` (status/daftar/atur/pindai, alias, fallback, autentikasi)
title: Model
x-i18n:
    generated_at: "2026-07-16T17:56:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 330598225664ff961ab41bf6358226ad64eb43e941be7f422cfde0fe9d93cea8
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Penemuan, pemindaian, dan konfigurasi model (model default, fallback, profil autentikasi).

Terkait:

- Penyedia + model: [Model](/id/providers/models)
- Konsep pemilihan model + perintah garis miring `/models`: [Konsep model](/id/concepts/models)
- Penyiapan autentikasi penyedia: [Memulai](/id/start/getting-started)

## Perintah umum

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
openclaw models scan
```

Subperintah `status` dan `auth` menerima `--agent <id>` untuk menargetkan agen yang dikonfigurasi; `list`, `scan`, `aliases`, dan `fallbacks`/`image-fallbacks` selalu menggunakan agen default yang dikonfigurasi, sedangkan `set`/`set-image` menolak `--agent` sepenuhnya. Jika dihilangkan, perintah yang mendukung `--agent` menggunakan `OPENCLAW_AGENT_DIR` jika ditetapkan; jika tidak, perintah tersebut menggunakan agen default yang dikonfigurasi.

### Status

`openclaw models status` menampilkan default/fallback yang telah diresolusikan beserta ringkasan autentikasi. Jika snapshot penggunaan penyedia tersedia, bagian status OAuth/kunci API menyertakan rentang penggunaan penyedia dan snapshot kuota. Penyedia rentang penggunaan saat ini: Anthropic, GitHub Copilot, Gemini CLI, OpenAI, MiniMax, Xiaomi, dan z.ai. Autentikasi penggunaan berasal dari hook khusus penyedia jika tersedia; jika tidak, OpenClaw menggunakan fallback berupa kredensial OAuth/kunci API yang cocok dari profil autentikasi, lingkungan, atau konfigurasi.

Dalam keluaran `--json`, `auth.providers` adalah ringkasan penyedia yang mempertimbangkan lingkungan/konfigurasi/penyimpanan, sedangkan `auth.oauth` hanya menunjukkan kondisi profil penyimpanan autentikasi.

Opsi:

| Flag                      | Efek                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `--json`                  | Keluaran JSON; diagnostik profil autentikasi, penyedia, dan startup dikirim ke stderr agar stdout tetap dapat disalurkan ke `jq`. |
| `--plain`                 | Keluaran teks biasa.                                                                                            |
| `--check`                 | Keluar dengan nilai bukan nol jika autentikasi akan kedaluwarsa/sudah kedaluwarsa: `1` = kedaluwarsa/hilang, `2` = akan kedaluwarsa.                             |
| `--probe`                 | Probe langsung terhadap profil autentikasi yang dikonfigurasi. Mengirim permintaan nyata; dapat menggunakan token dan memicu batas laju.            |
| `--probe-provider <name>` | Hanya melakukan probe terhadap satu penyedia.                                                                                      |
| `--probe-profile <id>`    | Melakukan probe terhadap ID profil autentikasi tertentu (dapat diulang atau dipisahkan dengan koma).                                                  |
| `--probe-timeout <ms>`    | Batas waktu per probe.                                                                                            |
| `--probe-concurrency <n>` | Probe serentak.                                                                                            |
| `--probe-max-tokens <n>`  | Token maksimum probe (upaya terbaik).                                                                               |
| `--agent <id>`            | ID agen yang dikonfigurasi; menggantikan `OPENCLAW_AGENT_DIR`.                                                          |

Baris probe dapat berasal dari profil autentikasi, kredensial lingkungan, atau `models.json`. Kelompok status probe: `ok`, `auth`, `rate_limit`, `billing`, `timeout`, `format`, `unknown`, `no_model`.

Kode detail/alasan probe yang dapat muncul ketika probe tidak pernah mencapai panggilan model:

- `excluded_by_auth_order`: profil tersimpan tersedia, tetapi `auth.order.<provider>` eksplisit tidak menyertakannya, sehingga probe melaporkan pengecualian tersebut alih-alih mencobanya.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`: profil tersedia tetapi tidak memenuhi syarat atau tidak dapat diresolusikan.
- `ineligible_profile`: profil tidak kompatibel dengan konfigurasi penyedia karena alasan lain.
- `no_model`: autentikasi penyedia tersedia, tetapi OpenClaw tidak dapat meresolusikan kandidat model yang dapat diuji untuk penyedia tersebut.

Untuk memecahkan masalah OAuth OpenAI ChatGPT/Codex, `openclaw models status`, `openclaw models auth list --provider openai`, dan `openclaw config get agents.defaults.model --json` adalah cara tercepat untuk memastikan apakah agen memiliki profil OAuth `openai` yang dapat digunakan untuk `openai/*` melalui runtime Codex native. Lihat [penyiapan penyedia OpenAI](/id/providers/openai#check-and-recover-codex-oauth-routing).

### Daftar

`openclaw models list` bersifat hanya-baca: perintah ini membaca konfigurasi, profil autentikasi, status katalog yang ada, dan baris katalog milik penyedia, tetapi tidak pernah menulis ulang `models.json`.

Opsi: `--all` (katalog lengkap), `--local` (filter ke model lokal), `--provider <id>`, `--json`, `--plain`.

Catatan:

- Kolom `Auth` bersifat hanya-baca. Untuk rute model milik penyedia seperti OpenAI, kolom ini mencocokkan rute API/URL dasar setiap baris dengan profil yang memenuhi syarat dalam `auth.order` efektif, kredensial lingkungan/konfigurasi, dan SecretRef cakupan perintah yang telah diresolusikan. Baris OpenAI konkret tetap tidak diketahui jika kebijakan rutenya tidak tersedia, alih-alih menggunakan autentikasi tingkat penyedia; pemeriksaan lama khusus penyedia dan penyedia lain tetap mempertahankan perilaku tingkat penyedia. Metadata autentikasi sintetis Plugin hanya merupakan petunjuk kemampuan runtime, bukan bukti autentikasi akun native, sehingga rute yang bergantung pada akun tetap tidak diketahui tanpa bukti registri positif. Perintah ini tidak memuat runtime penyedia, membaca rahasia rantai kunci, memanggil API penyedia, atau membuktikan kesiapan eksekusi secara tepat.
- `models list --all --provider <id>` dapat menyertakan baris katalog statis milik penyedia dari manifes Plugin atau metadata katalog penyedia bawaan meskipun Anda belum melakukan autentikasi dengan penyedia tersebut. Baris tersebut tetap ditampilkan sebagai tidak tersedia hingga autentikasi yang cocok dikonfigurasi.
- `models list` menjaga bidang kontrol tetap responsif ketika penemuan katalog penyedia berjalan lambat. Tampilan default dan yang dikonfigurasi menggunakan fallback berupa baris model terkonfigurasi atau sintetis setelah menunggu sebentar dan membiarkan penemuan selesai di latar belakang. Gunakan `--all` jika Anda memerlukan katalog lengkap hasil penemuan secara tepat dan bersedia menunggu penemuan penyedia.
- `models list --all` yang luas menggabungkan baris katalog manifes di atas baris registri tanpa memuat hook pelengkap runtime penyedia. Jalur cepat manifes yang difilter berdasarkan penyedia hanya menggunakan penyedia yang ditandai `static`; penyedia yang ditandai `refreshable` tetap didukung registri/cache dan menambahkan baris manifes sebagai pelengkap, sedangkan penyedia yang ditandai `runtime` tetap menggunakan penemuan registri/runtime.
- `models list` menjaga metadata model native dan batas runtime tetap terpisah. Dalam keluaran tabel, `Ctx` menampilkan `contextTokens/contextWindow` ketika batas runtime efektif berbeda dari jendela konteks native; baris JSON menyertakan `contextTokens` ketika penyedia mengekspos batas tersebut.
- Untuk rute milik penyedia, `models list` memproyeksikan satu baris logis penyedia/model ke rute yang dipilih. `Input` dan `Ctx` hanya berasal dari baris katalog rute fisik yang tepat, dengan penggantian logis eksplisit yang dikonfigurasi diterapkan terakhir; pemilihan rute yang belum diresolusikan menampilkan bidang kemampuan yang tidak diketahui, alih-alih meminjam metadata rute lain.
- `models list --provider <id>` memfilter berdasarkan ID penyedia, seperti `moonshot` atau `openai`. Opsi ini tidak menerima label tampilan dari pemilih penyedia interaktif, seperti `Moonshot AI`.
- Referensi model diurai dengan memisahkannya pada `/` **pertama**. Jika ID model menyertakan `/` (gaya OpenRouter), sertakan awalan penyedia (contoh: `openrouter/moonshotai/kimi-k2`).
- Jika penyedia dihilangkan, OpenClaw meresolusikan masukan sebagai alias terlebih dahulu, lalu sebagai kecocokan unik penyedia terkonfigurasi untuk ID model yang tepat tersebut, dan baru kemudian menggunakan fallback berupa penyedia default yang dikonfigurasi disertai peringatan penghentian penggunaan. Jika penyedia tersebut tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw menggunakan fallback berupa penyedia/model terkonfigurasi pertama alih-alih menampilkan default penyedia yang telah dihapus dan usang.
- `models status` dapat menampilkan `marker(<value>)` dalam keluaran autentikasi untuk placeholder nonrahasia (misalnya `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) alih-alih menyamarkannya sebagai rahasia.

### Tetapkan model default/gambar

```bash
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
```

`set` menulis `agents.defaults.model.primary`; `set-image` menulis `agents.defaults.imageModel.primary`. Keduanya menerima `provider/model` atau alias yang dikonfigurasi. `set` juga memperbaiki instalasi Plugin runtime Codex/Copilot ketika model yang baru dipilih memerlukannya; `set-image` tidak. Kedua perintah tersebut tidak menerima `--agent`; keduanya selalu menulis default agen.

### Pindai

`models scan` membaca katalog publik `:free` milik OpenRouter dan memeringkat kandidat untuk digunakan sebagai fallback. Katalog tersebut bersifat publik, sehingga pemindaian khusus metadata tidak memerlukan kunci OpenRouter.

Secara default, OpenClaw mencoba melakukan probe terhadap dukungan alat dan gambar dengan panggilan model langsung. Jika tidak ada kunci OpenRouter yang dikonfigurasi, perintah menggunakan fallback berupa keluaran khusus metadata dan menjelaskan bahwa model `:free` tetap memerlukan `OPENROUTER_API_KEY` untuk probe dan inferensi.

Opsi:

- `--no-probe` (hanya metadata; tanpa pencarian konfigurasi/rahasia)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (permintaan katalog dan batas waktu per probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` dan `--set-image` memerlukan probe langsung; hasil pemindaian khusus metadata hanya bersifat informatif dan tidak diterapkan pada konfigurasi.

## Alias

```bash
openclaw models aliases list [--json] [--plain]
openclaw models aliases add <alias> <model-or-alias>
openclaw models aliases remove <alias>
```

Alias disimpan per entri model sebagai `agents.defaults.models.<key>.alias`. `add` terlebih dahulu meresolusikan `<model-or-alias>` menjadi kunci penyedia/model kanonis, sehingga membuat alias dari sebuah alias akan mengarahkannya ulang, bukan membuat rantai.

## Fallback

```bash
openclaw models fallbacks list [--json] [--plain]
openclaw models fallbacks add <model-or-alias>
openclaw models fallbacks remove <model-or-alias>
openclaw models fallbacks clear
```

Mengelola `agents.defaults.model.fallbacks`. `openclaw models image-fallbacks list|add|remove|clear` mengelola daftar paralel `agents.defaults.imageModel.fallbacks` dengan bentuk subperintah yang sama.

## Profil autentikasi

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth login-github-copilot
openclaw models auth paste-api-key --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token --provider <id>
openclaw models auth order get --provider <id>
openclaw models auth order set --provider <id> <profileIds...>
openclaw models auth order clear --provider <id>
```

`models auth add` adalah pembantu autentikasi interaktif. Pembantu ini dapat meluncurkan alur autentikasi penyedia (OAuth/kunci API) atau memandu Anda untuk menempelkan token secara manual, bergantung pada penyedia yang dipilih.

`models auth list` mencantumkan profil autentikasi tersimpan untuk agen yang dipilih tanpa menampilkan materi rahasia token, kunci API, atau OAuth. Gunakan `--provider <id>` untuk memfilter ke satu penyedia, seperti `openai`, dan `--json` untuk pembuatan skrip.

`models auth login` menjalankan alur autentikasi Plugin penyedia (OAuth/kunci API). Gunakan `openclaw plugins list` untuk melihat penyedia yang terinstal. `login` menerima `--profile-id <id>` untuk penyedia yang mendukung profil bernama saat login (gunakan ini agar beberapa login untuk penyedia yang sama tetap terpisah), `--method <id>` untuk memilih metode autentikasi tertentu, `--device-code` sebagai pintasan untuk `--method device-code`, `--set-default` untuk menerapkan model default yang direkomendasikan penyedia, dan `--force` untuk terlebih dahulu menghapus profil yang ada bagi penyedia tersebut (gunakan saat profil OAuth yang tersimpan dalam cache macet atau Anda ingin beralih akun).

`models auth login-github-copilot` adalah pintasan untuk `models auth login --provider github-copilot --method device` (alur perangkat GitHub); perintah ini menerima `--yes` untuk menimpa profil yang ada tanpa meminta konfirmasi.

Gunakan `openclaw models auth --agent <id> <subcommand>` untuk menulis hasil autentikasi ke penyimpanan agen terkonfigurasi tertentu. Flag induk `--agent` dipatuhi oleh `add`, `list`, `login`, `paste-api-key`, `setup-token`, `paste-token`, `login-github-copilot`, dan `order get`/`set`/`clear`.

Untuk model OpenAI, `--provider openai` secara default menggunakan login akun ChatGPT/Codex. Gunakan `--method api-key` hanya jika Anda ingin menambahkan profil kunci API OpenAI, biasanya sebagai cadangan untuk batas langganan Codex. Jalankan `openclaw doctor --fix` untuk memigrasikan status autentikasi/profil awalan OpenAI Codex lama ke `openai`.

Contoh:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

Catatan:

- `paste-api-key` menerima kunci API yang dibuat di tempat lain, meminta nilai kunci, dan menuliskannya ke id profil default `<provider>:manual` kecuali Anda meneruskan `--profile-id`. Dalam otomatisasi, salurkan kunci melalui stdin, misalnya `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`.
- `setup-token` dan `paste-token` tetap menjadi perintah token generik untuk penyedia yang menyediakan metode autentikasi token.
- `setup-token` memerlukan TTY interaktif dan menjalankan metode autentikasi token penyedia (secara default menggunakan metode `setup-token` penyedia tersebut jika tersedia).
- `paste-token` memerlukan `--provider`, secara default meminta nilai token, dan menuliskannya ke id profil default `<provider>:manual` kecuali Anda meneruskan `--profile-id`. Dalam otomatisasi, salurkan token melalui stdin alih-alih meneruskannya sebagai argumen agar kredensial penyedia tidak muncul dalam riwayat shell atau daftar proses.
- `paste-token --expires-in <duration>` menyimpan waktu kedaluwarsa token absolut dari durasi relatif seperti `365d` atau `12h`.
- Untuk `openai`, kunci API OpenAI dan materi token ChatGPT/OAuth merupakan bentuk autentikasi yang berbeda. Gunakan `paste-api-key` untuk kunci API OpenAI `sk-...` dan `paste-token` hanya untuk materi autentikasi token.
- Anthropic: `setup-token`/`paste-token` merupakan jalur autentikasi OpenClaw yang didukung untuk `anthropic`, tetapi OpenClaw lebih memilih menggunakan kembali CLI Claude (`claude -p`) pada host jika tersedia.
- `auth order get/set/clear` mengelola penggantian urutan profil autentikasi per agen untuk satu penyedia, yang disimpan di `auth-state.json` (terpisah dari kunci konfigurasi `auth.order.<provider>`). `set` menerima satu atau beberapa id profil dalam urutan prioritas; `clear` kembali menggunakan pengurutan konfigurasi/round-robin.

## Terkait

- [Referensi CLI](/id/cli)
- [Pemilihan model](/id/concepts/model-providers)
- [Failover model](/id/concepts/model-failover)
