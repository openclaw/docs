---
read_when:
    - Mendiagnosis rotasi profil autentikasi, masa tunggu, atau perilaku peralihan ke model cadangan
    - Memperbarui aturan pengalihan kegagalan untuk profil autentikasi atau model
    - Memahami bagaimana penimpaan model sesi berinteraksi dengan percobaan ulang cadangan
sidebarTitle: Model failover
summary: Cara OpenClaw merotasi profil autentikasi dan beralih ke cadangan antar model
title: Pengalihan model saat gagal
x-i18n:
    generated_at: "2026-05-10T19:31:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65de51fd4916aac8183a10afdfe3e0259cb85442de39e6d50fddf8a95bd420ae
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw menangani kegagalan dalam dua tahap:

1. **Rotasi profil autentikasi** dalam penyedia saat ini.
2. **Model cadangan** ke model berikutnya di `agents.defaults.model.fallbacks`.

Dokumen ini menjelaskan aturan runtime dan data yang mendukungnya.

## Alur runtime

Untuk eksekusi teks normal, OpenClaw mengevaluasi kandidat dalam urutan ini:

<Steps>
  <Step title="Selesaikan status sesi">
    Selesaikan model sesi aktif dan preferensi profil autentikasi.
  </Step>
  <Step title="Bangun rantai kandidat">
    Bangun rantai kandidat model dari pilihan model saat ini dan kebijakan cadangan untuk sumber pilihan tersebut. Default yang dikonfigurasi, model utama pekerjaan cron, dan model cadangan yang dipilih otomatis dapat menggunakan cadangan yang dikonfigurasi; pilihan sesi pengguna eksplisit bersifat ketat.
  </Step>
  <Step title="Coba penyedia saat ini">
    Coba penyedia saat ini dengan aturan rotasi/cooldown profil autentikasi.
  </Step>
  <Step title="Lanjutkan pada kesalahan yang layak failover">
    Jika penyedia tersebut habis dengan kesalahan yang layak failover, pindah ke kandidat model berikutnya.
  </Step>
  <Step title="Persistenkan override cadangan">
    Persistenkan override cadangan yang dipilih sebelum percobaan ulang dimulai agar pembaca sesi lain melihat penyedia/model yang sama yang akan digunakan runner. Override model yang dipersistenkan ditandai `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Rollback secara sempit saat gagal">
    Jika kandidat cadangan gagal, rollback hanya kolom override sesi milik cadangan saat kolom tersebut masih cocok dengan kandidat yang gagal itu.
  </Step>
  <Step title="Lempar FallbackSummaryError jika habis">
    Jika setiap kandidat gagal, lempar `FallbackSummaryError` dengan detail per percobaan dan kedaluwarsa cooldown tercepat ketika diketahui.
  </Step>
</Steps>

Ini sengaja lebih sempit daripada "simpan dan pulihkan seluruh sesi". Runner balasan hanya mempersistenkan kolom pilihan model yang dimilikinya untuk cadangan:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Itu mencegah percobaan ulang cadangan yang gagal menimpa mutasi sesi lain yang lebih baru dan tidak terkait, seperti perubahan `/model` manual atau pembaruan rotasi sesi yang terjadi saat percobaan berjalan.

## Kebijakan sumber pilihan

OpenClaw memisahkan penyedia/model yang dipilih dari alasan pemilihannya. Sumber tersebut mengontrol apakah rantai cadangan diizinkan:

- **Default yang dikonfigurasi**: `agents.defaults.model.primary` menggunakan `agents.defaults.model.fallbacks`.
- **Model utama agen**: `agents.list[].model` bersifat ketat kecuali objek model agen tersebut menyertakan `fallbacks` miliknya sendiri. Gunakan `fallbacks: []` untuk membuat perilaku ketat eksplisit, atau berikan daftar tidak kosong untuk mengikutsertakan agen tersebut ke cadangan model.
- **Override cadangan otomatis**: cadangan runtime menulis `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"`, dan model asal yang dipilih sebelum mencoba ulang. Override otomatis tersebut dapat terus menelusuri rantai cadangan yang dikonfigurasi dan dihapus oleh `/new`, `/reset`, dan `sessions.reset`. Eksekusi Heartbeat tanpa `heartbeat.model` eksplisit juga menghapus override otomatis langsung saat asalnya tidak lagi cocok dengan default terkonfigurasi saat ini.
- **Override sesi pengguna**: `/model`, pemilih model, `session_status(model=...)`, dan `sessions.patch` menulis `modelOverrideSource: "user"`. Itu adalah pilihan sesi yang persis. Jika penyedia/model yang dipilih gagal sebelum menghasilkan balasan, OpenClaw melaporkan kegagalan alih-alih menjawab dari cadangan terkonfigurasi yang tidak terkait.
- **Override sesi lama**: entri sesi lama mungkin memiliki `modelOverride` tanpa `modelOverrideSource`. OpenClaw memperlakukannya sebagai override pengguna agar pilihan lama eksplisit tidak diam-diam dikonversi menjadi perilaku cadangan.
- **Model payload Cron**: `payload.model` / `--model` pekerjaan cron adalah model utama pekerjaan, bukan override sesi pengguna. Itu menggunakan cadangan yang dikonfigurasi kecuali pekerjaan menyediakan `payload.fallbacks`; `payload.fallbacks: []` membuat eksekusi cron ketat.

