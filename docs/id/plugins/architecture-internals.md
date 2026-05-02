---
read_when:
    - Mengimplementasikan hook runtime penyedia, siklus hidup saluran, atau paket pengemasan
    - Men-debug urutan pemuatan Plugin atau status registri
    - Menambahkan kemampuan Plugin baru atau Plugin mesin konteks baru
summary: 'Internal arsitektur Plugin: pipeline pemuatan, registri, hook runtime, rute HTTP, dan tabel referensi'
title: Internal arsitektur Plugin
x-i18n:
    generated_at: "2026-05-02T09:25:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2de741c4b496c7c3dd31dafebf39c4b9a32c5edd71bdd201c14037d9de31718f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Untuk model kemampuan publik, bentuk Plugin, dan kontrak kepemilikan/eksekusi
lihat [Arsitektur Plugin](/id/plugins/architecture). Halaman ini adalah
referensi untuk mekanisme internal: pipeline pemuatan, registri, hook runtime,
rute HTTP Gateway, jalur impor, dan tabel skema.

## Pipeline pemuatan

Saat startup, OpenClaw kurang lebih melakukan ini:

1. menemukan root Plugin kandidat
2. membaca manifes bundle native atau kompatibel dan metadata paket
3. menolak kandidat yang tidak aman
4. menormalkan konfigurasi Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. memutuskan pengaktifan untuk setiap kandidat
6. memuat modul native yang diaktifkan: modul bawaan yang dibangun menggunakan pemuat native;
   source TypeScript lokal pihak ketiga menggunakan fallback darurat Jiti
7. memanggil hook native `register(api)` dan mengumpulkan pendaftaran ke registri Plugin
8. mengekspos registri ke perintah/permukaan runtime

<Note>
`activate` adalah alias legacy untuk `register` — pemuat menyelesaikan mana pun yang ada (`def.register ?? def.activate`) dan memanggilnya pada titik yang sama. Semua Plugin bawaan menggunakan `register`; utamakan `register` untuk Plugin baru.
</Note>

Gerbang keamanan terjadi **sebelum** eksekusi runtime. Kandidat diblokir
ketika entri keluar dari root Plugin, jalur dapat ditulis oleh semua pengguna,
atau kepemilikan jalur tampak mencurigakan untuk Plugin non-bawaan.

### Perilaku berbasis manifes

Manifes adalah sumber kebenaran control plane. OpenClaw menggunakannya untuk:

- mengidentifikasi Plugin
- menemukan channels/skills/skema konfigurasi yang dideklarasikan atau kemampuan bundle
- memvalidasi `plugins.entries.<id>.config`
- memperkaya label/placeholder Control UI
- menampilkan metadata instalasi/katalog
- mempertahankan deskriptor aktivasi dan penyiapan yang murah tanpa memuat runtime Plugin

Untuk Plugin native, modul runtime adalah bagian data plane. Modul ini mendaftarkan
perilaku aktual seperti hook, tool, perintah, atau alur provider.

Blok manifes opsional `activation` dan `setup` tetap berada di control plane.
Keduanya adalah deskriptor metadata saja untuk perencanaan aktivasi dan penemuan penyiapan;
keduanya tidak menggantikan pendaftaran runtime, `register(...)`, atau `setupEntry`.
Konsumen aktivasi live pertama kini menggunakan petunjuk perintah, channel, dan provider manifes
untuk mempersempit pemuatan Plugin sebelum materialisasi registri yang lebih luas:

- pemuatan CLI dipersempit ke Plugin yang memiliki perintah utama yang diminta
- resolusi penyiapan/Plugin channel dipersempit ke Plugin yang memiliki
  id channel yang diminta
- resolusi penyiapan/runtime provider eksplisit dipersempit ke Plugin yang memiliki
  id provider yang diminta
- perencanaan startup Gateway menggunakan `activation.onStartup` untuk impor startup
  eksplisit dan opt-out startup; Plugin tanpa metadata startup hanya dimuat
  melalui pemicu aktivasi yang lebih sempit

