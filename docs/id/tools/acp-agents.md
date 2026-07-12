---
read_when:
    - Menjalankan harness pengodean melalui ACP
    - Menyiapkan sesi ACP yang terikat pada percakapan di saluran perpesanan
    - Mengikat percakapan saluran pesan ke sesi ACP persisten
    - Pemecahan masalah backend ACP, pengkabelan plugin, atau pengiriman penyelesaian
    - Mengoperasikan perintah /acp dari obrolan
sidebarTitle: ACP agents
summary: Jalankan harness pengodean eksternal (Claude Code, Cursor, Gemini CLI, Codex ACP eksplisit, OpenClaw ACP, OpenCode) melalui backend ACP
title: agen ACP
x-i18n:
    generated_at: "2026-07-12T14:40:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f5a5588710bea3027583bf06587706eb476d3ad1a31b0ef798586fcb895aa9
    source_path: tools/acp-agents.md
    workflow: 16
---

Sesi [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) memungkinkan
OpenClaw menjalankan lingkungan eksekusi pengodean eksternal (Claude Code, Cursor, Copilot, Droid,
OpenClaw ACP, OpenCode, Gemini CLI, dan lingkungan eksekusi ACPX lain yang didukung)
melalui Plugin backend ACP. Setiap peluncuran dilacak sebagai
[tugas latar belakang](/id/automation/tasks).

<Note>
**ACP adalah jalur lingkungan eksekusi eksternal, bukan jalur Codex bawaan.** Plugin
server aplikasi Codex native memiliki kontrol `/codex ...` dan runtime tertanam
`openai/gpt-*` bawaan untuk giliran agen; ACP memiliki kontrol `/acp ...`
dan sesi `sessions_spawn({ runtime: "acp" })`.

Agar Codex atau Claude Code dapat terhubung langsung sebagai klien MCP eksternal ke
percakapan kanal OpenClaw yang ada, gunakan
[`openclaw mcp serve`](/id/cli/mcp), bukan ACP.
</Note>

## Halaman mana yang saya perlukan?

| Anda ingin...                                                                                   | Gunakan                               | Catatan                                                                                                                                                                             |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mengikat atau mengontrol Codex dalam percakapan saat ini                                        | `/codex bind`, `/codex threads`       | Jalur server aplikasi Codex native ketika Plugin `codex` diaktifkan: balasan obrolan terikat, penerusan gambar, model/cepat/izin, penghentian, dan pengarahan. ACP adalah alternatif eksplisit |
| Menjalankan Claude Code, Gemini CLI, Codex ACP eksplisit, atau lingkungan eksekusi eksternal lain _melalui_ OpenClaw | Halaman ini                           | Sesi terikat obrolan, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tugas latar belakang, kontrol runtime                                                                      |
| Mengekspos sesi Gateway OpenClaw _sebagai_ server ACP untuk editor atau klien                    | [`openclaw acp`](/id/cli/acp)            | Mode jembatan: IDE/klien berkomunikasi dengan OpenClaw menggunakan ACP melalui stdio/WebSocket                                                                                       |
| Menggunakan kembali CLI AI lokal sebagai model alternatif khusus teks                           | [Backend CLI](/id/gateway/cli-backends)  | Bukan ACP: tanpa alat OpenClaw, tanpa kontrol ACP, tanpa runtime lingkungan eksekusi                                                                                                 |

## Apakah ini langsung berfungsi?

Ya, setelah memasang Plugin runtime ACP resmi:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Checkout sumber dapat menggunakan Plugin ruang kerja lokal `extensions/acpx` setelah
`pnpm install`. Jalankan `/acp doctor` untuk memeriksa kesiapan.

OpenClaw hanya mengajarkan peluncuran ACP kepada agen ketika ACP **benar-benar dapat digunakan**:
ACP harus diaktifkan, pengiriman tidak boleh dinonaktifkan, sesi saat ini tidak boleh
diblokir sandbox, dan backend runtime harus dimuat serta sehat. Jika
salah satu kondisi gagal, Skills ACP dan panduan ACP `sessions_spawn` tetap disembunyikan
agar agen tidak menyarankan backend yang tidak tersedia.

<AccordionGroup>
  <Accordion title="Kendala saat penggunaan pertama">
    - Jika `plugins.allow` ditetapkan, nilainya menjadi inventaris Plugin yang membatasi dan **harus** menyertakan `acpx`; jika tidak, backend ACP yang terpasang sengaja diblokir (`/acp doctor` melaporkan entri daftar izin yang tidak ada).
    - Adaptor Codex ACP disertakan bersama Plugin `acpx` dan diluncurkan secara lokal jika memungkinkan.
    - Codex ACP berjalan dengan `CODEX_HOME` yang terisolasi. OpenClaw menyalin entri kepercayaan proyek tepercaya beserta konfigurasi perutean model/penyedia yang aman (`model`, `model_provider`, `model_reasoning_effort`, `sandbox_mode`, dan bidang `model_providers.<name>` yang aman) dari konfigurasi Codex hos; autentikasi, notifikasi, dan kait tetap hanya berada dalam konfigurasi hos.
    - Adaptor lingkungan eksekusi target lain dapat diambil sesuai permintaan dengan `npx` saat pertama kali digunakan.
    - Autentikasi vendor harus sudah tersedia pada hos untuk lingkungan eksekusi tersebut.
    - Jika hos tidak memiliki npm atau akses jaringan, pengambilan adaptor saat penggunaan pertama akan gagal hingga tembolok dipanaskan sebelumnya atau adaptor dipasang dengan cara lain.

  </Accordion>
  <Accordion title="Prasyarat runtime">
    ACP meluncurkan proses lingkungan eksekusi eksternal yang sebenarnya. OpenClaw menangani perutean,
    status tugas latar belakang, pengiriman, ikatan, dan kebijakan; lingkungan eksekusi menangani
    proses masuk penyedia, katalog model, perilaku sistem berkas, dan alat natifnya.

    Sebelum menyalahkan OpenClaw, pastikan:

    - `/acp doctor` melaporkan backend yang aktif dan sehat.
    - ID target diizinkan oleh `acp.allowedAgents` ketika daftar izin tersebut ditetapkan.
    - Perintah lingkungan eksekusi dapat dimulai pada hos Gateway.
    - Autentikasi penyedia tersedia untuk lingkungan eksekusi tersebut (`claude`, `codex`, `gemini`, `opencode`, `droid`, dan sebagainya).
    - Model yang dipilih tersedia untuk lingkungan eksekusi tersebut—ID model tidak dapat dipindahkan antarlingkungan eksekusi.
    - `cwd` yang diminta tersedia dan dapat diakses, atau hilangkan `cwd` dan biarkan backend menggunakan nilai bawaannya.
    - Mode izin sesuai dengan pekerjaan. Sesi noninteraktif tidak dapat mengeklik permintaan izin natif, sehingga proses pengodean yang banyak melakukan penulisan/eksekusi biasanya memerlukan profil izin ACPX yang dapat berjalan tanpa antarmuka interaktif.

  </Accordion>