## Penyimpanan autentikasi (kunci + OAuth)

OpenClaw menggunakan **profil autentikasi** untuk kunci API dan token OAuth.

- Rahasia berada di `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (lama: `~/.openclaw/agent/auth-profiles.json`).
- Status perutean autentikasi runtime berada di `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Konfigurasi `auth.profiles` / `auth.order` adalah **metadata + perutean saja** (tanpa rahasia).
- File OAuth khusus impor lama: `~/.openclaw/credentials/oauth.json` (diimpor ke `auth-profiles.json` pada penggunaan pertama).

Detail selengkapnya: [OAuth](/id/concepts/oauth)

Jenis kredensial:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` untuk beberapa penyedia)

## ID Profil

Login OAuth membuat profil terpisah agar beberapa akun dapat hidup berdampingan.

- Default: `provider:default` ketika email tidak tersedia.
- OAuth dengan email: `provider:<email>` (misalnya `google-antigravity:user@gmail.com`).

Profil berada di `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` di bawah `profiles`.

## Urutan rotasi

Ketika penyedia memiliki beberapa profil, OpenClaw memilih urutan seperti ini:

<Steps>
  <Step title="Konfigurasi eksplisit">
    `auth.order[provider]` (jika disetel).
  </Step>
  <Step title="Profil yang dikonfigurasi">
    `auth.profiles` yang difilter berdasarkan penyedia.
  </Step>
  <Step title="Profil tersimpan">
    Entri di `auth-profiles.json` untuk penyedia.
  </Step>
</Steps>

Jika tidak ada urutan eksplisit yang dikonfigurasi, OpenClaw menggunakan urutan round-robin:

- **Kunci utama:** jenis profil (**OAuth sebelum kunci API**).
- **Kunci sekunder:** `usageStats.lastUsed` (paling lama terlebih dahulu, dalam setiap jenis).
- **Profil cooldown/dinonaktifkan** dipindahkan ke akhir, diurutkan berdasarkan kedaluwarsa tercepat.

### Kelengketan sesi (ramah cache)

OpenClaw **menyematkan profil autentikasi yang dipilih per sesi** untuk menjaga cache penyedia tetap hangat. OpenClaw **tidak** berotasi pada setiap permintaan. Profil yang disematkan digunakan kembali hingga:

- sesi direset (`/new` / `/reset`)
- compaction selesai (jumlah compaction bertambah)
- profil berada dalam cooldown/dinonaktifkan

Pilihan manual melalui `/model …@<profileId>` menetapkan **override pengguna** untuk sesi tersebut dan tidak dirotasi otomatis hingga sesi baru dimulai.

<Note>
Profil yang disematkan otomatis (dipilih oleh router sesi) diperlakukan sebagai **preferensi**: profil tersebut dicoba terlebih dahulu, tetapi OpenClaw dapat berotasi ke profil lain pada batas laju/timeout. Profil yang disematkan pengguna tetap terkunci ke profil tersebut; jika gagal dan cadangan model dikonfigurasi, OpenClaw pindah ke model berikutnya alih-alih berganti profil.
</Note>

### Mengapa OAuth dapat "terlihat hilang"

Jika Anda memiliki profil OAuth dan profil kunci API untuk penyedia yang sama, round-robin dapat beralih di antara keduanya lintas pesan kecuali disematkan. Untuk memaksa satu profil:

- Sematkan dengan `auth.order[provider] = ["provider:profileId"]`, atau
- Gunakan override per sesi melalui `/model …` dengan override profil (ketika didukung oleh UI/permukaan chat Anda).

## Cooldown

Ketika profil gagal karena kesalahan autentikasi/batas laju (atau timeout yang terlihat seperti pembatasan laju), OpenClaw menandainya dalam cooldown dan pindah ke profil berikutnya.

<AccordionGroup>
  <Accordion title="Yang masuk ke bucket batas laju / timeout">
    Bucket batas laju tersebut lebih luas daripada `429` biasa: bucket itu juga mencakup pesan penyedia seperti `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted`, dan batas jendela penggunaan berkala seperti `weekly/monthly limit reached`.

    Kesalahan format/permintaan tidak valid biasanya bersifat terminal karena mencoba ulang payload yang sama akan gagal dengan cara yang sama, sehingga OpenClaw menampilkannya alih-alih merotasi profil autentikasi. Jalur perbaikan-coba-ulang yang dikenal dapat ikut serta secara eksplisit: misalnya kegagalan validasi ID panggilan alat Cloud Code Assist disanitasi dan dicoba ulang sekali melalui kebijakan `allowFormatRetry`. Kesalahan alasan berhenti yang kompatibel dengan OpenAI seperti `Unhandled stop reason: error`, `stop reason: error`, dan `reason: error` diklasifikasikan sebagai sinyal timeout/failover.

    Teks server generik juga dapat masuk ke bucket timeout tersebut ketika sumbernya cocok dengan pola sementara yang dikenal. Misalnya, pesan pembungkus stream pi-ai polos `An unknown error occurred` diperlakukan sebagai layak failover untuk setiap penyedia karena pi-ai memancarkannya ketika stream penyedia berakhir dengan `stopReason: "aborted"` atau `stopReason: "error"` tanpa detail spesifik. Payload JSON `api_error` dengan teks server sementara seperti `internal server error`, `unknown error, 520`, `upstream error`, atau `backend error` juga diperlakukan sebagai timeout yang layak failover.

    Teks upstream generik khusus OpenRouter seperti `Provider returned error` polos diperlakukan sebagai timeout hanya ketika konteks penyedia sebenarnya adalah OpenRouter. Teks cadangan internal generik seperti `LLM request failed with an unknown error.` tetap konservatif dan tidak memicu failover dengan sendirinya.

  </Accordion>
  <Accordion title="Batas retry-after SDK">
    Beberapa SDK penyedia mungkin sebaliknya tidur selama jendela `Retry-After` yang panjang sebelum mengembalikan kontrol ke OpenClaw. Untuk SDK berbasis Stainless seperti Anthropic dan OpenAI, OpenClaw membatasi penantian internal SDK `retry-after-ms` / `retry-after` pada 60 detik secara default dan segera menampilkan respons yang dapat dicoba ulang lebih lama agar jalur failover ini dapat berjalan. Sesuaikan atau nonaktifkan batas dengan `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; lihat [Perilaku percobaan ulang](/id/concepts/retry).
  </Accordion>
  <Accordion title="Cooldown bercakupan model">
    Cooldown batas laju juga dapat bercakupan model:

    - OpenClaw mencatat `cooldownModel` untuk kegagalan batas laju ketika id model yang gagal diketahui.
    - Model saudara pada penyedia yang sama masih dapat dicoba ketika cooldown dibatasi ke model yang berbeda.
    - Jendela penagihan/dinonaktifkan tetap memblokir seluruh profil lintas model.

  </Accordion>