Perencana aktivasi mengekspos API hanya-id untuk pemanggil yang ada dan
API rencana untuk diagnostik baru. Entri rencana melaporkan mengapa sebuah Plugin dipilih,
dengan memisahkan petunjuk perencana `activation.*` eksplisit dari fallback kepemilikan manifes
seperti `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, dan hook. Pemisahan alasan itu adalah batas kompatibilitas:
metadata Plugin yang ada tetap berfungsi, sementara kode baru dapat mendeteksi petunjuk luas
atau perilaku fallback tanpa mengubah semantik pemuatan runtime.

Penemuan penyiapan kini mengutamakan id milik deskriptor seperti `setup.providers` dan
`setup.cliBackends` untuk mempersempit Plugin kandidat sebelum fallback ke
`setup-api` untuk Plugin yang masih membutuhkan hook runtime saat penyiapan. Daftar
penyiapan provider menggunakan `providerAuthChoices` manifes, pilihan penyiapan turunan deskriptor,
dan metadata katalog instalasi tanpa memuat runtime provider. `setup.requiresRuntime: false`
eksplisit adalah batas khusus deskriptor; `requiresRuntime` yang dihilangkan mempertahankan
fallback legacy setup-api untuk kompatibilitas. Jika lebih dari satu Plugin yang ditemukan
mengklaim id provider penyiapan atau backend CLI ternormalisasi yang sama, pencarian penyiapan
menolak pemilik ambigu tersebut alih-alih mengandalkan urutan penemuan. Ketika runtime penyiapan
berjalan, diagnostik registri melaporkan drift antara `setup.providers` / `setup.cliBackends`
dan provider atau backend CLI yang didaftarkan oleh setup-api tanpa memblokir Plugin legacy.

### Batas cache Plugin

OpenClaw tidak menyimpan hasil penemuan Plugin atau data registri manifes langsung
di balik jendela waktu wall-clock. Instalasi, edit manifes, dan perubahan jalur muat
harus terlihat pada pembacaan metadata eksplisit berikutnya atau pembangunan ulang snapshot.
Parser file manifes dapat mempertahankan cache tanda tangan file berbatas yang dikunci oleh
jalur manifes yang dibuka, inode, ukuran, dan timestamp; cache itu hanya menghindari
parsing ulang byte yang tidak berubah dan tidak boleh menyimpan jawaban penemuan, registri,
pemilik, atau kebijakan.

Jalur cepat metadata yang aman adalah kepemilikan objek eksplisit, bukan cache tersembunyi.
Hot path startup Gateway sebaiknya meneruskan `PluginMetadataSnapshot` saat ini,
`PluginLookUpTable` turunan, atau registri manifes eksplisit melalui rantai panggilan.
Validasi konfigurasi, auto-enable startup, bootstrap Plugin, dan pemilihan provider
dapat menggunakan ulang objek-objek itu selama objek tersebut merepresentasikan konfigurasi dan
inventaris Plugin saat ini. Pencarian penyiapan tetap merekonstruksi metadata manifes sesuai kebutuhan
kecuali jalur penyiapan spesifik menerima registri manifes eksplisit; pertahankan itu
sebagai fallback jalur dingin alih-alih menambahkan cache pencarian tersembunyi. Ketika input
berubah, bangun ulang dan ganti snapshot alih-alih memutasinya atau menyimpan
salinan historis.
Tampilan atas registri Plugin aktif dan helper bootstrap channel bawaan
sebaiknya dihitung ulang dari registri/root saat ini. Peta berumur pendek tidak masalah
di dalam satu panggilan untuk deduplikasi pekerjaan atau menjaga reentry; peta itu tidak boleh menjadi
cache metadata proses.

Untuk pemuatan Plugin, lapisan cache persisten adalah pemuatan runtime. Lapisan ini dapat menggunakan ulang
status pemuat ketika kode atau artefak terinstal benar-benar dimuat, seperti:

- `PluginLoaderCacheState` dan registri runtime aktif yang kompatibel
- cache jiti/modul dan cache pemuat permukaan publik yang digunakan untuk menghindari impor
  permukaan runtime yang sama berulang kali
- cache filesystem untuk artefak Plugin terinstal
- peta per panggilan berumur pendek untuk normalisasi jalur atau resolusi duplikat

Cache tersebut adalah detail implementasi data plane. Cache tersebut tidak boleh menjawab
pertanyaan control plane seperti "Plugin mana yang memiliki provider ini?" kecuali
pemanggil sengaja meminta pemuatan runtime.

Jangan tambahkan cache persisten atau wall-clock untuk:

- hasil penemuan
- registri manifes langsung
- registri manifes yang direkonstruksi dari indeks Plugin terinstal
- pencarian pemilik provider, supresi model, kebijakan provider, atau metadata
  artefak publik
- jawaban turunan manifes lainnya ketika manifes, indeks terinstal,
  atau jalur muat yang berubah harus terlihat pada pembacaan metadata berikutnya

Pemanggil yang membangun ulang metadata manifes dari indeks Plugin terinstal yang dipersistenkan
merekonstruksi registri itu sesuai kebutuhan. Indeks terinstal adalah state source-plane
yang tahan lama; indeks itu bukan cache metadata dalam proses yang tersembunyi.

## Model registri

Plugin yang dimuat tidak langsung memutasi global core acak. Plugin mendaftar ke
registri Plugin pusat.

Registri melacak:

- record Plugin (identitas, sumber, origin, status, diagnostik)
- tool
- hook legacy dan hook bertipe
- channel
- provider
- handler RPC Gateway
- rute HTTP
- registrar CLI
- layanan latar belakang
- perintah milik Plugin

Fitur core kemudian membaca dari registri itu alih-alih berbicara langsung
dengan modul Plugin. Ini menjaga pemuatan satu arah:

- modul Plugin -> pendaftaran registri
- runtime core -> konsumsi registri

Pemisahan itu penting untuk pemeliharaan. Artinya sebagian besar permukaan core hanya
membutuhkan satu titik integrasi: "baca registri", bukan "beri perlakuan khusus setiap modul
Plugin".

## Callback pengikatan percakapan

Plugin yang mengikat percakapan dapat bereaksi ketika sebuah persetujuan diselesaikan.

Gunakan `api.onConversationBindingResolved(...)` untuk menerima callback setelah permintaan bind
disetujui atau ditolak:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Field payload callback:

- `status`: `"approved"` atau `"denied"`
- `decision`: `"allow-once"`, `"allow-always"`, atau `"deny"`
- `binding`: binding yang diselesaikan untuk permintaan yang disetujui
- `request`: ringkasan permintaan asli, petunjuk detach, id pengirim, dan
  metadata percakapan

Callback ini hanya notifikasi. Callback ini tidak mengubah siapa yang diizinkan mengikat
percakapan, dan berjalan setelah penanganan persetujuan core selesai.

## Hook runtime provider

Plugin provider memiliki tiga lapisan:

- **Metadata manifes** untuk pencarian pra-runtime yang murah:
  `setup.providers[].envVars`, kompatibilitas deprecated `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices`, dan `channelEnvVars`.
- **Hook waktu konfigurasi**: `catalog` (legacy `discovery`) plus
  `applyConfigDefaults`.
- **Hook runtime**: 40+ hook opsional yang mencakup auth, resolusi model,
  pembungkus stream, level thinking, kebijakan replay, dan endpoint penggunaan. Lihat
  daftar lengkap di [Urutan dan penggunaan hook](#hook-order-and-usage).

OpenClaw tetap memiliki loop agent generik, failover, penanganan transkrip, dan
kebijakan tool. Hook ini adalah permukaan extension untuk perilaku khusus provider
tanpa memerlukan transport inferensi kustom penuh.

Gunakan `setup.providers[].envVars` manifes ketika provider memiliki kredensial berbasis env
yang perlu dilihat oleh jalur auth/status/pemilih model generik tanpa
memuat runtime Plugin. `providerAuthEnvVars` yang deprecated masih dibaca oleh
adapter kompatibilitas selama masa deprecation, dan Plugin non-bawaan
yang menggunakannya menerima diagnostik manifes. Gunakan `providerAuthAliases` manifes
ketika satu id provider harus menggunakan ulang env vars, profil auth,
auth berbasis konfigurasi, dan pilihan onboarding API-key milik id provider lain. Gunakan
`providerAuthChoices` manifes ketika permukaan CLI pilihan onboarding/auth perlu mengetahui
id pilihan provider, label grup, dan pengkabelan auth satu-flag sederhana tanpa
memuat runtime provider. Pertahankan `envVars` runtime provider untuk petunjuk
yang menghadap operator seperti label onboarding atau variabel penyiapan OAuth
client-id/client-secret.

Gunakan `channelEnvVars` manifes ketika channel memiliki auth atau penyiapan berbasis env yang
perlu dilihat oleh fallback shell-env generik, pemeriksaan konfigurasi/status, atau prompt penyiapan
tanpa memuat runtime channel.

### Urutan dan penggunaan hook

Untuk Plugin model/provider, OpenClaw memanggil hook dalam urutan kasar ini.
Kolom "Kapan digunakan" adalah panduan keputusan cepat.
Field provider khusus kompatibilitas yang tidak lagi dipanggil OpenClaw, seperti
`ProviderPlugin.capabilities` dan `suppressBuiltInModel`, sengaja tidak
dicantumkan di sini.

| #   | Kait                              | Fungsi                                                                                                         | Kapan digunakan                                                                                                                              |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Menerbitkan konfigurasi penyedia ke `models.providers` selama pembuatan `models.json`                          | Penyedia memiliki katalog atau default URL dasar                                                                                              |
| 2   | `applyConfigDefaults`             | Menerapkan default konfigurasi global milik penyedia selama materialisasi konfigurasi                           | Default bergantung pada mode autentikasi, env, atau semantik keluarga model penyedia                                                          |
| --  | _(pencarian model bawaan)_        | OpenClaw mencoba jalur registri/katalog normal terlebih dahulu                                                  | _(bukan kait Plugin)_                                                                                                                         |
| 3   | `normalizeModelId`                | Menormalkan alias model-id lama atau pratinjau sebelum pencarian                                                | Penyedia bertanggung jawab atas pembersihan alias sebelum resolusi model kanonis                                                              |
| 4   | `normalizeTransport`              | Menormalkan `api` / `baseUrl` keluarga penyedia sebelum perakitan model generik                                 | Penyedia bertanggung jawab atas pembersihan transport untuk id penyedia kustom dalam keluarga transport yang sama                             |
| 5   | `normalizeConfig`                 | Menormalkan `models.providers.<id>` sebelum resolusi runtime/penyedia                                           | Penyedia membutuhkan pembersihan konfigurasi yang seharusnya berada bersama Plugin; helper keluarga Google bawaan juga menopang entri konfigurasi Google yang didukung |
| 6   | `applyNativeStreamingUsageCompat` | Menerapkan penulisan ulang kompatibilitas penggunaan streaming native ke penyedia konfigurasi                   | Penyedia membutuhkan perbaikan metadata penggunaan streaming native yang digerakkan endpoint                                                  |
| 7   | `resolveConfigApiKey`             | Menyelesaikan autentikasi penanda env untuk penyedia konfigurasi sebelum pemuatan autentikasi runtime           | Penyedia memiliki resolusi API-key penanda env milik penyedia; `amazon-bedrock` juga memiliki resolver penanda env AWS bawaan di sini         |
| 8   | `resolveSyntheticAuth`            | Memunculkan autentikasi lokal/self-hosted atau berbasis konfigurasi tanpa menyimpan plaintext                   | Penyedia dapat beroperasi dengan penanda kredensial sintetis/lokal                                                                            |
| 9   | `resolveExternalAuthProfiles`     | Menimpa profil autentikasi eksternal milik penyedia; default `persistence` adalah `runtime-only` untuk kredensial milik CLI/app | Penyedia menggunakan ulang kredensial autentikasi eksternal tanpa menyimpan refresh token yang disalin; deklarasikan `contracts.externalAuthProviders` dalam manifes |
| 10  | `shouldDeferSyntheticProfileAuth` | Menurunkan prioritas placeholder profil sintetis tersimpan di belakang autentikasi berbasis env/konfigurasi     | Penyedia menyimpan profil placeholder sintetis yang tidak boleh menang prioritas                                                              |
| 11  | `resolveDynamicModel`             | Fallback sinkron untuk id model milik penyedia yang belum ada di registri lokal                                 | Penyedia menerima id model upstream arbitrer                                                                                                  |
| 12  | `prepareDynamicModel`             | Pemanasan asinkron, lalu `resolveDynamicModel` berjalan lagi                                                    | Penyedia membutuhkan metadata jaringan sebelum menyelesaikan id yang tidak dikenal                                                            |
| 13  | `normalizeResolvedModel`          | Penulisan ulang akhir sebelum runner tertanam menggunakan model yang telah diselesaikan                         | Penyedia membutuhkan penulisan ulang transport tetapi tetap menggunakan transport inti                                                        |
| 14  | `contributeResolvedModelCompat`   | Menyumbangkan flag kompatibilitas untuk model vendor di balik transport lain yang kompatibel                    | Penyedia mengenali modelnya sendiri pada transport proxy tanpa mengambil alih penyedia                                                        |
| 15  | `normalizeToolSchemas`            | Menormalkan skema alat sebelum runner tertanam melihatnya                                                       | Penyedia membutuhkan pembersihan skema keluarga transport                                                                                     |
| 16  | `inspectToolSchemas`              | Memunculkan diagnostik skema milik penyedia setelah normalisasi                                                 | Penyedia menginginkan peringatan kata kunci tanpa mengajarkan aturan khusus penyedia ke inti                                                  |
| 17  | `resolveReasoningOutputMode`      | Memilih kontrak keluaran penalaran native vs bertag                                                            | Penyedia membutuhkan penalaran/keluaran final bertag, bukan field native                                                                      |
| 18  | `prepareExtraParams`              | Normalisasi parameter permintaan sebelum wrapper opsi stream generik                                            | Penyedia membutuhkan parameter permintaan default atau pembersihan parameter per penyedia                                                     |
| 19  | `createStreamFn`                  | Mengganti sepenuhnya jalur stream normal dengan transport kustom                                                | Penyedia membutuhkan protokol kabel kustom, bukan sekadar wrapper                                                                             |
| 20  | `wrapStreamFn`                    | Wrapper stream setelah wrapper generik diterapkan                                                              | Penyedia membutuhkan wrapper header/body/model kompatibilitas permintaan tanpa transport kustom                                               |
| 21  | `resolveTransportTurnState`       | Melampirkan header atau metadata transport native per giliran                                                   | Penyedia ingin transport generik mengirim identitas giliran native penyedia                                                                   |
| 22  | `resolveWebSocketSessionPolicy`   | Melampirkan header WebSocket native atau kebijakan jeda sesi                                                    | Penyedia ingin transport WS generik menyesuaikan header sesi atau kebijakan fallback                                                          |
| 23  | `formatApiKey`                    | Pemformat profil autentikasi: profil tersimpan menjadi string `apiKey` runtime                                  | Penyedia menyimpan metadata autentikasi tambahan dan membutuhkan bentuk token runtime kustom                                                  |
| 24  | `refreshOAuth`                    | Override refresh OAuth untuk endpoint refresh kustom atau kebijakan kegagalan refresh                           | Penyedia tidak cocok dengan refresher `pi-ai` bersama                                                                                         |
| 25  | `buildAuthDoctorHint`             | Petunjuk perbaikan yang ditambahkan saat refresh OAuth gagal                                                    | Penyedia membutuhkan panduan perbaikan autentikasi milik penyedia setelah kegagalan refresh                                                   |
| 26  | `matchesContextOverflowError`     | Pencocok overflow jendela konteks milik penyedia                                                               | Penyedia memiliki error overflow mentah yang akan terlewat oleh heuristik generik                                                             |
| 27  | `classifyFailoverReason`          | Klasifikasi alasan failover milik penyedia                                                                     | Penyedia dapat memetakan error API/transport mentah ke rate-limit/overload/dll.                                                              |
| 28  | `isCacheTtlEligible`              | Kebijakan cache prompt untuk penyedia proxy/backhaul                                                           | Penyedia membutuhkan gating TTL cache khusus proxy                                                                                            |
| 29  | `buildMissingAuthMessage`         | Pengganti pesan pemulihan autentikasi hilang generik                                                           | Penyedia membutuhkan petunjuk pemulihan autentikasi hilang khusus penyedia                                                                    |
| 30  | `augmentModelCatalog`             | Baris katalog sintetis/final yang ditambahkan setelah discovery                                                | Penyedia membutuhkan baris kompatibilitas maju sintetis di `models list` dan pemilih                                                         |
| 31  | `resolveThinkingProfile`          | Set level `/think` khusus model, label tampilan, dan default                                                   | Penyedia mengekspos tangga berpikir kustom atau label biner untuk model terpilih                                                              |
| 32  | `isBinaryThinking`                | Kait kompatibilitas toggle penalaran aktif/nonaktif                                                            | Penyedia hanya mengekspos thinking biner aktif/nonaktif                                                                                       |
| 33  | `supportsXHighThinking`           | Kait kompatibilitas dukungan penalaran `xhigh`                                                                 | Penyedia menginginkan `xhigh` hanya pada subset model                                                                                         |
| 34  | `resolveDefaultThinkingLevel`     | Kait kompatibilitas level `/think` default                                                                     | Penyedia memiliki kebijakan `/think` default untuk keluarga model                                                                             |
| 35  | `isModernModelRef`                | Pencocok model modern untuk filter profil live dan pemilihan smoke                                             | Penyedia memiliki pencocokan model pilihan live/smoke                                                                                         |
| 36  | `prepareRuntimeAuth`              | Menukar kredensial terkonfigurasi menjadi token/key runtime aktual tepat sebelum inferensi                     | Penyedia membutuhkan pertukaran token atau kredensial permintaan berumur pendek                                                               |
| 37  | `resolveUsageAuth`                | Menentukan kredensial penggunaan/penagihan untuk `/usage` dan permukaan status terkait                         | Penyedia membutuhkan penguraian token penggunaan/kuota khusus atau kredensial penggunaan yang berbeda                                          |
| 38  | `fetchUsageSnapshot`              | Mengambil dan menormalkan cuplikan penggunaan/kuota khusus penyedia setelah autentikasi ditentukan             | Penyedia membutuhkan titik akhir penggunaan khusus penyedia atau pengurai payload                                                              |
| 39  | `createEmbeddingProvider`         | Membangun adaptor embedding milik penyedia untuk memori/pencarian                                              | Perilaku embedding memori dimiliki oleh Plugin penyedia                                                                                        |
| 40  | `buildReplayPolicy`               | Mengembalikan kebijakan replay yang mengontrol penanganan transkrip untuk penyedia                             | Penyedia membutuhkan kebijakan transkrip khusus (misalnya, penghapusan blok berpikir)                                                          |
| 41  | `sanitizeReplayHistory`           | Menulis ulang riwayat replay setelah pembersihan transkrip generik                                             | Penyedia membutuhkan penulisan ulang replay khusus penyedia di luar helper compaction bersama                                                  |
| 42  | `validateReplayTurns`             | Validasi akhir giliran replay atau pembentukan ulang sebelum runner tertanam                                   | Transport penyedia membutuhkan validasi giliran yang lebih ketat setelah sanitasi generik                                                      |
| 43  | `onModelSelected`                 | Menjalankan efek samping pasca-pemilihan milik penyedia                                                        | Penyedia membutuhkan telemetri atau status milik penyedia ketika sebuah model menjadi aktif                                                    |

`normalizeModelId`, `normalizeTransport`, dan `normalizeConfig` pertama-tama memeriksa
Plugin penyedia yang cocok, lalu melanjutkan ke Plugin penyedia lain yang
mendukung hook sampai ada yang benar-benar mengubah id model atau transport/config.
Ini menjaga shim penyedia alias/kompat tetap berfungsi tanpa mengharuskan pemanggil
mengetahui Plugin bawaan mana yang memiliki penulisan ulang tersebut. Jika tidak
ada hook penyedia yang menulis ulang entri konfigurasi keluarga Google yang
didukung, normalizer konfigurasi Google bawaan tetap menerapkan pembersihan
kompatibilitas tersebut.

Jika penyedia membutuhkan protokol wire yang sepenuhnya khusus atau eksekutor
permintaan khusus, itu adalah kelas ekstensi yang berbeda. Hook ini ditujukan
untuk perilaku penyedia yang masih berjalan pada loop inferensi normal OpenClaw.

### Contoh penyedia

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Contoh bawaan

Plugin penyedia bawaan menggabungkan hook di atas agar sesuai dengan kebutuhan
katalog, autentikasi, thinking, replay, dan penggunaan tiap vendor. Set hook
otoritatif berada bersama setiap Plugin di bawah `extensions/`; halaman ini
mengilustrasikan bentuknya, bukan menyalin daftar tersebut.

<AccordionGroup>
  <Accordion title="Penyedia katalog pass-through">
    OpenRouter, Kilocode, Z.AI, xAI mendaftarkan `catalog` plus
    `resolveDynamicModel` / `prepareDynamicModel` agar mereka dapat menampilkan id
    model upstream sebelum katalog statis OpenClaw.
  </Accordion>
  <Accordion title="Penyedia endpoint OAuth dan penggunaan">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai memasangkan
    `prepareRuntimeAuth` atau `formatApiKey` dengan `resolveUsageAuth` +
    `fetchUsageSnapshot` untuk memiliki pertukaran token dan integrasi `/usage`.
  </Accordion>
  <Accordion title="Keluarga replay dan pembersihan transkrip">
    Keluarga bernama bersama (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) memungkinkan penyedia ikut
    ke kebijakan transkrip melalui `buildReplayPolicy`, bukan setiap Plugin
    mengimplementasikan ulang pembersihan.
  </Accordion>
  <Accordion title="Penyedia hanya katalog">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway`, dan
    `volcengine` hanya mendaftarkan `catalog` dan menggunakan loop inferensi bersama.
  </Accordion>
  <Accordion title="Helper stream khusus Anthropic">
    Header beta, `/fast` / `serviceTier`, dan `context1m` berada di dalam seam
    `api.ts` / `contract-api.ts` publik milik Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), bukan di SDK
    generik.
  </Accordion>
