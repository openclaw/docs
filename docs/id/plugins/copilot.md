---
read_when:
    - Anda ingin menggunakan harness GitHub Copilot SDK untuk agen
    - Anda memerlukan contoh konfigurasi untuk runtime `copilot`
    - Anda sedang menghubungkan agen ke langganan Copilot (github / openclaw / copilot) dan ingin menjalankannya melalui CLI Copilot
summary: Jalankan giliran agen tertanam OpenClaw melalui harness SDK GitHub Copilot eksternal
title: Harness SDK Copilot
x-i18n:
    generated_at: "2026-07-12T14:24:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4270a9b75a038540af6a8306f3e80c87d6085dde29d128adf85b930713209fc5
    source_path: plugins/copilot.md
    workflow: 16
---

Plugin eksternal `@openclaw/copilot` menjalankan giliran agen Copilot langganan yang disematkan melalui GitHub Copilot CLI (`@github/copilot-sdk`), bukan melalui harness bawaan OpenClaw. Sesi Copilot CLI memiliki loop agen tingkat rendah: eksekusi alat native, Compaction native (`infiniteSessions`), dan status utas yang dikelola CLI di bawah `copilotHome`. OpenClaw tetap memiliki saluran obrolan, berkas sesi, pemilihan model, alat dinamis (dijembatani), persetujuan, pengiriman media, cerminan transkrip yang terlihat, pertanyaan sampingan `/btw` (lihat [Pertanyaan sampingan (`/btw`)](#side-questions-btw)), dan `openclaw doctor`.

Untuk pembagian model/penyedia/runtime yang lebih luas, mulai dari
[Runtime agen](/id/concepts/agent-runtimes).

## Persyaratan

- OpenClaw dengan Plugin `@openclaw/copilot` terpasang.
- Jika konfigurasi Anda menggunakan `plugins.allow`, sertakan `copilot` (id manifes yang dideklarasikan Plugin). Entri daftar izin untuk nama paket npm `@openclaw/copilot` tidak akan cocok dan membuat Plugin tetap diblokir, meskipun `agentRuntime.id: "copilot"` telah ditetapkan.
- Langganan GitHub Copilot yang dapat menjalankan Copilot CLI, atau variabel lingkungan `gitHubToken` / entri profil autentikasi untuk eksekusi tanpa antarmuka atau Cron.
- Direktori `copilotHome` yang dapat ditulisi. Nilai bawaannya adalah `<agentDir>/copilot` saat OpenClaw menyediakan direktori agen, atau `~/.openclaw/agents/<agentId>/copilot` jika tidak.

`openclaw doctor` menjalankan [kontrak doctor](#doctor) milik Plugin untuk kepemilikan status sesi dan migrasi konfigurasi mendatang. Perintah ini tidak memeriksa lingkungan Copilot CLI.

## Instalasi

Runtime Copilot didistribusikan sebagai Plugin eksternal agar paket inti `openclaw` tidak menyertakan `@github/copilot-sdk` atau biner CLI khusus platform `@github/copilot-<platform>-<arch>` (total sekitar 260 MB). Pasang hanya untuk agen yang memilih menggunakan runtime ini:

```bash
openclaw plugins install @openclaw/copilot
```

Wizard penyiapan memasang Plugin secara otomatis saat pertama kali Anda memilih model `github-copilot/*` **dan** konfigurasi Anda merutekan model tersebut (atau penyedianya) ke runtime Copilot melalui `agentRuntime: { id: "copilot" }`; lihat [Mulai cepat](#quickstart). Tanpa pilihan tersebut, OpenClaw menggunakan penyedia GitHub Copilot bawaannya dan tidak pernah memasang Plugin ini.

Runtime menyelesaikan SDK dalam urutan berikut:

1. `import("@github/copilot-sdk")` dari paket `@openclaw/copilot` yang terpasang.
2. Direktori fallback `~/.openclaw/npm-runtime/copilot/` (target instalasi sesuai permintaan lama).

SDK yang tidak ditemukan menghasilkan satu kesalahan dengan kode `COPILOT_SDK_MISSING` dan perintah instalasi ulang di atas.

## Mulai cepat

Sematkan satu model (atau satu penyedia) ke harness:

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/auto",
      models: {
        "github-copilot/auto": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

Tetapkan `agentRuntime.id` pada satu entri model untuk merutekan hanya model tersebut melalui harness, atau pada penyedia untuk merutekan setiap model di bawah penyedia tersebut.

`github-copilot/auto` adalah titik awal yang portabel. Model Copilot bernama bergantung pada kebijakan akun dan organisasi; pastikan Copilot CLI yang telah diautentikasi benar-benar menyediakan suatu model sebelum menyematkannya.

## Penyedia yang didukung

Harness mendukung penyedia kanonis `github-copilot` (dimiliki oleh `extensions/github-copilot`), serta entri `models.providers` khusus saat model memiliki `baseUrl` yang tidak kosong dan salah satu bentuk `api` berikut:

- `anthropic-messages`
- `azure-openai-responses`
- `ollama` (penyelesaian yang kompatibel dengan OpenAI)
- `openai-completions`
- `openai-responses`

Id penyedia native (`openai`, `anthropic`, `google`, `ollama`) tetap dimiliki oleh runtime native masing-masing. Gunakan id penyedia khusus yang berbeda untuk merutekan titik akhir melalui BYOK Copilot.

Titik akhir BYOK Copilot harus berupa URL HTTPS publik. Harness memberikan proksi local loopback per percobaan kepada SDK Copilot, lalu meneruskan lalu lintas penyedia melalui jalur pengambilan terlindungi milik OpenClaw agar penyematan DNS dan kebijakan SSRF tetap dimiliki oleh OpenClaw. Gunakan runtime native OpenClaw untuk Ollama lokal, LM Studio, atau server model LAN.

## BYOK

BYOK Copilot menggunakan kontrak penyedia khusus tingkat sesi milik SDK. OpenClaw meneruskan titik akhir model yang telah diselesaikan, kunci API, mode token bearer, header, id model, serta batas konteks/keluaran; logika transportasi penyedia tetap berada di SDK, bukan di inti.

```json5
{
  agents: {
    defaults: {
      model: "custom-proxy/llama-3.1-8b",
      models: {
        "custom-proxy/llama-3.1-8b": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "https://api.example.com/v1",
        apiKey: "${CUSTOM_PROXY_API_KEY}",
        api: "openai-responses",
        authHeader: true,
        models: [{ id: "llama-3.1-8b", name: "Llama 3.1 8B" }],
      },
    },
  },
}
```

Sesi BYOK diberi kunci yang terpisah dari sesi langganan dan dari titik akhir atau kredensial BYOK lainnya. Mengganti kunci, header, model, atau titik akhir akan memulai sesi SDK Copilot baru, bukan melanjutkan status yang tidak kompatibel.

## Autentikasi

Urutan prioritas, diterapkan per agen selama `runCopilotAttempt`:

1. **`useLoggedInUser: true` eksplisit** pada masukan percobaan — menggunakan pengguna yang telah masuk di Copilot CLI dalam `copilotHome` milik agen.
2. **`gitHubToken` eksplisit** pada masukan percobaan (memerlukan `profileId` + `profileVersion`). Untuk pemanggilan CLI langsung dan pengujian yang perlu melewati penyelesaian profil autentikasi.
3. **`resolvedApiKey` + `authProfileId` yang diselesaikan kontrak** — jalur utama produksi. Inti menyelesaikan profil autentikasi `github-copilot` yang dikonfigurasi untuk agen (`src/infra/provider-usage.auth.ts:resolveProviderAuths`) sebelum memanggil harness, sehingga profil autentikasi `github-copilot:<profile>` berfungsi secara menyeluruh untuk penyiapan tanpa antarmuka, Cron, atau multiprofil tanpa variabel lingkungan.
4. **Fallback variabel lingkungan**, diperiksa dalam urutan berikut (nilai tidak kosong pertama yang ditemukan digunakan, string kosong dianggap tidak ada; mencerminkan urutan prioritas penyedia `github-copilot` yang didistribusikan dalam `extensions/github-copilot/auth.ts`):
   1. `OPENCLAW_GITHUB_TOKEN` — penggantian khusus harness; memungkinkan Anda menyematkan token untuk harness OpenClaw tanpa mengganggu konfigurasi `gh` / Copilot CLI di seluruh sistem.
   2. `COPILOT_GITHUB_TOKEN` — variabel lingkungan standar SDK / CLI Copilot.
   3. `GH_TOKEN` — variabel lingkungan standar CLI `gh`.
   4. `GITHUB_TOKEN` — fallback token GitHub generik.

   Id profil pool yang disintesis adalah `env:<NAME>`; versi profilnya merupakan sidik jari sha256 token yang tidak dapat dibalik, sehingga penggantian nilai lingkungan akan menyegarkan pool klien dengan bersih.

5. **`useLoggedInUser` bawaan** saat tidak ada sinyal token yang tersedia.

Setiap agen mendapatkan `copilotHome` tersendiri agar token, sesi, dan konfigurasi Copilot CLI tidak pernah bocor ant agen pada mesin yang sama. Nilai bawaan: `<agentDir>/copilot` (menjaga status SDK di luar direktori yang sama dengan `models.json` / `auth-profiles.json` milik OpenClaw), atau `~/.openclaw/agents/<agentId>/copilot` saat tidak ada direktori agen yang diberikan. Ganti dengan `copilotHome: <path>` pada masukan percobaan untuk lokasi khusus (misalnya, mount bersama untuk migrasi).

Pengujian harness langsung menggunakan `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` untuk token langsung. Penyiapan pengujian langsung bersama membersihkan `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, dan `GITHUB_TOKEN` setelah menempatkan profil autentikasi nyata ke dalam direktori home pengujian yang terisolasi, sehingga nilai `gh auth token` yang diteruskan melalui variabel khusus tersebut mencegah pengujian dilewati secara keliru tanpa bocor ke rangkaian pengujian yang tidak terkait.

## Permukaan konfigurasi

Harness membaca konfigurasi dari masukan per percobaan (`runCopilotAttempt({...})`) serta sejumlah kecil nilai bawaan lingkungan di dalam `extensions/copilot/src/`:

| Bidang                   | Tujuan                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | Direktori status CLI per agen (nilai bawaan dijelaskan di atas).                                                                                                                                                                                                                                                                                          |
| `model`                  | String atau `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. Hilangkan untuk menggunakan pemilihan model normal agen; harness memverifikasi bahwa penyedia yang diselesaikan didukung.                                                                                                                                                          |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`. Dipetakan dari penyelesaian `ThinkLevel` / `ReasoningLevel` OpenClaw di `auto-reply/thinking.ts`.                                                                                                                                                                                                               |
| `infiniteSessionConfig`  | Penggantian opsional untuk blok `infiniteSessions` SDK yang dikendalikan oleh `harness.compact`. Aman untuk dibiarkan apa adanya.                                                                                                                                                                                                                         |
| `hooksConfig`            | Konfigurasi `SessionHooks` native SDK Copilot opsional untuk callback alat/MCP, perintah pengguna, sesi, dan kesalahan. Terpisah dari hook siklus hidup portabel milik OpenClaw.                                                                                                                                                                            |
| `permissionPolicy`       | Penggantian opsional untuk penangan `onPermissionRequest` SDK bagi jenis alat bawaan SDK (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`). Nilai bawaannya adalah `rejectAllPolicy` sebagai jaring pengaman; lihat [Izin dan ask_user](#permissions-and-ask_user) untuk alasan mengapa penangan ini sebenarnya tidak pernah dipicu. |
| `enableSessionTelemetry` | Flag telemetri sesi SDK opsional.                                                                                                                                                                                                                                                                                                                        |

Hook Plugin OpenClaw tidak memerlukan konfigurasi percobaan khusus Copilot. Harness menjalankan `before_prompt_build` (dan hook kompatibilitas lama `before_agent_start`), `llm_input`, `llm_output`, serta `agent_end` melalui helper harness standar. Compaction SDK yang berhasil juga menjalankan `before_compaction` dan `after_compaction`. Alat OpenClaw yang dijembatani menjalankan `before_tool_call` dan melaporkan `after_tool_call`; `hooksConfig` tetap digunakan untuk callback khusus SDK native yang tidak memiliki padanan portabel.

Bagian lain di OpenClaw tidak perlu mengetahui bidang-bidang ini. Plugin, saluran, dan kode inti lainnya hanya melihat bentuk standar `AgentHarnessAttemptParams` / `AgentHarnessAttemptResult`.

## Compaction

Saat `harness.compact` berjalan, harness SDK Copilot:

1. Melanjutkan sesi SDK yang dilacak tanpa meneruskan pekerjaan tertunda.
2. Memanggil RPC Compaction riwayat yang tercakup pada sesi milik SDK.
3. Mengembalikan hasil Compaction SDK tanpa menulis berkas penanda kompatibilitas di dalam ruang kerja.

Cerminan transkrip sisi OpenClaw (di bawah) tetap menerima pesan pasca-Compaction, sehingga riwayat obrolan yang terlihat oleh pengguna tetap konsisten.

## Pencerminan transkrip

`runCopilotAttempt` menulis ganda pesan yang dapat dicerminkan dari setiap giliran ke transkrip audit OpenClaw melalui `extensions/copilot/src/dual-write-transcripts.ts`. Cerminan dicakup per sesi (`copilot:${sessionId}`) dan diberi kunci per pesan (`${role}:${sha256_16(role,content)}`), sehingga entri giliran sebelumnya yang dipancarkan ulang berbenturan dengan kunci pada disk yang sudah ada alih-alih diduplikasi.

Dua lapisan pembatasan kegagalan membungkus pencerminan agar kegagalan penulisan transkrip
tidak pernah menggagalkan upaya: pembungkus upaya-terbaik internal, ditambah
`.catch(...)` pertahanan berlapis pada tingkat upaya. Kegagalan dicatat, bukan
dimunculkan.

## Pertanyaan sampingan (`/btw`)

`/btw` **bukan** fitur native pada harness ini. `createCopilotAgentHarness()`
sengaja membiarkan `harness.runSideQuestion` tidak terdefinisi
(ditegaskan dalam `extensions/copilot/harness.test.ts`, `describe("runSideQuestion")`),
sehingga dispatcher `/btw` OpenClaw (`src/agents/btw.ts`) beralih ke
jalur yang sama dengan yang digunakannya untuk setiap runtime non-Codex: penyedia model
yang dikonfigurasi dipanggil langsung dengan prompt pertanyaan sampingan singkat dan hasilnya dialirkan kembali melalui
`streamSimple` (tanpa sesi CLI, tanpa slot kumpulan tambahan).

Hal ini mempertahankan sesi Copilot CLI agar dicadangkan untuk perulangan giliran utama agen, dan
menjaga perilaku `/btw` tetap identik dengan runtime non-Codex lainnya.

## Doctor

`extensions/copilot/doctor-contract-api.ts` dimuat secara otomatis oleh
`src/plugins/doctor-contract-registry.ts`. Berkas ini menyediakan:

- `legacyConfigRules` kosong (belum ada bidang yang dihentikan).
- `normalizeCompatibilityConfig` tanpa operasi (dipertahankan agar penghentian bidang pada masa mendatang
  memiliki tempat yang stabil di dalam pohon sumber).
- Satu entri `sessionRouteStateOwners`: penyedia `github-copilot`, runtime
  `copilot`, kunci sesi CLI `copilot`, prefiks profil autentikasi `github-copilot:`.

## Keterbatasan

- Harness mengklaim `github-copilot` beserta ID penyedia BYOK khusus yang tidak dimiliki.
  ID penyedia native yang dimiliki manifes tetap berada pada runtime pemiliknya, bahkan ketika
  `agentRuntime.id` dipaksa menjadi `copilot`.
- Tidak ada permukaan TUI; TUI milik PI tetap menjadi fallback untuk runtime tanpa permukaan
  sepadan.
- Status sesi PI tidak dimigrasikan ketika agen beralih ke `copilot`.
  Pemilihan dilakukan per upaya; sesi PI yang ada tetap valid.
- `ask_user` menggunakan jalur prompt-dan-balasan OpenClaw yang sama seperti harness Codex:
  ketika Copilot SDK meminta masukan pengguna, OpenClaw mengirimkan
  prompt pemblokiran ke saluran/TUI aktif, dan pesan pengguna berikutnya yang masuk antrean
  menyelesaikan permintaan SDK.

## Izin dan ask_user

Penegakan izin untuk alat OpenClaw yang dijembatani berlangsung **di dalam pembungkus alat**,
bukan melalui callback `onPermissionRequest` milik SDK. Fungsi
`wrapToolWithBeforeToolCallHook` yang sama dengan yang digunakan PI
(`src/agents/agent-tools.before-tool-call.ts`) diterapkan oleh
`createOpenClawCodingTools` pada setiap alat pengodean: deteksi perulangan, kebijakan
Plugin tepercaya, hook sebelum pemanggilan alat, dan persetujuan Plugin dua tahap melalui
Gateway (`plugin.approval.request`) semuanya berjalan melalui jalur kode yang sama persis
seperti upaya PI native.

Alat SDK yang dikembalikan oleh `convertOpenClawToolToSdkTool` ditandai dengan:

- `overridesBuiltInTool: true` — menggantikan alat bawaan Copilot CLI dengan
  nama yang sama (edit, read, write, bash, ...) sehingga setiap pemanggilan alat diarahkan kembali
  ke OpenClaw.
- `skipPermission: true` — memerintahkan SDK agar tidak memicu
  `onPermissionRequest({kind: "custom-tool"})` sebelum menjalankan alat. Fungsi
  `execute()` yang dibungkus sudah menjalankan pemeriksaan kebijakan OpenClaw yang lebih lengkap; prompt
  tingkat SDK akan melewati penegakan OpenClaw
  (izinkan-semua) atau memblokir setiap pemanggilan alat (tolak-semua) — keduanya tidak cocok dengan
  kesetaraan PI.

Harness Codex di dalam pohon sumber menggunakan pemisahan yang sama: alat OpenClaw yang dijembatani
dibungkus (`extensions/codex/src/app-server/dynamic-tools.ts`) dan
jenis persetujuan native milik codex-app-server
(`item/commandExecution/requestApproval`, `item/fileChange/requestApproval`,
`item/permissions/requestApproval`) diarahkan melalui `plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`). Padanan Copilot SDK
— `rejectAllPolicy` yang gagal-tertutup untuk setiap jenis non-`custom-tool`
yang pernah mencapai `onPermissionRequest` — merupakan jaring pengaman yang sama, dan dalam
praktiknya tidak pernah terpicu karena `overridesBuiltInTool: true` menggantikan setiap
alat bawaan.

Agar lapisan alat terbungkus dapat mengambil keputusan kebijakan yang setara dengan PI,
harness meneruskan konteks alat upaya PI lengkap ke
`createOpenClawCodingTools`: identitas (`senderIsOwner`, `memberRoleIds`,
`ownerOnlyToolAllowlist`, ...), saluran/perutean (`groupId`,
`currentChannelId`, `replyToMode`, pengalih alat pesan), autentikasi
(`authProfileStore`), identitas eksekusi (`sessionKey` / `runSessionKey` yang diturunkan
dari `sandboxSessionKey`, `runId`), konteks model (`modelApi`,
`modelContextWindowTokens`, `modelCompat`, `modelHasVision`), dan hook eksekusi
(`onToolOutcome`, `onYield`). Tanpa bidang-bidang tersebut, daftar izin khusus pemilik
secara diam-diam menolak secara default, kebijakan kepercayaan Plugin tidak dapat menentukan cakupan yang tepat,
dan `session_status: "current"` mengarah ke kunci sandbox yang kedaluwarsa. Pembuat
jembatan berada di `extensions/copilot/src/tool-bridge.ts`, yang mencerminkan pemanggilan otoritatif PI
di `src/agents/embedded-agent-runner/run/attempt.ts:1262`.
`runAttempt` menentukan konteks sandbox melalui lapisan `resolveSandboxContext` bersama,
meneruskan direktori kerja efektif kepada SDK,
serta meneruskan `sandbox` beserta ruang kerja pembuatan subagen ke jembatan alat.
Jembatan juga meneruskan kontrol terbatas untuk konstruksi alat yang dapat ditegakkannya
pada batas SDK: `includeCoreTools`, daftar izin alat runtime,
dan `toolConstructionPlan`.

Jembatan juga menggunakan pembantu permukaan alat harness bersama dari
`openclaw/plugin-sdk/agent-harness-tool-runtime` untuk kesetaraan PI. Saat
pencarian alat diaktifkan, SDK melihat alat kontrol ringkas beserta eksekutor katalog tersembunyi,
alih-alih setiap skema alat OpenClaw. Saat mode kode
diaktifkan, pembantu membangun permukaan kontrol mode kode dan siklus hidup katalog
yang sama seperti yang digunakan harness agen lainnya. Nilai default ringkas untuk model lokal,
pemfilteran skema yang kompatibel dengan runtime, hidrasi direktori, dan
pembersihan katalog semuanya tetap berada dalam pembantu bersama agar harness Copilot dan
yang berdekatan dengan Codex tidak menyimpang.

### Token GitHub tingkat sesi

Kontrak Copilot SDK membedakan token GitHub **tingkat klien**
(`CopilotClientOptions.gitHubToken`, mengautentikasi proses CLI itu sendiri)
dari token **tingkat sesi** (`SessionConfig.gitHubToken`, menentukan
pengecualian konten, perutean model, dan kuota untuk sesi tersebut; dipatuhi pada
`createSession` maupun `resumeSession`). Harness menentukan autentikasi satu kali melalui
`resolveCopilotAuth` dan menetapkan kedua bidang saat mode autentikasi adalah `gitHubToken`
(`auth.gitHubToken` eksplisit atau `resolvedApiKey` yang ditentukan kontrak dari
profil autentikasi `github-copilot` yang dikonfigurasi). Saat mode yang ditentukan adalah
`useLoggedInUser`, bidang tingkat sesi dihilangkan agar SDK tetap
menurunkan identitas dari identitas pengguna yang masuk.

`ask_user` menggunakan `SessionConfig.onUserInputRequest`. Jembatan menerima indeks
atau label pilihan untuk permintaan dengan pilihan tetap, menerima jawaban bentuk bebas saat
permintaan SDK mengizinkannya, dan membatalkan permintaan yang tertunda ketika upaya OpenClaw
dibatalkan.

## Terkait

- [Runtime agen](/id/concepts/agent-runtimes)
- [Harness Codex](/id/plugins/codex-harness)
- [Plugin harness agen (referensi SDK)](/id/plugins/sdk-agent-harness)