</AccordionGroup>

Cooldown menggunakan backoff eksponensial:

- 1 menit
- 5 menit
- 25 menit
- 1 jam (batas)

Status disimpan di `auth-state.json` di bawah `usageStats`:

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## Penonaktifan penagihan

Kegagalan penagihan/kredit (misalnya "insufficient credits" / "credit balance too low") diperlakukan sebagai layak failover, tetapi biasanya tidak bersifat sementara. Alih-alih cooldown singkat, OpenClaw menandai profil sebagai **dinonaktifkan** (dengan backoff yang lebih panjang) dan berotasi ke profil/penyedia berikutnya.

<Note>
Tidak setiap respons berbentuk penagihan adalah `402`, dan tidak setiap HTTP `402` masuk ke sini. OpenClaw menjaga teks penagihan eksplisit di jalur penagihan bahkan ketika penyedia mengembalikan `401` atau `403`, tetapi pencocok khusus penyedia tetap terbatas pada penyedia pemiliknya (misalnya OpenRouter `403 Key limit exceeded`).

Sementara itu kesalahan `402` sementara untuk jendela penggunaan dan batas pengeluaran organisasi/workspace diklasifikasikan sebagai `rate_limit` ketika pesan terlihat dapat dicoba ulang (misalnya `weekly usage limit exhausted`, `daily limit reached, resets tomorrow`, atau `organization spending limit exceeded`). Kesalahan tersebut tetap berada pada jalur cooldown/failover singkat alih-alih jalur penonaktifan penagihan panjang.
</Note>