</AccordionGroup>

## Helper runtime

Plugin dapat mengakses helper inti tertentu melalui `api.runtime`. Untuk TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Catatan:

- `textToSpeech` mengembalikan payload output TTS inti normal untuk permukaan file/catatan suara.
- Menggunakan konfigurasi inti `messages.tts` dan pemilihan penyedia.
- Mengembalikan buffer audio PCM + laju sampel. Plugin harus melakukan resample/encode untuk penyedia.
- `listVoices` bersifat opsional per penyedia. Gunakan untuk pemilih suara milik vendor atau alur penyiapan.
- Daftar suara dapat menyertakan metadata yang lebih kaya seperti locale, gender, dan tag personality untuk pemilih yang sadar penyedia.
- OpenAI dan ElevenLabs mendukung telephony saat ini. Microsoft tidak.

Plugin juga dapat mendaftarkan penyedia speech melalui `api.registerSpeechProvider(...)`.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Catatan:

- Pertahankan kebijakan TTS, fallback, dan pengiriman balasan di inti.
- Gunakan penyedia speech untuk perilaku sintesis milik vendor.
- Input Microsoft lama `edge` dinormalisasi ke id penyedia `microsoft`.
- Model kepemilikan yang disukai berorientasi perusahaan: satu Plugin vendor dapat memiliki
  penyedia teks, speech, gambar, dan media masa depan seiring OpenClaw menambahkan
  kontrak kapabilitas tersebut.