</AccordionGroup>

Alat Plugin OpenClaw dan alat bawaan OpenClaw **tidak** diekspos kepada
lingkungan eksekusi ACP secara bawaan. Aktifkan jembatan MCP eksplisit dalam
[Penyiapan agen ACP](/id/tools/acp-agents-setup) hanya ketika lingkungan eksekusi perlu
memanggil alat tersebut secara langsung.

## Target lingkungan eksekusi yang didukung

Dengan backend `acpx`, gunakan ID berikut sebagai target `/acp spawn <id>` atau
`sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| ID lingkungan eksekusi | Backend umum                                    | Catatan                                                                                         |
| ---------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `claude`               | Adaptor Claude Code ACP                        | Memerlukan autentikasi Claude Code pada hos.                                                    |
| `codex`                | Adaptor Codex ACP                              | Hanya alternatif ACP eksplisit ketika `/codex` native tidak tersedia atau ACP diminta.          |
| `copilot`              | Adaptor GitHub Copilot ACP                     | Memerlukan autentikasi CLI/runtime Copilot.                                                     |
| `cursor`               | Cursor CLI ACP (`cursor-agent acp`)            | Timpa perintah acpx jika instalasi lokal menyediakan titik masuk ACP yang berbeda.               |
| `droid`                | Factory Droid CLI                              | Memerlukan autentikasi Factory/Droid atau `FACTORY_API_KEY` dalam lingkungan lingkungan eksekusi. |
| `fast-agent`           | Adaptor fast-agent-mcp ACP                     | Diambil sesuai permintaan dengan `uvx`.                                                         |
| `gemini`               | Adaptor Gemini CLI ACP                         | Memerlukan autentikasi Gemini CLI atau penyiapan kunci API.                                     |
| `iflow`                | iFlow CLI                                      | Ketersediaan adaptor dan kontrol model bergantung pada CLI yang terpasang.                       |
| `kilocode`             | Kilo Code CLI                                  | Ketersediaan adaptor dan kontrol model bergantung pada CLI yang terpasang.                       |
| `kimi`                 | Kimi/Moonshot CLI                              | Memerlukan autentikasi Kimi/Moonshot pada hos.                                                  |
| `kiro`                 | Kiro CLI                                       | Ketersediaan adaptor dan kontrol model bergantung pada CLI yang terpasang.                       |
| `mux`                  | Adaptor Mux CLI ACP                            | Diambil sesuai permintaan dengan `npx`.                                                         |
| `opencode`             | Adaptor OpenCode ACP                           | Memerlukan autentikasi CLI/penyedia OpenCode.                                                   |
| `openclaw`             | Jembatan Gateway OpenClaw melalui `openclaw acp` | Memungkinkan lingkungan eksekusi yang mendukung ACP berkomunikasi kembali dengan sesi Gateway OpenClaw. |
| `qoder`                | Qoder CLI                                      | Ketersediaan adaptor dan kontrol model bergantung pada CLI yang terpasang.                       |
| `qwen`                 | Qwen Code / Qwen CLI                           | Memerlukan autentikasi yang kompatibel dengan Qwen pada hos.                                    |
| `trae`                 | Adaptor Trae CLI ACP                           | Ketersediaan adaptor dan kontrol model bergantung pada CLI yang terpasang.                       |

`pi` (pi-acp) juga terdaftar dalam backend acpx, tetapi bukan lingkungan eksekusi
pengodean dalam pengertian yang sama seperti target lain di atas.

Alias agen acpx khusus dapat dikonfigurasi dalam acpx itu sendiri, tetapi kebijakan OpenClaw
tetap memeriksa `acp.allowedAgents` dan setiap pemetaan
`agents.list[].runtime.acp.agent` sebelum pengiriman.

## Panduan operasional

Alur cepat `/acp` dari obrolan:

<Steps>
  <Step title="Luncurkan">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, atau
    `/acp spawn codex --bind here` secara eksplisit.
  </Step>
  <Step title="Kerjakan">
    Lanjutkan dalam percakapan atau utas yang terikat (atau targetkan kunci sesi
    secara eksplisit).
  </Step>
  <Step title="Periksa status">
    `/acp status`
  </Step>
  <Step title="Sesuaikan">
    `/acp model <provider/model>`, `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Arahkan">
    Tanpa mengganti konteks: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Hentikan">
    `/acp cancel` (giliran saat ini) atau `/acp close` (sesi + ikatan).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Detail siklus hidup">
    - Peluncuran membuat atau melanjutkan sesi runtime ACP, mencatat metadata ACP dalam penyimpanan sesi OpenClaw, dan dapat membuat tugas latar belakang ketika proses dimiliki induk.
    - Sesi ACP yang dimiliki induk diperlakukan sebagai pekerjaan latar belakang bahkan ketika sesi runtime bersifat persisten; penyelesaian dan pengiriman lintas permukaan dilakukan melalui pemberi notifikasi tugas induk, bukan bertindak seperti sesi obrolan normal yang terlihat oleh pengguna.
    - Pemeliharaan tugas menutup sesi ACP sekali jalan yang terminal atau yatim dan dimiliki induk. Sesi ACP persisten dipertahankan selama ikatan percakapan aktif masih ada; sesi persisten kedaluwarsa tanpa ikatan aktif ditutup agar tidak dapat dilanjutkan secara diam-diam setelah tugas pemilik selesai atau catatan tugasnya hilang.
    - Pesan lanjutan yang terikat dikirim langsung ke sesi ACP hingga ikatan ditutup, kehilangan fokus, diatur ulang, atau kedaluwarsa.
    - Perintah Gateway tetap diproses secara lokal. `/acp ...`, `/status`, dan `/unfocus` tidak pernah dikirim sebagai teks perintah biasa ke lingkungan eksekusi ACP yang terikat.
    - `cancel` membatalkan giliran aktif ketika backend mendukung pembatalan; perintah ini tidak menghapus ikatan atau metadata sesi.
    - `close` mengakhiri sesi ACP dari sudut pandang OpenClaw dan menghapus ikatan. Lingkungan eksekusi mungkin masih menyimpan riwayat upstream-nya sendiri jika mendukung pelanjutan.
    - Plugin acpx membersihkan pohon proses pembungkus dan adaptor milik OpenClaw setelah `close`, serta membersihkan proses yatim ACPX milik OpenClaw yang kedaluwarsa saat Gateway dimulai.
    - Pekerja runtime yang tidak aktif dapat dibersihkan setelah `acp.runtime.ttlMinutes`; metadata sesi yang tersimpan tetap tersedia untuk `/acp sessions`.

  </Accordion>
  <Accordion title="Aturan perutean Codex native">
    Pemicu bahasa alami yang harus diarahkan ke **Plugin Codex native**
    ketika diaktifkan:

    - "Ikat kanal Discord ini ke Codex."
    - "Hubungkan obrolan ini ke utas Codex `<id>`."
    - "Tampilkan utas Codex, lalu ikat utas ini."

    Pengikatan percakapan Codex native adalah jalur kontrol percakapan default.
    Alat dinamis OpenClaw tetap dijalankan melalui OpenClaw, sedangkan alat
    native Codex seperti shell/apply-patch dijalankan di dalam Codex. Untuk
    peristiwa alat native Codex, OpenClaw menyuntikkan relai hook native per giliran
    agar hook plugin dapat memblokir `before_tool_call`, mengamati
    `after_tool_call`, dan merutekan peristiwa `PermissionRequest` Codex melalui
    persetujuan OpenClaw. Hook `Stop` Codex direlai ke
    `before_agent_finalize` OpenClaw, tempat plugin dapat meminta satu lintasan
    model lagi sebelum Codex menyelesaikan jawabannya. Relai ini sengaja tetap
    konservatif: relai tidak mengubah argumen alat native Codex atau menulis
    ulang catatan utas Codex. Gunakan ACP eksplisit hanya jika Anda menginginkan
    model runtime/sesi ACP. Batas dukungan Codex tersemat
    didokumentasikan dalam
    [kontrak dukungan harness Codex v1](/id/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="Panduan ringkas pemilihan model / penyedia / runtime">
    - referensi model Codex lama - rute model OAuth/langganan Codex lama yang diperbaiki oleh doctor.
    - `openai/*` - runtime tersemat app-server Codex native untuk giliran agen OpenAI.
    - `/codex ...` - kontrol percakapan Codex native.
    - `/acp ...` atau `runtime: "acp"` - kontrol ACP/acpx eksplisit.

  </Accordion>
  <Accordion title="Pemicu bahasa alami untuk perutean ACP">
    Pemicu yang harus dirutekan ke runtime ACP:

    - "Jalankan ini sebagai sesi ACP Claude Code sekali jalan dan rangkum hasilnya."
    - "Gunakan Gemini CLI untuk tugas ini dalam sebuah utas, lalu pertahankan tindak lanjut dalam utas yang sama."
    - "Jalankan Codex melalui ACP dalam utas latar belakang."

    OpenClaw memilih `runtime: "acp"`, menentukan `agentId` harness, mengikatnya
    ke percakapan atau utas saat ini jika didukung, dan merutekan tindak lanjut
    ke sesi tersebut hingga ditutup/kedaluwarsa. Codex hanya mengikuti jalur ini
    jika ACP/acpx dinyatakan secara eksplisit atau plugin Codex native tidak
    tersedia untuk operasi yang diminta.

    Untuk `sessions_spawn`, `runtime: "acp"` hanya ditawarkan ketika ACP
    diaktifkan, peminta tidak berada dalam sandbox, dan backend runtime ACP
    telah dimuat. `acp.dispatch.enabled=false` menjeda pengiriman otomatis utas ACP
    tetapi tidak menyembunyikan atau memblokir pemanggilan eksplisit
    `sessions_spawn({ runtime: "acp" })`. Ini menargetkan id harness ACP seperti
    `codex`, `claude`, `droid`, `gemini`, atau `opencode`. Jangan meneruskan id
    agen konfigurasi OpenClaw biasa dari `agents_list` kecuali entri tersebut
    secara eksplisit dikonfigurasi dengan `agents.list[].runtime.type="acp"`;
    jika tidak, gunakan runtime subagen default. Ketika agen OpenClaw
    dikonfigurasi dengan `runtime.type="acp"`, OpenClaw menggunakan
    `runtime.acp.agent` sebagai id harness yang mendasarinya.

  </Accordion>
</AccordionGroup>

## ACP dibandingkan dengan subagen

Gunakan ACP ketika Anda menginginkan runtime harness eksternal. Gunakan
**app-server Codex native** untuk pengikatan/kontrol percakapan Codex ketika
plugin `codex` diaktifkan. Gunakan **subagen** ketika Anda menginginkan
eksekusi terdelegasi native OpenClaw.

| Area             | Sesi ACP                              | Eksekusi subagen                   |
| ---------------- | ------------------------------------- | ---------------------------------- |
| Runtime          | Plugin backend ACP (misalnya acpx)    | Runtime subagen native OpenClaw    |
| Kunci sesi       | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Perintah utama   | `/acp ...`                            | `/subagents ...`                   |
| Alat pemunculan  | `sessions_spawn` dengan `runtime:"acp"` | `sessions_spawn` (runtime default) |

Lihat juga [Subagen](/id/tools/subagents).

## Cara ACP menjalankan Claude Code

Untuk Claude Code melalui ACP, susunannya adalah:

1. Bidang kontrol sesi ACP OpenClaw.
2. Plugin runtime resmi `@openclaw/acpx`.
3. Adaptor ACP Claude.
4. Mekanisme runtime/sesi di sisi Claude.

ACP Claude adalah **sesi harness** dengan kontrol ACP, pelanjutan sesi,
pelacakan tugas latar belakang, serta pengikatan percakapan/utas opsional.

Backend CLI merupakan runtime fallback lokal khusus teks yang terpisah - lihat
[Backend CLI](/id/gateway/cli-backends).

Bagi operator, aturan praktisnya adalah:

- **Menginginkan `/acp spawn`, sesi yang dapat diikat, kontrol runtime, atau pekerjaan harness persisten?** Gunakan ACP.
- **Menginginkan fallback teks lokal sederhana melalui CLI mentah?** Gunakan backend CLI.

## Sesi terikat

### Model mental

- **Permukaan percakapan** - tempat orang terus berbicara (kanal Discord, topik Telegram, percakapan iMessage).
- **Sesi ACP** - status runtime Codex/Claude/Gemini yang tahan lama dan menjadi tujuan perutean OpenClaw.
- **Utas/topik turunan** - permukaan perpesanan tambahan opsional yang hanya dibuat oleh `--thread ...`.
- **Ruang kerja runtime** - lokasi sistem berkas (`cwd`, checkout repositori, ruang kerja backend) tempat harness berjalan. Tidak bergantung pada permukaan percakapan.

### Pengikatan percakapan saat ini

`/acp spawn <harness> --bind here` menyematkan percakapan saat ini ke sesi ACP
yang dimunculkan - tanpa utas turunan, tetap pada permukaan percakapan yang sama.
OpenClaw tetap menangani transportasi, autentikasi, keamanan, dan pengiriman.
Pesan tindak lanjut dalam percakapan tersebut dirutekan ke sesi yang sama;
`/new` dan `/reset` mengatur ulang sesi di tempat; `/acp close` menghapus
pengikatan.

Contoh:

```text
/codex bind                                              # pengikatan Codex native, rutekan pesan berikutnya ke sini
/codex model gpt-5.4                                     # sesuaikan utas Codex native yang terikat
/codex stop                                              # kontrol giliran Codex native yang aktif
/acp spawn codex --bind here                             # fallback ACP eksplisit untuk Codex
/acp spawn codex --thread auto                           # dapat membuat utas/topik turunan dan mengikatnya di sana
/acp spawn codex --bind here --cwd /workspace/repo       # pengikatan percakapan yang sama, Codex berjalan di /workspace/repo
```

<AccordionGroup>
  <Accordion title="Aturan dan eksklusivitas pengikatan">
    - `--bind here` dan `--thread ...` saling eksklusif.
    - `--bind here` hanya berfungsi pada kanal yang menawarkan pengikatan percakapan saat ini; jika tidak, OpenClaw mengembalikan pesan yang jelas bahwa fitur tidak didukung. Pengikatan tetap bertahan setelah Gateway dimulai ulang.
    - Di Discord, `spawnSessions` mengatur pembuatan utas turunan untuk `--thread auto|here` - bukan `--bind here`.
    - Jika Anda memunculkan sesi untuk agen ACP yang berbeda tanpa `--cwd`, OpenClaw secara default mewarisi ruang kerja **agen target**. Jalur warisan yang tidak ada (`ENOENT`/`ENOTDIR`) akan menggunakan default backend; kesalahan akses lainnya (misalnya `EACCES`) ditampilkan sebagai kesalahan pemunculan.
    - Perintah pengelolaan Gateway tetap ditangani secara lokal dalam percakapan terikat - perintah `/acp ...` ditangani oleh OpenClaw meskipun teks tindak lanjut biasa dirutekan ke sesi ACP terikat; `/status` dan `/unfocus` juga tetap ditangani secara lokal setiap kali penanganan perintah diaktifkan untuk permukaan tersebut.

  </Accordion>
  <Accordion title="Sesi yang terikat ke utas">
    Ketika pengikatan utas diaktifkan untuk adaptor kanal:

    - OpenClaw mengikat utas ke sesi ACP target.
    - Pesan tindak lanjut dalam utas tersebut dirutekan ke sesi ACP terikat.
    - Keluaran ACP dikirim kembali ke utas yang sama.
    - Pelepasan fokus/penutupan/pengarsipan/batas waktu tidak aktif atau kedaluwarsa usia maksimum menghapus pengikatan.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status`, dan `/unfocus` adalah perintah Gateway, bukan prompt untuk harness ACP.

    Flag fitur yang diperlukan untuk ACP terikat utas:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` aktif secara default (atur ke `false` untuk menjeda pengiriman otomatis utas ACP; pemanggilan eksplisit `sessions_spawn({ runtime: "acp" })` tetap berfungsi).
    - Pemunculan sesi utas adaptor kanal diaktifkan (default: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Dukungan pengikatan utas bergantung pada adaptor. Jika adaptor kanal aktif
    tidak mendukung pengikatan utas, OpenClaw mengembalikan pesan yang jelas
    bahwa fitur tidak didukung/tidak tersedia.

  </Accordion>
  <Accordion title="Kanal yang mendukung utas">
    - Semua adaptor kanal yang menyediakan kemampuan pengikatan sesi/utas.
    - Dukungan bawaan saat ini: utas/kanal **Discord**, topik **Telegram** (topik forum dalam grup/supergrup dan topik pesan langsung).
    - Kanal plugin dapat menambahkan dukungan melalui antarmuka pengikatan yang sama.

  </Accordion>
</AccordionGroup>

## Pengikatan kanal persisten

Untuk alur kerja non-efemeral, konfigurasikan pengikatan ACP persisten dalam
entri tingkat atas `bindings[]`.

### Model pengikatan

<ParamField path="bindings[].type" type='"acp"'>
  Menandai pengikatan percakapan ACP persisten.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Mengidentifikasi percakapan target. Bentuk per kanal:

- **Kanal/utas Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Kanal/pesan langsung Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Utamakan id Slack yang stabil; pengikatan kanal juga mencocokkan balasan dalam utas kanal tersebut.
- **Topik forum Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **Pesan langsung/grup WhatsApp:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Gunakan nomor E.164 seperti `+15555550123` untuk percakapan langsung dan JID grup WhatsApp seperti `120363424282127706@g.us` untuk grup.
- **Pesan langsung/grup iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Utamakan `chat_id:*` untuk pengikatan grup yang stabil.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Id agen OpenClaw pemilik.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Penggantian ACP opsional.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Label opsional yang ditampilkan kepada operator.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Direktori kerja runtime opsional.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Penggantian backend opsional.
</ParamField>

### Default runtime per agen

Gunakan `agents.list[].runtime` untuk menetapkan default ACP satu kali per agen:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id harness, misalnya `codex` atau `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Urutan prioritas penggantian untuk sesi terikat ACP:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Default ACP global (misalnya `acp.backend`)

### Contoh

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

### Perilaku

- OpenClaw memastikan sesi ACP yang dikonfigurasi tersedia setelah penerimaan khusus saluran dan sebelum digunakan.
- Pesan dalam saluran, topik, atau obrolan tersebut dirutekan ke sesi ACP yang dikonfigurasi.
- Pengikatan ACP yang dikonfigurasi memiliki rute sesinya sendiri. Penyebaran siaran saluran tidak menggantikan sesi ACP yang dikonfigurasi untuk pengikatan yang cocok.
- Dalam percakapan terikat, `/new` dan `/reset` mengatur ulang kunci sesi ACP yang sama secara langsung.
- Pengikatan runtime sementara (misalnya yang dibuat oleh alur fokus utas) tetap berlaku jika ada.
- Untuk pemunculan ACP lintas agen tanpa `cwd` eksplisit, OpenClaw mewarisi ruang kerja agen target dari konfigurasi agen.
- Jalur ruang kerja warisan yang tidak ada kembali ke cwd bawaan backend; kegagalan akses pada jalur yang ada ditampilkan sebagai galat pemunculan.

## Memulai sesi ACP

Dua cara untuk memulai sesi ACP:

<Tabs>
  <Tab title="Dari sessions_spawn">
    Gunakan `runtime: "acp"` untuk memulai sesi ACP dari giliran agen atau
    panggilan alat.

    ```json
    {
      "task": "Open the repo and summarize failing tests",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    Nilai bawaan `runtime` adalah `subagent`, jadi tetapkan `runtime: "acp"` secara eksplisit untuk
    sesi ACP. Jika `agentId` dihilangkan, OpenClaw menggunakan `acp.defaultAgent`
    jika dikonfigurasi. `mode: "session"` memerlukan `thread: true` agar
    percakapan terikat tetap persisten.
    </Note>

  </Tab>
  <Tab title="Dari perintah /acp">
    Gunakan `/acp spawn` untuk kontrol operator eksplisit dari obrolan.

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    Flag utama:

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    Lihat [Perintah garis miring](/id/tools/slash-commands).

  </Tab>
</Tabs>

### Parameter `sessions_spawn`

<ParamField path="task" type="string" required>
  Prompt awal yang dikirim ke sesi ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Harus berupa `"acp"` untuk sesi ACP.
</ParamField>
<ParamField path="agentId" type="string">
  ID harness target ACP. Kembali ke `acp.defaultAgent` jika ditetapkan.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Meminta alur pengikatan utas jika didukung.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` berjalan satu kali; `"session"` bersifat persisten. Jika `thread: true` dan
  `mode` dihilangkan, OpenClaw dapat menggunakan perilaku persisten secara bawaan sesuai
  jalur runtime. `mode: "session"` memerlukan `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Direktori kerja runtime yang diminta (divalidasi oleh kebijakan backend/runtime).
  Jika dihilangkan, pemunculan ACP mewarisi ruang kerja agen target jika dikonfigurasi;
  jalur warisan yang tidak ada kembali ke nilai bawaan backend, sedangkan galat akses
  yang sebenarnya dikembalikan.
</ParamField>
<ParamField path="label" type="string">
  Label yang ditampilkan kepada operator dan digunakan dalam teks sesi/banner.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Melanjutkan sesi ACP yang sudah ada alih-alih membuat sesi baru. Agen
  memutar ulang riwayat percakapannya melalui `session/load`. Memerlukan
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` mengalirkan ringkasan kemajuan proses ACP awal kembali ke sesi
  peminta sebagai peristiwa sistem. Respons yang diterima mencakup `streamLogPath`
  yang menunjuk ke log JSONL dengan cakupan sesi (`<sessionId>.acp-stream.jsonl`) yang
  dapat Anda pantau untuk melihat riwayat relai lengkap. Aliran kemajuan induk menampilkan
  komentar asisten dan kemajuan status ACP secara bawaan kecuali
  `streaming.progress.commentary=false`. Discord juga secara bawaan mengatur pratinjau
  induk ke mode kemajuan jika tidak ada mode aliran yang dikonfigurasi. Kemajuan
  status tetap mematuhi `acp.stream.tagVisibility`, sehingga tag seperti `plan`
  tetap tersembunyi kecuali diaktifkan secara eksplisit.
</ParamField>

Proses `sessions_spawn` ACP menggunakan `agents.defaults.subagents.runTimeoutSeconds`
sebagai batas bawaan giliran turunannya. Alat ini tidak menerima penggantian batas waktu
per panggilan (`runTimeoutSeconds`/`timeoutSeconds` ditolak dengan galat yang meminta
konfigurasi nilai bawaan).

<ParamField path="model" type="string">
  Penggantian model eksplisit untuk sesi turunan ACP. Pemunculan ACP Codex
  menormalkan referensi OpenAI seperti `openai/gpt-5.4` menjadi konfigurasi awal ACP Codex
  sebelum `session/new`; bentuk dengan garis miring seperti `openai/gpt-5.4/high` juga menetapkan
  tingkat upaya penalaran ACP Codex. Jika dihilangkan, `sessions_spawn({ runtime: "acp" })`
  menggunakan nilai bawaan model subagen yang sudah ada (`agents.defaults.subagents.model` atau
  `agents.list[].subagents.model`) jika dikonfigurasi; jika tidak, harness ACP
  menggunakan model bawaannya sendiri. Harness lain harus mengiklankan `models` ACP
  dan mendukung `session/set_model`; jika tidak, OpenClaw/acpx gagal
  secara jelas alih-alih diam-diam kembali ke nilai bawaan agen target.
</ParamField>
<ParamField path="thinking" type="string">
  Tingkat upaya berpikir/penalaran eksplisit. Untuk ACP Codex, `minimal` dipetakan ke upaya
  rendah, `low`/`medium`/`high`/`xhigh` dipetakan secara langsung, dan `off` menghilangkan
  penggantian tingkat upaya penalaran saat awal. Jika dihilangkan, pemunculan ACP menggunakan
  nilai bawaan berpikir subagen yang sudah ada dan
  `agents.defaults.models["provider/model"].params.thinking` per model untuk model
  yang dipilih.
</ParamField>

## Mode pengikatan dan utas pemunculan

<Tabs>
  <Tab title="--bind here|off">
    | Mode   | Perilaku                                                               |
    | ------ | ----------------------------------------------------------------------- |
    | `here` | Ikat percakapan aktif saat ini secara langsung; gagal jika tidak ada yang aktif. |
    | `off`  | Jangan membuat pengikatan percakapan saat ini.                          |

    Catatan:

    - `--bind here` adalah jalur operator paling sederhana untuk "menjadikan saluran atau obrolan ini didukung Codex."
    - `--bind here` tidak membuat utas turunan.
    - `--bind here` hanya tersedia pada saluran yang menyediakan dukungan pengikatan percakapan saat ini.
    - `--bind` dan `--thread` tidak dapat digabungkan dalam panggilan `/acp spawn` yang sama.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Mode   | Perilaku                                                                                            |
    | ------ | ------------------------------------------------------------------------------------------------- |
    | `auto` | Dalam utas aktif: ikat utas tersebut. Di luar utas: buat/ikat utas turunan jika didukung. |
    | `here` | Wajibkan utas aktif saat ini; gagal jika tidak berada di dalam utas.                                                  |
    | `off`  | Tanpa pengikatan. Sesi dimulai tanpa terikat.                                                                 |

    Catatan:

    - Pada permukaan pengikatan non-utas, perilaku bawaan secara efektif adalah `off`.
    - Pemunculan terikat utas memerlukan dukungan kebijakan saluran:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Gunakan `--bind here` jika Anda ingin menyematkan percakapan saat ini tanpa membuat utas turunan.

  </Tab>
</Tabs>

## Model pengiriman

Sesi ACP dapat berupa ruang kerja interaktif atau pekerjaan latar belakang milik induk.
Jalur pengiriman bergantung pada bentuk tersebut.

<AccordionGroup>
  <Accordion title="Sesi ACP interaktif">
    Sesi interaktif dimaksudkan untuk terus berkomunikasi pada permukaan obrolan yang terlihat:

    - `/acp spawn ... --bind here` mengikat percakapan saat ini ke sesi ACP.
    - `/acp spawn ... --thread ...` mengikat utas/topik saluran ke sesi ACP.
    - `bindings[].type="acp"` terkonfigurasi yang persisten merutekan percakapan yang cocok ke sesi ACP yang sama.

    Pesan lanjutan dalam percakapan terikat dirutekan langsung ke sesi ACP,
    dan keluaran ACP dikirimkan kembali ke
    saluran/utas/topik yang sama.

    Yang dikirim OpenClaw ke harness:

    - Pesan lanjutan terikat normal dikirim sebagai teks prompt, ditambah lampiran hanya jika harness/backend mendukungnya.
    - Perintah pengelolaan `/acp` dan perintah Gateway lokal dicegat sebelum pengiriman ACP.
    - Peristiwa penyelesaian yang dihasilkan runtime diwujudkan per target. Agen OpenClaw menerima pembungkus konteks runtime internal OpenClaw; harness ACP eksternal menerima prompt biasa berisi hasil turunan dan instruksi. Pembungkus mentah `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` tidak boleh dikirim ke harness eksternal atau disimpan sebagai teks transkrip pengguna ACP.
    - Entri transkrip ACP menggunakan teks pemicu yang terlihat oleh pengguna atau prompt penyelesaian biasa. Metadata peristiwa internal tetap terstruktur di OpenClaw jika memungkinkan dan tidak diperlakukan sebagai konten obrolan yang ditulis pengguna.

  </Accordion>
  <Accordion title="Sesi ACP satu kali milik induk">
    Sesi ACP satu kali yang dimunculkan oleh proses agen lain merupakan turunan
    latar belakang, serupa dengan subagen:

    - Induk meminta pekerjaan dengan `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Turunan berjalan dalam sesi harness ACP-nya sendiri.
    - Giliran turunan berjalan pada jalur latar belakang yang sama dengan pemunculan subagen native, sehingga harness ACP yang lambat tidak memblokir pekerjaan sesi utama yang tidak terkait.
    - Penyelesaian dilaporkan kembali melalui jalur pengumuman penyelesaian tugas. OpenClaw mengubah metadata penyelesaian internal menjadi prompt ACP biasa sebelum mengirimkannya ke harness eksternal, sehingga harness tidak melihat penanda konteks runtime khusus OpenClaw.
    - Induk menulis ulang hasil turunan dengan gaya asisten normal jika balasan yang ditampilkan kepada pengguna bermanfaat.

    **Jangan** perlakukan jalur ini sebagai obrolan antarrekan antara induk dan
    turunan. Turunan sudah memiliki saluran penyelesaian kembali ke induk.

  </Accordion>
  <Accordion title="sessions_send dan pengiriman A2A">
    `sessions_send` dapat menargetkan sesi lain setelah pemunculan. Untuk sesi rekan
    normal, OpenClaw menggunakan jalur lanjutan agen-ke-agen (A2A) setelah
    memasukkan pesan:

    - Tunggu balasan sesi target.
    - Secara opsional, izinkan peminta dan target bertukar sejumlah terbatas giliran lanjutan.
    - Minta target menghasilkan pesan pengumuman.
    - Kirimkan pengumuman tersebut ke saluran atau utas yang terlihat.

    Jalur A2A tersebut merupakan fallback untuk pengiriman antar-peer ketika pengirim memerlukan
    tindak lanjut yang terlihat. Jalur ini tetap diaktifkan ketika sesi yang tidak terkait dapat melihat dan
    mengirim pesan ke target ACP, misalnya pada pengaturan
    `tools.sessions.visibility` yang luas.

    OpenClaw melewati tindak lanjut A2A hanya ketika pemohon merupakan induk dari
    proses anak ACP sekali jalan miliknya sendiri yang dimiliki induk. Dalam kasus tersebut, menjalankan A2A di atas
    penyelesaian tugas dapat membangunkan induk dengan hasil proses anak, meneruskan
    balasan induk kembali ke proses anak, dan menciptakan perulangan gema
    induk/anak. Hasil `sessions_send` melaporkan `delivery.status="skipped"` untuk
    kasus proses anak yang dimiliki tersebut karena jalur penyelesaian sudah bertanggung jawab
    atas hasilnya.

  </Accordion>
  <Accordion title="Melanjutkan sesi yang ada">
    Gunakan `resumeSessionId` untuk melanjutkan sesi ACP sebelumnya alih-alih
    memulai dari awal. Agen memutar ulang riwayat percakapannya melalui
    `session/load`, sehingga agen melanjutkan dengan konteks lengkap dari percakapan sebelumnya.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Kasus penggunaan umum:

    - Alihkan sesi Codex dari laptop ke ponsel Anda—beri tahu agen untuk melanjutkan pekerjaan terakhir Anda.
    - Lanjutkan sesi pengodean yang Anda mulai secara interaktif di CLI, kini secara headless melalui agen Anda.
    - Lanjutkan pekerjaan yang terputus akibat dimulainya ulang Gateway atau batas waktu menganggur.

    Catatan:

    - `resumeSessionId` hanya berlaku ketika `runtime: "acp"`; runtime subagen bawaan mengabaikan bidang khusus ACP ini.
    - `streamTo` hanya berlaku ketika `runtime: "acp"`; runtime subagen bawaan mengabaikan bidang khusus ACP ini.
    - `resumeSessionId` adalah ID pelanjutan ACP/harness yang bersifat lokal pada host, bukan kunci sesi kanal OpenClaw; OpenClaw tetap memeriksa kebijakan pemunculan ACP dan kebijakan agen target sebelum mengirimkan tugas, sedangkan backend ACP atau harness menangani otorisasi untuk memuat ID upstream tersebut.
    - `resumeSessionId` memulihkan riwayat percakapan ACP upstream; `thread` dan `mode` tetap berlaku seperti biasa pada sesi OpenClaw baru yang Anda buat, sehingga `mode: "session"` tetap memerlukan `thread: true`.
    - Agen target harus mendukung `session/load` (Codex dan Claude Code mendukungnya).
    - Jika ID sesi tidak ditemukan, pemunculan gagal dengan galat yang jelas—tanpa fallback diam-diam ke sesi baru.

  </Accordion>
  <Accordion title="Uji cepat pascapenerapan">
    Setelah menerapkan Gateway, jalankan pemeriksaan langsung menyeluruh alih-alih memercayai
    pengujian unit:

    1. Verifikasi versi dan commit Gateway yang diterapkan pada host target.
    2. Buka sesi jembatan ACPX sementara ke agen aktif.
    3. Minta agen tersebut memanggil `sessions_spawn` dengan `runtime: "acp"`, `agentId: "codex"`, `mode: "run"`, dan tugas `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifikasi `accepted=yes`, `childSessionKey` yang nyata, dan tidak ada galat validator.
    5. Bersihkan sesi jembatan sementara.

    Pertahankan gerbang pada `mode: "run"` dan lewati `streamTo: "parent"`—
    `mode: "session"` yang terikat utas dan jalur relai aliran merupakan tahap integrasi
    terpisah yang lebih lengkap.

  </Accordion>
</AccordionGroup>

## Kompatibilitas sandbox

Sesi ACP saat ini berjalan pada runtime host, **bukan** di dalam sandbox
OpenClaw.

<Warning>
**Batas keamanan:**

- Harness eksternal dapat membaca/menulis sesuai izin CLI-nya sendiri dan `cwd` yang dipilih.
- Kebijakan sandbox OpenClaw **tidak** membungkus eksekusi harness ACP.
- OpenClaw tetap memberlakukan gerbang fitur ACP, agen yang diizinkan, kepemilikan sesi, pengikatan kanal, dan kebijakan pengiriman Gateway.
- Gunakan `runtime: "subagent"` untuk pekerjaan asli OpenClaw yang memberlakukan sandbox.

</Warning>

Batasan saat ini:

- Jika sesi pemohon berada dalam sandbox, pemunculan ACP diblokir baik untuk `sessions_spawn({ runtime: "acp" })` maupun `/acp spawn`.
- `sessions_spawn` dengan `runtime: "acp"` tidak mendukung `sandbox: "require"`.

## Resolusi target sesi

Sebagian besar tindakan `/acp` menerima target sesi opsional (`session-key`,
`session-id`, atau `session-label`).

**Urutan resolusi:**

1. Argumen target eksplisit (atau `--session` untuk `/acp steer`)
   - mencoba kunci
   - kemudian ID sesi berbentuk UUID
   - kemudian label
2. Pengikatan utas saat ini (jika percakapan/utas ini terikat ke sesi ACP).
3. Fallback sesi pemohon saat ini.

Pengikatan percakapan saat ini dan pengikatan utas sama-sama berpartisipasi pada langkah 2.

Jika tidak ada target yang dapat diresolusi, OpenClaw mengembalikan galat yang jelas
(`Unable to resolve session target: ...`).

## Kontrol ACP

| Perintah             | Fungsinya                                                 | Contoh                                                        |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Membuat sesi ACP; pengikatan saat ini atau utas bersifat opsional. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Membatalkan giliran yang sedang berlangsung untuk sesi target. | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Mengirim instruksi pengarahan ke sesi yang sedang berjalan. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Menutup sesi dan melepas pengikatan target utas.          | `/acp close`                                                  |
| `/acp status`        | Menampilkan backend, mode, status, opsi runtime, dan kapabilitas. | `/acp status`                                                 |
| `/acp set-mode`      | Mengatur mode runtime untuk sesi target.                  | `/acp set-mode plan`                                          |
| `/acp set`           | Menulis opsi konfigurasi runtime generik.                 | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Mengatur penggantian direktori kerja runtime.             | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Mengatur profil kebijakan persetujuan.                    | `/acp permissions strict`                                     |
| `/acp timeout`       | Mengatur batas waktu runtime (detik).                     | `/acp timeout 120`                                            |
| `/acp model`         | Mengatur penggantian model runtime.                       | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Menghapus penggantian opsi runtime sesi.                  | `/acp reset-options`                                          |
| `/acp sessions`      | Mencantumkan sesi ACP terbaru dari penyimpanan.           | `/acp sessions`                                               |
| `/acp doctor`        | Menampilkan kesehatan backend, kapabilitas, dan perbaikan yang dapat ditindaklanjuti. | `/acp doctor`                                                 |
| `/acp install`       | Mencetak langkah pemasangan dan pengaktifan deterministik. | `/acp install`                                                |

Kontrol runtime (`spawn`, `cancel`, `steer`, `close`, `status`, `set-mode`,
`set`, `cwd`, `permissions`, `timeout`, `model`, dan `reset-options`) memerlukan
identitas pemilik dari kanal eksternal dan `operator.admin` dari klien
Gateway internal. Pengirim bukan pemilik yang diotorisasi tetap dapat menggunakan `sessions`,
`doctor`, `install`, dan `help`.

`/acp status` menampilkan opsi runtime efektif beserta pengenal sesi tingkat runtime dan
tingkat backend. Galat kontrol yang tidak didukung ditampilkan
dengan jelas ketika backend tidak memiliki suatu kapabilitas. `/acp sessions` membaca penyimpanan
untuk sesi terikat atau sesi pemohon saat ini; token target (`session-key`,
`session-id`, atau `session-label`) diresolusi melalui penemuan sesi Gateway,
termasuk root `session.store` khusus per agen.

### Pemetaan opsi runtime

`/acp` memiliki perintah praktis dan pengatur generik. Operasi yang setara:

| Perintah                     | Dipetakan ke                          | Catatan                                                                                                                                                                                                    |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | kunci konfigurasi runtime `model`    | Untuk ACP Codex, OpenClaw menormalisasi `openai/<model>` menjadi ID model adaptor dan memetakan sufiks penalaran dengan garis miring seperti `openai/gpt-5.4/high` ke `reasoning_effort`.                     |
| `/acp set thinking <level>`  | opsi kanonis `thinking`              | OpenClaw mengirim padanan yang diumumkan backend jika tersedia, dengan memprioritaskan `thinking`, kemudian `effort`, `reasoning_effort`, atau `thought_level`. Untuk ACP Codex, adaptor memetakan nilai ke `reasoning_effort`. |
| `/acp permissions <profile>` | opsi kanonis `permissionProfile`     | OpenClaw mengirim padanan yang diumumkan backend jika tersedia, seperti `approval_policy`, `permission_profile`, `permissions`, atau `permission_mode`.                                                     |
| `/acp timeout <seconds>`     | opsi kanonis `timeoutSeconds`        | OpenClaw mengirim padanan yang diumumkan backend jika tersedia, seperti `timeout` atau `timeout_seconds`.                                                                                                   |
| `/acp cwd <path>`            | penggantian cwd runtime              | Pembaruan langsung.                                                                                                                                                                                        |
| `/acp set <key> <value>`     | generik                              | `key=cwd` menggunakan jalur penggantian cwd.                                                                                                                                                               |
| `/acp reset-options`         | menghapus semua penggantian runtime  | -                                                                                                                                                                                                          |

## Harness acpx, penyiapan plugin, dan izin

Untuk konfigurasi harness acpx (alias Claude Code / Codex / Gemini CLI),
jembatan MCP plugin-tools dan OpenClaw-tools, serta mode izin ACP,
lihat [Agen ACP - penyiapan](/id/tools/acp-agents-setup).

## Pemecahan masalah

| Gejala                                                                                    | Kemungkinan penyebab                                                                                                    | Perbaikan                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                                   | Plugin backend tidak ada, dinonaktifkan, atau diblokir oleh `plugins.allow`.                                            | Instal dan aktifkan Plugin backend, sertakan `acpx` dalam `plugins.allow` saat daftar izin tersebut ditetapkan, lalu jalankan `/acp doctor`.                                     |
| `ACP is disabled by policy (acp.enabled=false)`                                           | ACP dinonaktifkan secara global.                                                                                        | Tetapkan `acp.enabled=true`.                                                                                                                                                     |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`                         | Pengiriman otomatis dari pesan utas biasa dinonaktifkan.                                                               | Tetapkan `acp.dispatch.enabled=true` untuk melanjutkan perutean utas otomatis; pemanggilan eksplisit `sessions_spawn({ runtime: "acp" })` tetap berfungsi.                        |
| `ACP agent "<id>" is not allowed by policy`                                               | Agen tidak ada dalam daftar izin.                                                                                       | Gunakan `agentId` yang diizinkan atau perbarui `acp.allowedAgents`.                                                                                                              |
| `/acp doctor` reports backend not ready right after startup                               | Plugin backend tidak ada, dinonaktifkan, diblokir oleh kebijakan izin/tolak, atau executable yang dikonfigurasi tidak tersedia. | Instal/aktifkan Plugin backend, jalankan kembali `/acp doctor`, dan periksa kesalahan instalasi backend atau kebijakan jika kondisinya tetap tidak sehat.                         |
| Perintah harness tidak ditemukan                                                         | CLI adaptor belum diinstal, Plugin eksternal tidak ada, atau pengambilan `npx` pada penggunaan pertama gagal untuk adaptor non-Codex. | Jalankan `/acp doctor`, instal/lakukan pemanasan awal adaptor pada host Gateway, atau konfigurasikan perintah agen acpx secara eksplisit.                                        |
| Model tidak ditemukan dari harness                                                       | ID model valid untuk penyedia/harness lain, tetapi tidak untuk target ACP ini.                                          | Gunakan model yang tercantum oleh harness tersebut, konfigurasikan model dalam harness, atau hilangkan penggantian tersebut.                                                      |
| Kesalahan autentikasi vendor dari harness                                                | OpenClaw berfungsi dengan baik, tetapi CLI/penyedia target belum masuk.                                                  | Masuk atau berikan kunci penyedia yang diperlukan di lingkungan host Gateway.                                                                                                   |
| `Unable to resolve session target: ...`                                                   | Token kunci/ID/label salah.                                                                                             | Jalankan `/acp sessions`, salin kunci/label yang tepat, lalu coba lagi.                                                                                                          |
| `--bind here requires running /acp spawn inside an active ... conversation`               | `--bind here` digunakan tanpa percakapan aktif yang dapat diikat.                                                       | Beralih ke obrolan/saluran target dan coba lagi, atau gunakan pemunculan tanpa ikatan.                                                                                            |
| `Conversation bindings are unavailable for <channel>.`                                    | Adaptor tidak memiliki kemampuan pengikatan ACP untuk percakapan saat ini.                                             | Gunakan `/acp spawn ... --thread ...` jika didukung, konfigurasikan `bindings[]` tingkat atas, atau beralih ke saluran yang didukung.                                            |
| `--thread here requires running /acp spawn inside an active ... thread`                   | `--thread here` digunakan di luar konteks utas.                                                                         | Beralih ke utas target atau gunakan `--thread auto`/`off`.                                                                                                                       |
| `Only <user-id> can rebind this channel/conversation/thread.`                             | Pengguna lain memiliki target pengikatan aktif.                                                                         | Ikat ulang sebagai pemilik atau gunakan percakapan atau utas lain.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                                          | Adaptor tidak memiliki kemampuan pengikatan utas.                                                                       | Gunakan `--thread off` atau beralih ke adaptor/saluran yang didukung.                                                                                                            |
| `Sandboxed sessions cannot spawn ACP sessions ...`                                        | Runtime ACP berada di sisi host; sesi peminta berada dalam sandbox.                                                     | Gunakan `runtime="subagent"` dari sesi dalam sandbox, atau jalankan pemunculan ACP dari sesi yang tidak berada dalam sandbox.                                                     |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`                   | `sandbox="require"` diminta untuk runtime ACP.                                                                          | Gunakan `runtime="subagent"` jika sandbox diwajibkan, atau gunakan ACP dengan `sandbox="inherit"` dari sesi yang tidak berada dalam sandbox.                                     |
| `Cannot apply --model ... did not advertise model support`                                | Harness target tidak menyediakan peralihan model ACP generik.                                                          | Gunakan harness yang mengiklankan `models`/`session/set_model` ACP, gunakan referensi model ACP Codex, atau konfigurasikan model langsung dalam harness jika memiliki flag startup sendiri. |
| Metadata ACP untuk sesi terikat tidak ada                                                | Metadata sesi ACP sudah usang/dihapus.                                                                                  | Buat ulang dengan `/acp spawn`, lalu ikat ulang/fokuskan utas.                                                                                                                   |
| `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` | `permissionMode` memblokir penulisan/eksekusi dalam sesi ACP noninteraktif.                                             | Tetapkan `plugins.entries.acpx.config.permissionMode` ke `approve-all` dan mulai ulang Gateway. Lihat [Konfigurasi izin](/id/tools/acp-agents-setup#permission-configuration).       |
| Sesi ACP gagal sejak awal dengan sedikit keluaran                                        | Permintaan izin diblokir oleh `permissionMode`/`nonInteractivePermissions`.                                             | Periksa log Gateway untuk `AcpRuntimeError`. Untuk izin penuh, tetapkan `permissionMode=approve-all`; untuk degradasi yang terkendali, tetapkan `nonInteractivePermissions=deny`. |
| Sesi ACP macet tanpa batas setelah pekerjaan selesai                                     | Proses harness telah selesai, tetapi sesi ACP tidak melaporkan penyelesaian.                                            | Perbarui OpenClaw; pembersihan acpx saat ini menghentikan proses wrapper dan adaptor usang milik OpenClaw saat penutupan dan startup Gateway.                                    |
| Harness melihat `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                                   | Amplop peristiwa internal bocor melintasi batas ACP.                                                                    | Perbarui OpenClaw dan jalankan kembali alur penyelesaian; harness eksternal hanya boleh menerima perintah penyelesaian biasa.                                                     |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` merupakan bagian dari
relai hook Codex native, bukan ACP/acpx. Dalam obrolan Codex yang terikat, mulai
sesi baru dengan `/new` atau `/reset`; jika berfungsi sekali lalu muncul kembali pada
pemanggilan alat native berikutnya, mulai ulang app-server Codex atau Gateway OpenClaw
alih-alih mengulangi `/new`. Lihat
[Pemecahan masalah harness Codex](/id/plugins/codex-harness#troubleshooting).
</Note>

## Terkait

- [Agen ACP - penyiapan](/id/tools/acp-agents-setup)
- [Pengiriman agen](/id/tools/agent-send)
- [Backend CLI](/id/gateway/cli-backends)
- [Harness Codex](/id/plugins/codex-harness)
- [Runtime harness Codex](/id/plugins/codex-harness-runtime)
- [Alat sandbox multiagen](/id/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (mode jembatan)](/id/cli/acp)
- [Subagen](/id/tools/subagents)