Status disimpan di `auth-state.json`:

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

Default:

- Backoff penagihan dimulai pada **5 jam**, berlipat ganda per kegagalan penagihan, dan dibatasi pada **24 jam**.
- Penghitung backoff direset jika profil belum gagal selama **24 jam** (dapat dikonfigurasi).
- Percobaan ulang yang kelebihan beban mengizinkan **1 rotasi profil penyedia yang sama** sebelum cadangan model.
- Percobaan ulang yang kelebihan beban menggunakan **backoff 0 md** secara default.

## Cadangan model

Jika semua profil untuk suatu penyedia gagal, OpenClaw berpindah ke model berikutnya dalam `agents.defaults.model.fallbacks`. Ini berlaku untuk kegagalan autentikasi, batas laju, dan waktu habis yang telah menghabiskan rotasi profil (kesalahan lain tidak memajukan cadangan). Kesalahan penyedia yang tidak mengekspos detail yang cukup tetap diberi label secara presisi dalam status cadangan: `empty_response` berarti penyedia tidak mengembalikan pesan atau status yang dapat digunakan, `no_error_details` berarti penyedia secara eksplisit mengembalikan `Unknown error (no error details in response)`, dan `unclassified` berarti OpenClaw mempertahankan pratinjau mentah tetapi belum ada pengklasifikasi yang cocok.

Kesalahan kelebihan beban dan batas laju ditangani lebih agresif daripada masa jeda penagihan. Secara default, OpenClaw mengizinkan satu percobaan ulang profil autentikasi pada penyedia yang sama, lalu beralih ke cadangan model terkonfigurasi berikutnya tanpa menunggu. Sinyal penyedia sibuk seperti `ModelNotReadyException` masuk ke keranjang kelebihan beban tersebut. Sesuaikan ini dengan `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs`, dan `auth.cooldowns.rateLimitedProfileRotations`.

Ketika sebuah proses dimulai dari primer default yang dikonfigurasi, primer tugas cron, primer agen dengan cadangan eksplisit, atau penggantian cadangan yang dipilih otomatis, OpenClaw dapat menelusuri rantai cadangan terkonfigurasi yang cocok. Primer agen tanpa cadangan eksplisit dan pilihan pengguna eksplisit (misalnya `/model ollama/qwen3.5:27b`, pemilih model, `sessions.patch`, atau penggantian penyedia/model CLI sekali pakai) bersifat ketat: jika penyedia/model tersebut tidak dapat dijangkau atau gagal sebelum menghasilkan balasan, OpenClaw melaporkan kegagalan alih-alih menjawab dari cadangan yang tidak terkait.

### Aturan rantai kandidat

OpenClaw membangun daftar kandidat dari `provider/model` yang saat ini diminta ditambah cadangan terkonfigurasi.