Untuk pemahaman gambar/audio/video, Plugin mendaftarkan satu penyedia
media-understanding bertipe, bukan kantong key/value generik:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Catatan:

- Pertahankan orkestrasi, fallback, konfigurasi, dan wiring channel di inti.
- Pertahankan perilaku vendor di Plugin penyedia.
- Ekspansi aditif harus tetap bertipe: metode opsional baru, field hasil opsional
  baru, kapabilitas opsional baru.
- Generasi video sudah mengikuti pola yang sama:
  - inti memiliki kontrak kapabilitas dan helper runtime
  - Plugin vendor mendaftarkan `api.registerVideoGenerationProvider(...)`
  - Plugin fitur/channel memakai `api.runtime.videoGeneration.*`

Untuk helper runtime media-understanding, Plugin dapat memanggil:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

Untuk transkripsi audio, Plugin dapat menggunakan runtime media-understanding
atau alias STT lama:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Catatan:

- `api.runtime.mediaUnderstanding.*` adalah permukaan bersama yang disukai untuk
  pemahaman gambar/audio/video.
- Menggunakan konfigurasi audio media-understanding inti (`tools.media.audio`) dan urutan fallback penyedia.
- Mengembalikan `{ text: undefined }` ketika tidak ada output transkripsi yang dihasilkan (misalnya input dilewati/tidak didukung).
- `api.runtime.stt.transcribeAudioFile(...)` tetap menjadi alias kompatibilitas.

Plugin juga dapat menjalankan subagen latar belakang melalui `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Catatan:

- `provider` dan `model` adalah override opsional per run, bukan perubahan sesi persisten.
- OpenClaw hanya menghormati field override tersebut untuk pemanggil tepercaya.
- Untuk run fallback milik Plugin, operator harus ikut serta dengan `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Gunakan `plugins.entries.<id>.subagent.allowedModels` untuk membatasi Plugin tepercaya ke target kanonis `provider/model` tertentu, atau `"*"` untuk mengizinkan target apa pun secara eksplisit.
- Run subagen Plugin yang tidak tepercaya tetap berfungsi, tetapi permintaan override ditolak, bukan diam-diam fallback.
- Sesi subagen yang dibuat Plugin diberi tag dengan id Plugin pembuatnya. Fallback `api.runtime.subagent.deleteSession(...)` hanya boleh menghapus sesi milik tersebut; penghapusan sesi arbitrer tetap memerlukan permintaan Gateway dengan cakupan admin.

Untuk pencarian web, Plugin dapat memakai helper runtime bersama alih-alih
masuk ke wiring tool agen:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Plugin juga dapat mendaftarkan penyedia pencarian web melalui
`api.registerWebSearchProvider(...)`.

Catatan:

- Pertahankan pemilihan penyedia, resolusi kredensial, dan semantik permintaan bersama di inti.
- Gunakan penyedia pencarian web untuk transport pencarian khusus vendor.
- `api.runtime.webSearch.*` adalah permukaan bersama yang disukai untuk Plugin fitur/channel yang membutuhkan perilaku pencarian tanpa bergantung pada wrapper tool agen.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: menghasilkan gambar menggunakan rantai penyedia generasi gambar yang dikonfigurasi.
- `listProviders(...)`: mencantumkan penyedia generasi gambar yang tersedia beserta kapabilitasnya.

## Rute HTTP Gateway

Plugin dapat mengekspos endpoint HTTP dengan `api.registerHttpRoute(...)`.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Field rute:

- `path`: path rute di bawah server HTTP gateway.
- `auth`: wajib. Gunakan `"gateway"` untuk mewajibkan autentikasi gateway normal, atau `"plugin"` untuk autentikasi/verifikasi webhook yang dikelola Plugin.
- `match`: opsional. `"exact"` (default) atau `"prefix"`.
- `replaceExisting`: opsional. Memungkinkan Plugin yang sama mengganti registrasi rute miliknya yang sudah ada.
- `handler`: kembalikan `true` ketika rute menangani permintaan.

Catatan:

- `api.registerHttpHandler(...)` telah dihapus dan akan menyebabkan kesalahan pemuatan Plugin. Gunakan `api.registerHttpRoute(...)` sebagai gantinya.
- Rute Plugin harus mendeklarasikan `auth` secara eksplisit.
- Konflik `path + match` yang persis ditolak kecuali `replaceExisting: true`, dan satu Plugin tidak dapat menggantikan rute milik Plugin lain.
- Rute yang tumpang tindih dengan tingkat `auth` berbeda ditolak. Pertahankan rantai fallthrough `exact`/`prefix` hanya pada tingkat auth yang sama.
- Rute `auth: "plugin"` **tidak** menerima cakupan runtime operator secara otomatis. Rute ini ditujukan untuk webhook/verifikasi tanda tangan yang dikelola Plugin, bukan panggilan pembantu Gateway yang bersifat istimewa.
- Rute `auth: "gateway"` berjalan di dalam cakupan runtime permintaan Gateway, tetapi cakupan itu sengaja dibuat konservatif:
  - auth bearer rahasia bersama (`gateway.auth.mode = "token"` / `"password"`) menjaga cakupan runtime rute Plugin tetap dipatok ke `operator.write`, bahkan jika pemanggil mengirim `x-openclaw-scopes`
  - mode HTTP pembawa identitas tepercaya (misalnya `trusted-proxy` atau `gateway.auth.mode = "none"` pada ingress privat) menghormati `x-openclaw-scopes` hanya ketika header tersebut secara eksplisit ada
  - jika `x-openclaw-scopes` tidak ada pada permintaan rute Plugin pembawa identitas tersebut, cakupan runtime kembali ke `operator.write`