<AccordionGroup>
  <Accordion title="Aturan">
    - Model yang diminta selalu berada di urutan pertama.
    - Cadangan eksplisit yang dikonfigurasi dideduplikasi tetapi tidak difilter oleh daftar model yang diizinkan. Cadangan tersebut diperlakukan sebagai niat operator eksplisit.
    - Jika proses saat ini sudah berada pada cadangan terkonfigurasi dalam keluarga penyedia yang sama, OpenClaw tetap menggunakan seluruh rantai terkonfigurasi.
    - Jika proses saat ini berada pada penyedia yang berbeda dari konfigurasi dan model saat ini belum menjadi bagian dari rantai cadangan terkonfigurasi, OpenClaw tidak menambahkan cadangan terkonfigurasi yang tidak terkait dari penyedia lain.
    - Ketika tidak ada penggantian cadangan eksplisit yang diberikan ke runner cadangan, primer terkonfigurasi ditambahkan di akhir agar rantai dapat kembali menetap pada default normal setelah kandidat sebelumnya habis.
    - Ketika pemanggil memberikan `fallbacksOverride`, runner menggunakan persis model yang diminta ditambah daftar penggantian tersebut. Daftar kosong menonaktifkan cadangan model dan mencegah primer terkonfigurasi ditambahkan sebagai target percobaan ulang tersembunyi.

  </Accordion>
</AccordionGroup>

### Kesalahan yang memajukan cadangan

<Tabs>
  <Tab title="Berlanjut pada">
    - kegagalan autentikasi
    - batas laju dan habisnya masa jeda
    - kesalahan kelebihan beban/penyedia sibuk
    - kesalahan alih gagal berbentuk waktu habis
    - penonaktifan penagihan
    - `LiveSessionModelSwitchError`, yang dinormalisasi menjadi jalur alih gagal agar model tersimpan yang sudah basi tidak membuat loop percobaan ulang luar
    - kesalahan lain yang tidak dikenali ketika masih ada kandidat tersisa

  </Tab>
  <Tab title="Tidak berlanjut pada">
    - penghentian eksplisit yang tidak berbentuk waktu habis/alih gagal
    - kesalahan luapan konteks yang seharusnya tetap berada dalam logika Compaction/percobaan ulang (misalnya `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model`, atau `ollama error: context length exceeded`)
    - kesalahan akhir yang tidak diketahui ketika tidak ada kandidat tersisa

  </Tab>
</Tabs>

### Perilaku lewati masa jeda vs probe

Ketika setiap profil autentikasi untuk suatu penyedia sudah berada dalam masa jeda, OpenClaw tidak otomatis melewati penyedia tersebut selamanya. Ia membuat keputusan per kandidat:

<AccordionGroup>
  <Accordion title="Keputusan per kandidat">
    - Kegagalan autentikasi persisten segera melewati seluruh penyedia.
    - Penonaktifan penagihan biasanya dilewati, tetapi kandidat primer masih dapat diprobe dengan pembatasan agar pemulihan dimungkinkan tanpa memulai ulang.
    - Kandidat primer dapat diprobe mendekati berakhirnya masa jeda, dengan pembatasan per penyedia.
    - Saudara cadangan pada penyedia yang sama dapat dicoba meskipun ada masa jeda ketika kegagalan tampak sementara (`rate_limit`, `overloaded`, atau tidak diketahui). Ini sangat relevan ketika batas laju berskala model dan model saudara mungkin masih dapat pulih segera.
    - Probe masa jeda sementara dibatasi satu per penyedia per proses cadangan agar satu penyedia tidak menghambat cadangan lintas penyedia.

  </Accordion>
</AccordionGroup>

## Penggantian sesi dan peralihan model langsung

Perubahan model sesi adalah status bersama. Runner aktif, perintah `/model`, pembaruan Compaction/sesi, dan rekonsiliasi sesi langsung semuanya membaca atau menulis bagian dari entri sesi yang sama.

Itu berarti percobaan ulang cadangan harus berkoordinasi dengan peralihan model langsung:

- Hanya perubahan model yang digerakkan pengguna secara eksplisit yang menandai peralihan langsung tertunda. Ini mencakup `/model`, `session_status(model=...)`, dan `sessions.patch`.
- Perubahan model yang digerakkan sistem seperti rotasi cadangan, penggantian Heartbeat, atau Compaction tidak pernah menandai peralihan langsung tertunda dengan sendirinya.
- Penggantian model yang digerakkan pengguna diperlakukan sebagai pilihan persis untuk kebijakan cadangan, sehingga penyedia yang dipilih tetapi tidak dapat dijangkau muncul sebagai kegagalan alih-alih disamarkan oleh `agents.defaults.model.fallbacks`.
- Sebelum percobaan ulang cadangan dimulai, runner balasan mempertahankan bidang penggantian cadangan yang dipilih ke entri sesi.
- Penggantian cadangan otomatis tetap dipilih pada giliran berikutnya agar OpenClaw tidak memprobe primer yang diketahui buruk pada setiap pesan. `/new`, `/reset`, dan `sessions.reset` menghapus penggantian bersumber otomatis dan mengembalikan sesi ke default terkonfigurasi.
- `/status` menampilkan model yang dipilih dan, ketika status cadangan berbeda, model cadangan aktif beserta alasannya.
- Rekonsiliasi sesi langsung lebih memilih penggantian sesi yang dipertahankan daripada bidang model runtime yang basi.
- Jika kesalahan peralihan langsung menunjuk ke kandidat berikutnya dalam rantai cadangan aktif, OpenClaw langsung melompat ke model yang dipilih tersebut alih-alih menelusuri kandidat yang tidak terkait terlebih dahulu.
- Jika upaya cadangan gagal, runner hanya mengembalikan bidang penggantian yang ditulisnya, dan hanya jika bidang tersebut masih cocok dengan kandidat yang gagal itu.

Ini mencegah balapan klasik:

<Steps>
  <Step title="Primer gagal">
    Model primer yang dipilih gagal.
  </Step>
  <Step title="Cadangan dipilih di memori">
    Kandidat cadangan dipilih di memori.
  </Step>
  <Step title="Penyimpanan sesi masih menyatakan primer lama">
    Penyimpanan sesi masih mencerminkan primer lama.
  </Step>
  <Step title="Rekonsiliasi langsung membaca status basi">
    Rekonsiliasi sesi langsung membaca status sesi yang basi.
  </Step>
  <Step title="Percobaan ulang tersentak kembali">
    Percobaan ulang tersentak kembali ke model lama sebelum upaya cadangan dimulai.
  </Step>
</Steps>

Penggantian cadangan yang dipertahankan menutup celah itu, dan pengembalian sempit menjaga perubahan sesi manual atau runtime yang lebih baru tetap utuh.

## Observabilitas dan ringkasan kegagalan

`runWithModelFallback(...)` mencatat detail per upaya yang memasok log dan pesan masa jeda yang terlihat pengguna:

- penyedia/model yang dicoba
- alasan (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found`, dan alasan alih gagal serupa)
- status/kode opsional
- ringkasan kesalahan yang dapat dibaca manusia

Log `model_fallback_decision` terstruktur juga menyertakan bidang `fallbackStep*` datar ketika kandidat gagal, dilewati, atau cadangan berikutnya berhasil. Bidang-bidang ini membuat transisi yang dicoba menjadi eksplisit (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) sehingga pengekspor log dan diagnostik dapat merekonstruksi kegagalan primer bahkan ketika cadangan terminal juga gagal.

Ketika setiap kandidat gagal, OpenClaw melempar `FallbackSummaryError`. Runner balasan luar dapat menggunakannya untuk membangun pesan yang lebih spesifik seperti "semua model sementara dibatasi lajunya" dan menyertakan waktu berakhirnya masa jeda terdekat ketika diketahui.

Ringkasan masa jeda tersebut sadar model:

- batas laju berskala model yang tidak terkait diabaikan untuk rantai penyedia/model yang dicoba
- jika blok yang tersisa adalah batas laju berskala model yang cocok, OpenClaw melaporkan waktu berakhir cocok terakhir yang masih memblokir model tersebut

## Konfigurasi terkait

Lihat [Konfigurasi Gateway](/id/gateway/configuration) untuk:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- perutean `agents.defaults.imageModel`

Lihat [Model](/id/concepts/models) untuk ringkasan pemilihan model dan cadangan yang lebih luas.