- Aturan praktis: jangan berasumsi rute Plugin dengan auth gateway adalah permukaan admin implisit. Jika rute Anda membutuhkan perilaku khusus admin, wajibkan mode auth pembawa identitas dan dokumentasikan kontrak header `x-openclaw-scopes` yang eksplisit.

## Jalur impor Plugin SDK

Gunakan subjalur SDK yang sempit alih-alih barrel root `openclaw/plugin-sdk` yang monolitik saat menulis Plugin baru. Subjalur inti:

| Subjalur                            | Tujuan                                             |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitif pendaftaran Plugin                       |
| `openclaw/plugin-sdk/channel-core`  | Pembantu entri/pembuatan channel                  |
| `openclaw/plugin-sdk/core`          | Pembantu bersama generik dan kontrak payung       |
| `openclaw/plugin-sdk/config-schema` | Skema Zod root `openclaw.json` (`OpenClawSchema`) |

Plugin channel memilih dari keluarga seam yang sempit — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, dan `channel-actions`. Perilaku persetujuan sebaiknya dikonsolidasikan
pada satu kontrak `approvalCapability`, bukan dicampur di berbagai field
Plugin yang tidak terkait. Lihat [Plugin channel](/id/plugins/sdk-channel-plugins).

Pembantu runtime dan konfigurasi berada di bawah subjalur `*-runtime` yang terfokus dan cocok
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, dan sebagainya). Lebih pilih `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot`, dan `config-mutation`
alih-alih barrel kompatibilitas `config-runtime` yang luas.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
dan `openclaw/plugin-sdk/infra-runtime` adalah shim kompatibilitas yang sudah usang untuk
Plugin lama. Kode baru sebaiknya mengimpor primitif generik yang lebih sempit.
</Info>

Titik entri internal repo (per root paket Plugin bundel):

- `index.js` — entri Plugin bundel
- `api.js` — barrel pembantu/tipe
- `runtime-api.js` — barrel khusus runtime
- `setup-entry.js` — entri Plugin setup

Plugin eksternal hanya boleh mengimpor subjalur `openclaw/plugin-sdk/*`. Jangan pernah
mengimpor `src/*` paket Plugin lain dari core atau dari Plugin lain.
Titik entri yang dimuat melalui facade lebih memilih snapshot konfigurasi runtime aktif saat
tersedia, lalu fallback ke file konfigurasi terselesaikan di disk.

Subjalur khusus kapabilitas seperti `image-generation`, `media-understanding`,
dan `speech` ada karena Plugin bundel menggunakannya saat ini. Subjalur tersebut tidak
otomatis menjadi kontrak eksternal jangka panjang yang dibekukan — periksa halaman referensi SDK
yang relevan saat mengandalkannya.

## Skema alat pesan

Plugin sebaiknya memiliki kontribusi skema `describeMessageTool(...)` khusus channel
untuk primitif non-pesan seperti reaksi, tanda baca, dan jajak pendapat.
Presentasi pengiriman bersama sebaiknya menggunakan kontrak generik `MessagePresentation`
alih-alih field tombol, komponen, blok, atau kartu native penyedia.
Lihat [Presentasi Pesan](/id/plugins/message-presentation) untuk kontrak,
aturan fallback, pemetaan penyedia, dan checklist penulis Plugin.

Plugin yang dapat mengirim mendeklarasikan apa yang dapat dirender melalui kapabilitas pesan:

- `presentation` untuk blok presentasi semantik (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` untuk permintaan pengiriman yang disematkan

Core memutuskan apakah akan merender presentasi secara native atau menurunkannya menjadi teks.
Jangan mengekspos escape hatch UI native penyedia dari alat pesan generik.
Pembantu SDK yang sudah usang untuk skema native legacy tetap diekspor untuk Plugin
pihak ketiga yang sudah ada, tetapi Plugin baru sebaiknya tidak menggunakannya.

## Resolusi target channel

Plugin channel sebaiknya memiliki semantik target khusus channel. Pertahankan host
outbound bersama tetap generik dan gunakan permukaan adapter messaging untuk aturan penyedia:

- `messaging.inferTargetChatType({ to })` memutuskan apakah target yang dinormalisasi
  harus diperlakukan sebagai `direct`, `group`, atau `channel` sebelum lookup direktori.
- `messaging.targetResolver.looksLikeId(raw, normalized)` memberi tahu core apakah suatu
  input harus langsung melewati resolusi mirip id alih-alih pencarian direktori.
- `messaging.targetResolver.resolveTarget(...)` adalah fallback Plugin saat
  core membutuhkan resolusi akhir milik penyedia setelah normalisasi atau setelah
  direktori tidak menemukan hasil.
- `messaging.resolveOutboundSessionRoute(...)` memiliki konstruksi rute sesi
  khusus penyedia setelah target terselesaikan.

Pembagian yang direkomendasikan:

- Gunakan `inferTargetChatType` untuk keputusan kategori yang harus terjadi sebelum
  mencari peers/groups.
- Gunakan `looksLikeId` untuk pemeriksaan "perlakukan ini sebagai id target eksplisit/native".
- Gunakan `resolveTarget` untuk fallback normalisasi khusus penyedia, bukan untuk
  pencarian direktori yang luas.
- Simpan id native penyedia seperti id chat, id thread, JID, handle, dan id room
  di dalam nilai `target` atau parameter khusus penyedia, bukan di field SDK generik.

## Direktori berbasis konfigurasi

Plugin yang menurunkan entri direktori dari konfigurasi sebaiknya mempertahankan logika itu di
Plugin dan menggunakan ulang pembantu bersama dari
`openclaw/plugin-sdk/directory-runtime`.

Gunakan ini saat channel membutuhkan peers/groups berbasis konfigurasi seperti:

- peer DM berbasis allowlist
- peta channel/grup yang dikonfigurasi
- fallback direktori statis bercakupan akun

Pembantu bersama di `directory-runtime` hanya menangani operasi generik:

- pemfilteran kueri
- penerapan limit
- pembantu deduplikasi/normalisasi
- pembuatan `ChannelDirectoryEntry[]`

Inspeksi akun dan normalisasi id khusus channel sebaiknya tetap berada dalam
implementasi Plugin.

## Katalog penyedia

Plugin penyedia dapat mendefinisikan katalog model untuk inferensi dengan
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` mengembalikan bentuk yang sama dengan yang ditulis OpenClaw ke
`models.providers`:

- `{ provider }` untuk satu entri penyedia
- `{ providers }` untuk beberapa entri penyedia

Gunakan `catalog` saat Plugin memiliki id model khusus penyedia, default URL dasar,
atau metadata model yang dibatasi auth.

`catalog.order` mengontrol kapan katalog Plugin digabungkan relatif terhadap penyedia implisit
bawaan OpenClaw:

- `simple`: penyedia berbasis API key biasa atau berbasis env
- `profile`: penyedia yang muncul saat profil auth tersedia
- `paired`: penyedia yang menyintesis beberapa entri penyedia terkait
- `late`: pass terakhir, setelah penyedia implisit lain

Penyedia yang lebih akhir menang saat terjadi tabrakan key, sehingga Plugin dapat sengaja menimpa
entri penyedia bawaan dengan id penyedia yang sama.

Kompatibilitas:

- `discovery` masih berfungsi sebagai alias legacy
- jika `catalog` dan `discovery` sama-sama terdaftar, OpenClaw menggunakan `catalog`

## Inspeksi channel hanya baca

Jika Plugin Anda mendaftarkan channel, lebih pilih mengimplementasikan
`plugin.config.inspectAccount(cfg, accountId)` bersama `resolveAccount(...)`.

Alasannya:

- `resolveAccount(...)` adalah jalur runtime. Jalur ini boleh berasumsi kredensial
  sudah sepenuhnya termaterialisasi dan dapat gagal cepat saat rahasia yang diperlukan hilang.
- Jalur perintah hanya baca seperti `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, serta alur perbaikan doctor/config
  sebaiknya tidak perlu mematerialisasi kredensial runtime hanya untuk
  mendeskripsikan konfigurasi.

Perilaku `inspectAccount(...)` yang direkomendasikan:

- Hanya kembalikan status akun yang deskriptif.
- Pertahankan `enabled` dan `configured`.
- Sertakan field sumber/status kredensial saat relevan, seperti:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Anda tidak perlu mengembalikan nilai token mentah hanya untuk melaporkan ketersediaan
  hanya baca. Mengembalikan `tokenStatus: "available"` (dan field sumber yang cocok)
  sudah cukup untuk perintah bergaya status.
- Gunakan `configured_unavailable` saat kredensial dikonfigurasi melalui SecretRef tetapi
  tidak tersedia di jalur perintah saat ini.

Ini memungkinkan perintah hanya baca melaporkan "terkonfigurasi tetapi tidak tersedia di jalur
perintah ini" alih-alih crash atau salah melaporkan akun sebagai tidak terkonfigurasi.

## Paket pack

Direktori Plugin dapat menyertakan `package.json` dengan `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Setiap entri menjadi Plugin. Jika pack mencantumkan beberapa extension, id Plugin
menjadi `name/<fileBase>`.

Jika Plugin Anda mengimpor dependensi npm, instal dependensi tersebut di direktori itu agar
`node_modules` tersedia (`npm install` / `pnpm install`).

Guardrail keamanan: setiap entri `openclaw.extensions` harus tetap berada di dalam direktori Plugin
setelah resolusi symlink. Entri yang keluar dari direktori paket akan
ditolak.

Catatan keamanan: `openclaw plugins install` menginstal dependensi Plugin dengan
`npm install --omit=dev --ignore-scripts` lokal proyek (tanpa skrip lifecycle,
tanpa dependensi dev saat runtime), mengabaikan pengaturan instal npm global yang diwarisi.
Jaga pohon dependensi Plugin tetap "JS/TS murni" dan hindari paket yang membutuhkan
build `postinstall`.

Opsional: `openclaw.setupEntry` dapat menunjuk ke modul ringan khusus setup.
Saat OpenClaw membutuhkan permukaan setup untuk Plugin channel yang dinonaktifkan, atau
saat Plugin channel diaktifkan tetapi masih belum dikonfigurasi, OpenClaw memuat `setupEntry`
alih-alih entri Plugin penuh. Ini membuat startup dan setup lebih ringan
saat entri Plugin utama Anda juga menghubungkan alat, hook, atau kode khusus runtime
lainnya.

Opsional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
dapat mengikutsertakan Plugin channel ke jalur `setupEntry` yang sama selama fase startup
pra-listen Gateway, bahkan saat channel sudah dikonfigurasi.

Gunakan ini hanya saat `setupEntry` sepenuhnya mencakup permukaan startup yang harus ada
sebelum Gateway mulai mendengarkan. Dalam praktiknya, itu berarti entri setup
harus mendaftarkan setiap kapabilitas milik channel yang menjadi dependensi startup, seperti:

- pendaftaran channel itu sendiri
- rute HTTP apa pun yang harus tersedia sebelum Gateway mulai mendengarkan
- metode, alat, atau layanan Gateway apa pun yang harus ada selama jendela yang sama

Jika entri penuh Anda masih memiliki kapabilitas startup yang diperlukan, jangan aktifkan
flag ini. Pertahankan Plugin pada perilaku default dan biarkan OpenClaw memuat
entri penuh selama startup.

Channel bundel juga dapat memublikasikan pembantu permukaan kontrak khusus setup yang dapat
dikonsultasikan core sebelum runtime channel penuh dimuat. Permukaan promosi setup
saat ini adalah:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core menggunakan surface itu saat perlu mempromosikan konfigurasi channel akun tunggal legacy ke `channels.<id>.accounts.*` tanpa memuat entri plugin penuh. Matrix adalah contoh bundel saat ini: ia hanya memindahkan kunci auth/bootstrap ke akun bernama yang dipromosikan saat akun bernama sudah ada, dan dapat mempertahankan kunci akun-default non-kanonis yang dikonfigurasi alih-alih selalu membuat `accounts.default`.

Adapter patch penyiapan tersebut menjaga penemuan surface kontrak bundel tetap lazy. Waktu impor tetap ringan; surface promosi dimuat hanya pada penggunaan pertama, bukan masuk kembali ke startup channel bundel saat impor modul.

Saat surface startup tersebut menyertakan metode RPC Gateway, pertahankan metode itu pada prefiks khusus plugin. Namespace admin core (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu di-resolve ke `operator.admin`, meskipun sebuah plugin meminta scope yang lebih sempit.

Contoh:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Metadata katalog channel

Plugin channel dapat mengiklankan metadata penyiapan/penemuan melalui `openclaw.channel` dan petunjuk instal melalui `openclaw.install`. Ini menjaga data katalog core tetap kosong.

Contoh:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

Kolom `openclaw.channel` yang berguna selain contoh minimal:

- `detailLabel`: label sekunder untuk surface katalog/status yang lebih kaya
- `docsLabel`: mengganti teks tautan untuk tautan dokumentasi
- `preferOver`: id plugin/channel berprioritas lebih rendah yang harus dikalahkan oleh entri katalog ini
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrol salinan surface pemilihan
- `markdownCapable`: menandai channel sebagai mampu markdown untuk keputusan pemformatan keluar
- `exposure.configured`: sembunyikan channel dari surface daftar channel terkonfigurasi saat disetel ke `false`
- `exposure.setup`: sembunyikan channel dari pemilih penyiapan/konfigurasi interaktif saat disetel ke `false`
- `exposure.docs`: tandai channel sebagai internal/privat untuk surface navigasi dokumentasi
- `showConfigured` / `showInSetup`: alias legacy yang masih diterima untuk kompatibilitas; lebih pilih `exposure`
- `quickstartAllowFrom`: ikutkan channel ke alur quickstart `allowFrom` standar
- `forceAccountBinding`: wajibkan pengikatan akun eksplisit meskipun hanya ada satu akun
- `preferSessionLookupForAnnounceTarget`: pilih lookup sesi saat me-resolve target pengumuman

OpenClaw juga dapat menggabungkan **katalog channel eksternal** (misalnya, ekspor registry MPM). Letakkan file JSON di salah satu:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Atau arahkan `OPENCLAW_PLUGIN_CATALOG_PATHS` (atau `OPENCLAW_MPM_CATALOG_PATHS`) ke satu atau beberapa file JSON (dipisahkan koma/titik koma/`PATH`). Setiap file harus berisi `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser juga menerima `"packages"` atau `"plugins"` sebagai alias legacy untuk kunci `"entries"`.

Entri katalog channel yang dihasilkan dan entri katalog instal provider mengekspos fakta sumber instal ternormalisasi di samping blok mentah `openclaw.install`. Fakta ternormalisasi tersebut mengidentifikasi apakah spec npm adalah versi persis atau selector floating, apakah metadata integritas yang diharapkan tersedia, dan apakah path sumber lokal juga tersedia. Saat identitas katalog/paket diketahui, fakta ternormalisasi memperingatkan jika nama paket npm hasil parse bergeser dari identitas tersebut. Fakta itu juga memperingatkan saat `defaultChoice` tidak valid atau menunjuk ke sumber yang tidak tersedia, dan saat metadata integritas npm tersedia tanpa sumber npm yang valid. Konsumen harus memperlakukan `installSource` sebagai kolom opsional aditif sehingga entri buatan tangan dan shim katalog tidak perlu menyintesisnya. Ini memungkinkan onboarding dan diagnostik menjelaskan status source-plane tanpa mengimpor runtime plugin.

Entri npm eksternal resmi sebaiknya memilih `npmSpec` persis plus `expectedIntegrity`. Nama paket polos dan dist-tag tetap berfungsi untuk kompatibilitas, tetapi menampilkan peringatan source-plane agar katalog dapat bergerak menuju instal yang dipin dan diperiksa integritasnya tanpa merusak plugin yang ada. Saat onboarding menginstal dari path katalog lokal, ia mencatat entri indeks plugin terkelola dengan `source: "path"` dan `sourcePath` relatif workspace bila memungkinkan. Path muat operasional absolut tetap berada di `plugins.load.paths`; catatan instal menghindari duplikasi path workstation lokal ke konfigurasi jangka panjang. Ini menjaga instal pengembangan lokal tetap terlihat oleh diagnostik source-plane tanpa menambahkan surface pengungkapan path filesystem mentah kedua. Indeks plugin persisten `plugins/installs.json` adalah sumber kebenaran sumber instal dan dapat di-refresh tanpa memuat modul runtime plugin. Map `installRecords` miliknya tahan lama meskipun manifes plugin hilang atau tidak valid; array `plugins` miliknya adalah tampilan manifes yang dapat dibangun ulang.

## Plugin mesin konteks

Plugin mesin konteks memiliki orkestrasi konteks sesi untuk ingest, assembly, dan compaction. Daftarkan dari plugin Anda dengan `api.registerContextEngine(id, factory)`, lalu pilih mesin aktif dengan `plugins.slots.contextEngine`.

Gunakan ini saat plugin Anda perlu mengganti atau memperluas pipeline konteks default, bukan hanya menambahkan pencarian memori atau hook.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Factory `ctx` mengekspos nilai opsional `config`, `agentDir`, dan `workspaceDir` untuk inisialisasi saat konstruksi.

Jika mesin Anda **tidak** memiliki algoritma compaction, tetap implementasikan `compact()` dan delegasikan secara eksplisit:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", (ctx) => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Menambahkan capability baru

Saat sebuah plugin membutuhkan perilaku yang tidak cocok dengan API saat ini, jangan melewati sistem plugin dengan reach-in privat. Tambahkan capability yang hilang.

Urutan yang disarankan:

1. definisikan kontrak core
   Tentukan perilaku bersama apa yang harus dimiliki core: kebijakan, fallback, penggabungan konfigurasi, lifecycle, semantik yang menghadap channel, dan bentuk helper runtime.
2. tambahkan surface registrasi/runtime plugin bertipe
   Perluas `OpenClawPluginApi` dan/atau `api.runtime` dengan surface capability bertipe terkecil yang berguna.
3. hubungkan konsumen core + channel/fitur
   Channel dan plugin fitur harus mengonsumsi capability baru melalui core, bukan dengan mengimpor implementasi vendor secara langsung.
4. daftarkan implementasi vendor
   Plugin vendor kemudian mendaftarkan backend mereka terhadap capability tersebut.
5. tambahkan cakupan kontrak
   Tambahkan pengujian agar kepemilikan dan bentuk registrasi tetap eksplisit dari waktu ke waktu.

Beginilah OpenClaw tetap opinionated tanpa menjadi hardcoded ke pandangan dunia satu provider. Lihat [Capability Cookbook](/id/plugins/architecture) untuk checklist file konkret dan contoh yang dikerjakan.

### Checklist capability

Saat Anda menambahkan capability baru, implementasinya biasanya harus menyentuh surface berikut bersama-sama:

- tipe kontrak core di `src/<capability>/types.ts`
- helper runner/runtime core di `src/<capability>/runtime.ts`
- surface registrasi API plugin di `src/plugins/types.ts`
- wiring registry plugin di `src/plugins/registry.ts`
- eksposur runtime plugin di `src/plugins/runtime/*` saat plugin fitur/channel perlu mengonsumsinya
- helper capture/test di `src/test-utils/plugin-registration.ts`
- asersi kepemilikan/kontrak di `src/plugins/contracts/registry.ts`
- dokumentasi operator/plugin di `docs/`

Jika salah satu surface tersebut hilang, biasanya itu tanda capability belum sepenuhnya terintegrasi.

### Template capability

Pola minimal:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Pola pengujian kontrak:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Itu menjaga aturan tetap sederhana:

- core memiliki kontrak capability + orkestrasi
- plugin vendor memiliki implementasi vendor
- plugin fitur/channel mengonsumsi helper runtime
- pengujian kontrak menjaga kepemilikan tetap eksplisit

## Terkait

- [Arsitektur plugin](/id/plugins/architecture) — model dan bentuk capability publik
- [Subpath SDK plugin](/id/plugins/sdk-subpaths)
- [Penyiapan SDK plugin](/id/plugins/sdk-setup)
- [Membangun plugin](/id/plugins/building-plugins)
