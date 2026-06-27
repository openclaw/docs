---
read_when:
    - Anda melihat peringatan OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Anda melihat peringatan OPENCLAW_EXTENSION_API_DEPRECATED
    - Anda menggunakan api.registerEmbeddedExtensionFactory sebelum OpenClaw 2026.4.25
    - Anda sedang memperbarui Plugin ke arsitektur Plugin modern
    - Anda memelihara Plugin OpenClaw eksternal
sidebarTitle: Migrate to SDK
summary: Migrasikan dari lapisan kompatibilitas mundur lama ke SDK plugin modern
title: Migrasi SDK Plugin
x-i18n:
    generated_at: "2026-06-27T17:58:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9061b31567cbd24196458ecb9af1cb1b0351f789a136ea26951c8fb7e576cf08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw telah beralih dari lapisan kompatibilitas mundur yang luas ke arsitektur plugin
modern dengan impor yang terfokus dan terdokumentasi. Jika plugin Anda dibuat sebelum
arsitektur baru, panduan ini membantu Anda bermigrasi.

## Apa yang berubah

Sistem plugin lama menyediakan dua permukaan yang sangat terbuka yang memungkinkan plugin mengimpor
apa pun yang mereka perlukan dari satu titik masuk:

- **`openclaw/plugin-sdk/compat`** - satu impor yang mengekspor ulang puluhan
  helper. Ini diperkenalkan untuk menjaga plugin lama berbasis hook tetap berfungsi saat
  arsitektur plugin baru sedang dibangun.
- **`openclaw/plugin-sdk/infra-runtime`** - barrel helper runtime luas yang
  mencampur peristiwa sistem, status Heartbeat, antrean pengiriman, helper fetch/proxy,
  helper file, tipe approval, dan utilitas yang tidak terkait.
- **`openclaw/plugin-sdk/config-runtime`** - barrel kompatibilitas konfigurasi yang luas
  yang masih membawa helper load/write langsung yang sudah tidak disarankan selama jendela
  migrasi.
- **`openclaw/extension-api`** - jembatan yang memberi plugin akses langsung ke
  helper sisi host seperti runner agen tertanam.
- **`api.registerEmbeddedExtensionFactory(...)`** - hook ekstensi bundel khusus embedded-runner
  yang telah dihapus dan sebelumnya dapat mengamati peristiwa embedded-runner seperti
  `tool_result`.

Permukaan impor yang luas kini **tidak disarankan**. Permukaan tersebut masih berfungsi saat runtime,
tetapi plugin baru tidak boleh menggunakannya, dan plugin yang sudah ada sebaiknya bermigrasi sebelum
rilis mayor berikutnya menghapusnya. API pendaftaran factory ekstensi khusus embedded-runner
telah dihapus; gunakan middleware hasil tool sebagai gantinya.

OpenClaw tidak menghapus atau menafsirkan ulang perilaku plugin yang terdokumentasi dalam perubahan yang sama
yang memperkenalkan penggantinya. Perubahan kontrak yang breaking harus terlebih dahulu melewati
adapter kompatibilitas, diagnostik, dokumentasi, dan jendela deprekasi.
Ini berlaku untuk impor SDK, field manifest, API setup, hook, dan perilaku
pendaftaran runtime.

<Warning>
  Lapisan kompatibilitas mundur akan dihapus dalam rilis mayor mendatang.
  Plugin yang masih mengimpor dari permukaan ini akan rusak saat itu terjadi.
  Pendaftaran factory ekstensi tertanam legacy sudah tidak lagi dimuat.
</Warning>

## Mengapa ini berubah

Pendekatan lama menyebabkan masalah:

- **Startup lambat** - mengimpor satu helper memuat puluhan modul yang tidak terkait
- **Dependensi melingkar** - ekspor ulang yang luas memudahkan terbentuknya siklus impor
- **Permukaan API tidak jelas** - tidak ada cara untuk mengetahui ekspor mana yang stabil dan mana yang internal

SDK plugin modern memperbaiki ini: setiap path impor (`openclaw/plugin-sdk/\<subpath\>`)
adalah modul kecil dan mandiri dengan tujuan yang jelas dan kontrak terdokumentasi.

Seam kemudahan provider legacy untuk channel bundel juga sudah dihapus.
Seam helper bermerek channel adalah pintasan mono-repo privat, bukan kontrak
plugin yang stabil. Gunakan subpath SDK generik yang sempit sebagai gantinya. Di dalam workspace
plugin bundel, simpan helper milik provider di `api.ts` atau
`runtime-api.ts` milik plugin itu sendiri.

Contoh provider bundel saat ini:

- Anthropic menyimpan helper stream khusus Claude di seam `api.ts` /
  `contract-api.ts` miliknya sendiri
- OpenAI menyimpan builder provider, helper model default, dan builder provider realtime
  di `api.ts` miliknya sendiri
- OpenRouter menyimpan builder provider dan helper onboarding/konfigurasi di
  `api.ts` miliknya sendiri

## Rencana migrasi Talk dan suara realtime

Kode suara realtime, telepon, meeting, dan Talk browser sedang dipindahkan dari
pencatatan giliran lokal permukaan ke pengontrol sesi Talk bersama yang diekspor oleh
`openclaw/plugin-sdk/realtime-voice`. Pengontrol baru memiliki envelope peristiwa Talk
umum, status giliran aktif, status capture, status output-audio, riwayat peristiwa terbaru,
dan penolakan giliran usang. Plugin provider harus tetap memiliki sesi realtime
khusus vendor; plugin permukaan harus tetap memiliki kekhasan capture,
playback, telepon, dan meeting.

Migrasi Talk ini sengaja dibuat bersih secara breaking:

1. Pertahankan primitive pengontrol/runtime bersama di
   `plugin-sdk/realtime-voice`.
2. Pindahkan permukaan bundel ke pengontrol bersama: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime, dan native push-to-talk.
3. Ganti keluarga RPC Talk lama dengan API final `talk.session.*` dan
   `talk.client.*`.
4. Iklankan satu channel peristiwa Talk live di Gateway
   `hello-ok.features.events`: `talk.event`.
5. Hapus endpoint HTTP realtime lama dan path override instruksi pada waktu request apa pun.

Kode baru tidak boleh memanggil `createTalkEventSequencer(...)` secara langsung kecuali sedang
mengimplementasikan adapter level rendah atau fixture test. Lebih baik gunakan pengontrol bersama
agar peristiwa dengan cakupan giliran tidak dapat dipancarkan tanpa id giliran, panggilan `turnEnd` /
`turnCancel` yang usang tidak dapat menghapus giliran aktif yang lebih baru, dan peristiwa lifecycle
output-audio tetap konsisten di seluruh telepon, meeting, browser relay, managed-room
handoff, dan klien Talk native.

Bentuk target API publik adalah:

```typescript
// Gateway-owned Talk session API.
await gateway.request("talk.session.create", {
  mode: "realtime",
  transport: "gateway-relay",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.session.appendAudio", { sessionId, audioBase64 });
await gateway.request("talk.session.cancelOutput", { sessionId, reason: "barge-in" });
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "working" },
  options: { willContinue: true },
});
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "already_delivered" },
  options: { suppressResponse: true },
});
await gateway.request("talk.session.submitToolResult", { sessionId, callId, result });
await gateway.request("talk.session.close", { sessionId });

// Client-owned provider session API.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

Sesi WebRTC/provider-websocket milik browser menggunakan `talk.client.create`,
karena browser memiliki negosiasi provider dan transport media sementara
Gateway memiliki kredensial, instruksi, dan kebijakan tool. `talk.session.*` adalah
permukaan umum yang dikelola Gateway untuk gateway-relay realtime, gateway-relay
transcription, dan sesi managed-room native STT/TTS.

Konfigurasi legacy yang menempatkan selector realtime di samping `talk.provider` /
`talk.providers` harus diperbaiki dengan `openclaw doctor --fix`; runtime Talk
tidak menafsirkan ulang konfigurasi provider speech/TTS sebagai konfigurasi provider realtime.

Kombinasi `talk.session.create` yang didukung sengaja dibuat kecil:

| Mode            | Transport       | Brain           | Pemilik            | Catatan                                                                                                            |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Audio provider full-duplex dijembatani melalui Gateway; panggilan tool dirutekan melalui tool agent-consult.      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Hanya streaming STT; pemanggil mengirim audio input dan menerima peristiwa transkrip.                             |
| `stt-tts`       | `managed-room`  | `agent-consult` | Ruang native/klien | Ruang bergaya push-to-talk dan walkie-talkie tempat klien memiliki capture/playback dan Gateway memiliki status giliran. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Ruang native/klien | Mode ruang khusus admin untuk permukaan first-party tepercaya yang mengeksekusi aksi tool Gateway secara langsung. |

Peta metode yang dihapus:

| Lama                             | Baru                                                     |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` atau `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

Kosakata kontrol terpadu juga sengaja dibuat sempit:

  | Metode                          | Berlaku untuk                                           | Kontrak                                                                                                                                                                                  |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Tambahkan potongan audio PCM base64 ke sesi penyedia yang dimiliki oleh koneksi Gateway yang sama.                                                                                       |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Mulai giliran pengguna managed-room.                                                                                                                                                     |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Akhiri giliran aktif setelah validasi stale-turn.                                                                                                                                        |
  | `talk.session.cancelTurn`       | semua sesi milik Gateway                                | Batalkan pekerjaan penangkapan/penyedia/agen/TTS aktif untuk suatu giliran.                                                                                                              |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Hentikan keluaran audio asisten tanpa harus mengakhiri giliran pengguna.                                                                                                                 |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Selesaikan panggilan alat penyedia yang dipancarkan oleh relay; berikan `options.willContinue` untuk keluaran sementara atau `options.suppressResponse` untuk memenuhi panggilan tanpa respons asisten lain. |
  | `talk.session.steer`            | sesi Talk yang didukung agen                            | Kirim kontrol lisan `status`, `steer`, `cancel`, atau `followup` ke run tertanam aktif yang diselesaikan dari sesi Talk.                                                                 |
  | `talk.session.close`            | semua sesi terpadu                                      | Hentikan sesi relay atau cabut status managed-room, lalu lupakan id sesi terpadu.                                                                                                        |

  Jangan memperkenalkan kasus khusus penyedia atau platform di core agar ini berfungsi.
  Core memiliki semantik sesi Talk. Plugin penyedia memiliki penyiapan sesi vendor.
  Panggilan suara dan Google Meet memiliki adapter telepon/rapat. Browser dan aplikasi
  native memiliki UX penangkapan/pemutaran perangkat.

  ## Kebijakan kompatibilitas

  Untuk plugin eksternal, pekerjaan kompatibilitas mengikuti urutan ini:

  1. tambahkan kontrak baru
  2. pertahankan perilaku lama yang dihubungkan melalui adapter kompatibilitas
  3. pancarkan diagnostik atau peringatan yang menyebutkan jalur lama dan penggantinya
  4. cakup kedua jalur dalam pengujian
  5. dokumentasikan deprekasi dan jalur migrasi
  6. hapus hanya setelah jendela migrasi yang diumumkan, biasanya dalam rilis mayor

  Pengelola dapat mengaudit antrean migrasi saat ini dengan
  `pnpm plugins:boundary-report`. Gunakan `pnpm plugins:boundary-report:summary` untuk
  jumlah ringkas, `--owner <id>` untuk satu plugin atau pemilik kompatibilitas, dan
  `pnpm plugins:boundary-report:ci` ketika gate CI harus gagal pada catatan
  kompatibilitas yang jatuh tempo, impor SDK cadangan lintas pemilik, atau subpath SDK
  cadangan yang tidak digunakan. Laporan mengelompokkan catatan kompatibilitas
  yang dideprekasi berdasarkan tanggal penghapusan, menghitung referensi kode/dokumen
  lokal, memunculkan impor SDK cadangan lintas pemilik, dan merangkum bridge SDK
  memory-host privat agar pembersihan kompatibilitas tetap eksplisit alih-alih
  mengandalkan pencarian ad hoc. Subpath SDK cadangan harus memiliki penggunaan
  pemilik yang terlacak; ekspor helper cadangan yang tidak digunakan harus dihapus
  dari SDK publik.

  Jika field manifest masih diterima, penulis plugin dapat tetap menggunakannya sampai
  dokumentasi dan diagnostik menyatakan sebaliknya. Kode baru sebaiknya memilih
  pengganti yang terdokumentasi, tetapi plugin yang ada tidak boleh rusak selama
  rilis minor biasa.

  ## Cara bermigrasi

  <Steps>
  <Step title="Migrasikan helper pemuatan/penulisan konfigurasi runtime">
    Plugin bundel harus berhenti memanggil
    `api.runtime.config.loadConfig()` dan
    `api.runtime.config.writeConfigFile(...)` secara langsung. Pilih konfigurasi yang
    sudah diteruskan ke jalur panggilan aktif. Handler berumur panjang yang memerlukan
    snapshot proses saat ini dapat menggunakan `api.runtime.config.current()`. Alat
    agen berumur panjang harus menggunakan `ctx.getRuntimeConfig()` milik konteks alat di dalam
    `execute` agar alat yang dibuat sebelum penulisan konfigurasi tetap melihat
    konfigurasi runtime yang diperbarui.

    Penulisan konfigurasi harus melalui helper transaksional dan memilih kebijakan
    setelah penulisan:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Gunakan `afterWrite: { mode: "restart", reason: "..." }` ketika pemanggil tahu
    perubahan tersebut memerlukan restart Gateway yang bersih, dan
    `afterWrite: { mode: "none", reason: "..." }` hanya ketika pemanggil memiliki
    tindak lanjutnya dan sengaja ingin menekan perencana reload.
    Hasil mutasi menyertakan ringkasan `followUp` bertipe untuk pengujian dan logging;
    Gateway tetap bertanggung jawab untuk menerapkan atau menjadwalkan restart.
    `loadConfig` dan `writeConfigFile` tetap menjadi helper kompatibilitas yang
    dideprekasi untuk plugin eksternal selama jendela migrasi dan memperingatkan sekali dengan
    kode kompatibilitas `runtime-config-load-write`. Plugin bundel dan kode runtime repo
    dilindungi oleh guardrail pemindai di
    `pnpm check:deprecated-api-usage` dan
    `pnpm check:no-runtime-action-load-config`: penggunaan plugin produksi baru
    langsung gagal, penulisan konfigurasi langsung gagal, metode server Gateway harus menggunakan
    snapshot runtime permintaan, helper pengiriman/tindakan/klien channel runtime
    harus menerima konfigurasi dari batasnya, dan modul runtime berumur panjang memiliki
    nol panggilan ambient `loadConfig()` yang diizinkan.

    Kode plugin baru juga harus menghindari mengimpor barrel kompatibilitas luas
    `openclaw/plugin-sdk/config-runtime`. Gunakan subpath SDK sempit yang cocok
    dengan pekerjaannya:

    | Kebutuhan | Impor |
    | --- | --- |
    | Tipe konfigurasi seperti `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Pernyataan konfigurasi yang sudah dimuat dan lookup konfigurasi plugin-entry | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Pembacaan snapshot runtime saat ini | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Penulisan konfigurasi | `openclaw/plugin-sdk/config-mutation` |
    | Helper penyimpanan sesi | `openclaw/plugin-sdk/session-store-runtime` |
    | Konfigurasi tabel Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helper runtime kebijakan grup | `openclaw/plugin-sdk/runtime-group-policy` |
    | Resolusi input rahasia | `openclaw/plugin-sdk/secret-input-runtime` |
    | Override model/sesi | `openclaw/plugin-sdk/model-session-runtime` |

    Plugin bundel dan pengujiannya dijaga pemindai terhadap barrel luas
    agar impor dan mock tetap lokal pada perilaku yang mereka butuhkan. Barrel luas
    masih ada untuk kompatibilitas eksternal, tetapi kode baru tidak boleh
    bergantung padanya.

  </Step>

  <Step title="Migrasikan ekstensi hasil alat tertanam ke middleware">
    Plugin bundel harus mengganti handler hasil alat khusus embedded-runner
    `api.registerEmbeddedExtensionFactory(...)` dengan middleware yang netral terhadap runtime.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    Perbarui manifest plugin pada saat yang sama:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Plugin terinstal juga dapat mendaftarkan middleware hasil alat ketika mereka
    diaktifkan secara eksplisit dan mendeklarasikan setiap runtime yang ditargetkan di
    `contracts.agentToolResultMiddleware`. Pendaftaran middleware terinstal yang tidak
    dideklarasikan akan ditolak.

  </Step>

  <Step title="Migrasikan handler native persetujuan ke fakta kapabilitas">
    Plugin channel yang mendukung persetujuan sekarang mengekspos perilaku persetujuan native melalui
    `approvalCapability.nativeRuntime` ditambah registry konteks-runtime bersama.

    Perubahan utama:

    - Ganti `approvalCapability.handler.loadRuntime(...)` dengan
      `approvalCapability.nativeRuntime`
    - Pindahkan auth/pengiriman khusus persetujuan dari wiring lama `plugin.auth` /
      `plugin.approvals` ke `approvalCapability`
    - `ChannelPlugin.approvals` telah dihapus dari kontrak channel-plugin publik;
      pindahkan field pengiriman/native/render ke `approvalCapability`
    - `plugin.auth` tetap hanya untuk alur login/logout channel; hook auth persetujuan
      di sana tidak lagi dibaca oleh core
    - Daftarkan objek runtime milik channel seperti klien, token, atau aplikasi Bolt
      melalui `openclaw/plugin-sdk/channel-runtime-context`
    - Jangan kirim pemberitahuan reroute milik plugin dari handler persetujuan native;
      core sekarang memiliki pemberitahuan dialihkan-ke-tempat-lain dari hasil pengiriman aktual
    - Saat meneruskan `channelRuntime` ke `createChannelManager(...)`, berikan
      permukaan `createPluginRuntime().channel` yang nyata. Stub parsial ditolak.

    Lihat `/plugins/sdk-channel-plugins` untuk tata letak kapabilitas persetujuan saat ini.

  </Step>

  <Step title="Audit perilaku fallback wrapper Windows">
    Jika plugin Anda menggunakan `openclaw/plugin-sdk/windows-spawn`, wrapper Windows
    `.cmd`/`.bat` yang tidak terselesaikan sekarang gagal tertutup kecuali Anda secara eksplisit meneruskan
    `allowShellFallback: true`.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    Jika pemanggil Anda tidak sengaja bergantung pada fallback shell, jangan setel
    `allowShellFallback` dan tangani error yang dilempar sebagai gantinya.

  </Step>

  <Step title="Temukan impor yang dideprekasi">
    Cari plugin Anda untuk impor dari salah satu permukaan yang dideprekasi:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Ganti dengan impor terfokus">
    Setiap ekspor dari permukaan lama dipetakan ke jalur impor modern tertentu:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Untuk helper sisi host, gunakan runtime plugin yang diinjeksikan alih-alih mengimpor
    secara langsung:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Pola yang sama berlaku untuk helper bridge lama lainnya:

    | Impor lama | Padanan modern |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helper penyimpanan sesi | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Ganti impor infra-runtime yang luas">
    `openclaw/plugin-sdk/infra-runtime` masih ada untuk kompatibilitas
    eksternal, tetapi kode baru sebaiknya mengimpor permukaan helper terfokus
    yang benar-benar dibutuhkannya:

    | Kebutuhan | Impor |
    | --- | --- |
    | Helper antrean event sistem | `openclaw/plugin-sdk/system-event-runtime` |
    | Helper bangun, event, dan visibilitas Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Pengurasan antrean pengiriman tertunda | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetri aktivitas channel | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Cache dedupe dalam memori | `openclaw/plugin-sdk/dedupe-runtime` |
    | Helper path file/media lokal yang aman | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch yang sadar dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Helper proxy dan fetch terlindungi | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipe kebijakan dispatcher SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipe permintaan/resolusi persetujuan | `openclaw/plugin-sdk/approval-runtime` |
    | Helper payload balasan persetujuan dan perintah | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helper pemformatan kesalahan | `openclaw/plugin-sdk/error-runtime` |
    | Penantian kesiapan transport | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helper token aman | `openclaw/plugin-sdk/secure-random-runtime` |
    | Konkurensi tugas asinkron berbatas | `openclaw/plugin-sdk/concurrency-runtime` |
    | Koersi numerik | `openclaw/plugin-sdk/number-runtime` |
    | Kunci asinkron lokal proses | `openclaw/plugin-sdk/async-lock-runtime` |
    | Kunci file | `openclaw/plugin-sdk/file-lock` |

    Plugin bawaan dilindungi pemindai dari `infra-runtime`, sehingga kode repo
    tidak dapat mundur lagi ke barrel yang luas.

  </Step>

  <Step title="Migrasikan helper route channel">
    Kode route channel baru sebaiknya menggunakan `openclaw/plugin-sdk/channel-route`.
    Nama route-key dan comparable-target yang lebih lama tetap ada sebagai alias
    kompatibilitas selama jendela migrasi, tetapi Plugin baru sebaiknya menggunakan nama route
    yang langsung mendeskripsikan perilakunya:

    | Helper lama | Helper modern |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Helper route modern menormalkan `{ channel, to, accountId, threadId }`
    secara konsisten di seluruh persetujuan native, penekanan balasan, dedupe masuk,
    pengiriman cron, dan routing sesi.

    Jangan tambahkan penggunaan baru `ChannelMessagingAdapter.parseExplicitTarget` atau
    helper loaded-route berbasis parser (`parseExplicitTargetForLoadedChannel`
    atau `resolveRouteTargetForLoadedChannel`) atau
    `resolveChannelRouteTargetWithParser(...)` dari `plugin-sdk/channel-route`.
    Hook tersebut sudah usang dan tetap ada hanya untuk Plugin lama selama
    jendela migrasi. Plugin channel baru sebaiknya menggunakan
    `messaging.targetResolver.resolveTarget(...)` untuk normalisasi id target
    dan fallback ketika direktori tidak ditemukan, `messaging.inferTargetChatType(...)` ketika core
    membutuhkan jenis peer awal, dan `messaging.resolveOutboundSessionRoute(...)`
    untuk sesi native provider dan identitas thread.

  </Step>

  <Step title="Build dan uji">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referensi path impor

  <Accordion title="Common import path table">
  | Jalur impor | Tujuan | Ekspor utama |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Pembantu entri Plugin kanonis | `definePluginEntry` |
  | `plugin-sdk/core` | Ekspor ulang payung lama untuk definisi/pembangun entri saluran | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Ekspor skema konfigurasi root | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Pembantu entri penyedia tunggal | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definisi dan pembangun entri saluran yang terfokus | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Pembantu wizard penyiapan bersama | Penerjemah penyiapan, prompt daftar izin, pembangun status penyiapan |
  | `plugin-sdk/setup-runtime` | Pembantu runtime saat penyiapan | `createSetupTranslator`, adaptor patch penyiapan yang aman diimpor, pembantu catatan pencarian, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy penyiapan terdelegasi |
  | `plugin-sdk/setup-adapter-runtime` | Alias adaptor penyiapan yang tidak digunakan lagi | Gunakan `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Pembantu perkakas penyiapan | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Pembantu multi-akun | Pembantu daftar akun/konfigurasi/gerbang tindakan |
  | `plugin-sdk/account-id` | Pembantu ID akun | `DEFAULT_ACCOUNT_ID`, normalisasi ID akun |
  | `plugin-sdk/account-resolution` | Pembantu pencarian akun | Pembantu pencarian akun + fallback bawaan |
  | `plugin-sdk/account-helpers` | Pembantu akun sempit | Pembantu daftar akun/tindakan akun |
  | `plugin-sdk/channel-setup` | Adaptor wizard penyiapan | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitif pemasangan DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Pengawatan prefiks balasan, pengetikan, dan pengiriman sumber | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Factory adaptor konfigurasi dan pembantu akses DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Pembangun skema konfigurasi | Primitif skema konfigurasi saluran bersama dan hanya pembangun generik |
  | `plugin-sdk/bundled-channel-config-schema` | Skema konfigurasi bawaan | Hanya Plugin bawaan yang dikelola OpenClaw; Plugin baru harus mendefinisikan skema lokal Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Skema konfigurasi bawaan yang tidak digunakan lagi | Hanya alias kompatibilitas; gunakan `plugin-sdk/bundled-channel-config-schema` untuk Plugin bawaan yang dipelihara |
  | `plugin-sdk/telegram-command-config` | Pembantu konfigurasi perintah Telegram | Normalisasi nama perintah, pemangkasan deskripsi, validasi duplikat/konflik |
  | `plugin-sdk/channel-policy` | Resolusi kebijakan grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Fasad kompatibilitas yang tidak digunakan lagi | Gunakan `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Pembantu amplop masuk | Pembantu rute bersama + pembangun amplop |
  | `plugin-sdk/channel-inbound` | Pembantu penerimaan masuk | Pembangunan konteks, pemformatan, root, runner, pengiriman balasan yang disiapkan, dan predikat pengiriman |
  | `plugin-sdk/messaging-targets` | Jalur impor penguraian target yang tidak digunakan lagi | Gunakan `plugin-sdk/channel-targets` untuk pembantu penguraian target generik, `plugin-sdk/channel-route` untuk perbandingan rute, dan `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` milik Plugin untuk resolusi target khusus penyedia |
  | `plugin-sdk/outbound-media` | Pembantu media keluar | Pemuatan media keluar bersama |
  | `plugin-sdk/outbound-send-deps` | Fasad kompatibilitas yang tidak digunakan lagi | Gunakan `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Pembantu daur hidup pesan keluar | Adaptor pesan, tanda terima, pembantu pengiriman tahan lama, pembantu pratinjau langsung/streaming, opsi balasan, pembantu daur hidup, identitas keluar, dan perencanaan payload |
  | `plugin-sdk/channel-streaming` | Fasad kompatibilitas yang tidak digunakan lagi | Gunakan `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Fasad kompatibilitas yang tidak digunakan lagi | Gunakan `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Pembantu pengikatan thread | Pembantu daur hidup pengikatan thread dan adaptor |
  | `plugin-sdk/agent-media-payload` | Pembantu payload media lama | Pembangun payload media agen untuk tata letak field lama |
  | `plugin-sdk/channel-runtime` | Shim kompatibilitas yang tidak digunakan lagi | Hanya utilitas runtime saluran lama |
  | `plugin-sdk/channel-send-result` | Tipe hasil pengiriman | Tipe hasil balasan |
  | `plugin-sdk/runtime-store` | Penyimpanan Plugin persisten | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Pembantu runtime luas | Pembantu runtime/logging/cadangan/pemasangan Plugin |
  | `plugin-sdk/runtime-env` | Pembantu env runtime sempit | Pembantu logger/env runtime, timeout, percobaan ulang, dan backoff |
  | `plugin-sdk/plugin-runtime` | Pembantu runtime Plugin bersama | Pembantu perintah/hook/http/interaktif Plugin |
  | `plugin-sdk/hook-runtime` | Pembantu pipeline hook | Pembantu pipeline Webhook/hook internal bersama |
  | `plugin-sdk/lazy-runtime` | Pembantu runtime malas | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Pembantu proses | Pembantu exec bersama |
  | `plugin-sdk/cli-runtime` | Pembantu runtime CLI | Pemformatan perintah, penantian, pembantu versi |
  | `plugin-sdk/gateway-runtime` | Pembantu Gateway | Klien Gateway, pembantu mulai yang siap event-loop, dan pembantu patch status saluran |
  | `plugin-sdk/config-runtime` | Shim kompatibilitas konfigurasi yang tidak digunakan lagi | Lebih pilih `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, dan `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Pembantu perintah Telegram | Pembantu validasi perintah Telegram yang stabil untuk fallback ketika permukaan kontrak Telegram bawaan tidak tersedia |
  | `plugin-sdk/approval-runtime` | Pembantu prompt persetujuan | Payload persetujuan exec/Plugin, pembantu kapabilitas/profil persetujuan, pembantu routing/runtime persetujuan native, dan pemformatan jalur tampilan persetujuan terstruktur |
  | `plugin-sdk/approval-auth-runtime` | Pembantu otorisasi persetujuan | Resolusi pemberi persetujuan, otorisasi tindakan chat yang sama |
  | `plugin-sdk/approval-client-runtime` | Pembantu klien persetujuan | Pembantu profil/filter persetujuan exec native |
  | `plugin-sdk/approval-delivery-runtime` | Pembantu pengiriman persetujuan | Adaptor kapabilitas/pengiriman persetujuan native |
  | `plugin-sdk/approval-gateway-runtime` | Pembantu Gateway persetujuan | Pembantu resolusi Gateway persetujuan bersama |
  | `plugin-sdk/approval-handler-adapter-runtime` | Pembantu adaptor persetujuan | Pembantu pemuatan adaptor persetujuan native ringan untuk entrypoint saluran panas |
  | `plugin-sdk/approval-handler-runtime` | Pembantu handler persetujuan | Pembantu runtime handler persetujuan yang lebih luas; lebih pilih batas adaptor/Gateway yang lebih sempit ketika sudah cukup |
  | `plugin-sdk/approval-native-runtime` | Pembantu target persetujuan | Pembantu pengikatan target/akun persetujuan native |
  | `plugin-sdk/approval-reply-runtime` | Pembantu balasan persetujuan | Pembantu payload balasan persetujuan exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Pembantu konteks runtime saluran | Pembantu generik daftar/ambil/pantau konteks runtime saluran |
  | `plugin-sdk/security-runtime` | Pembantu keamanan | Pembantu trust bersama, pembatasan DM, file/jalur berbatas root, konten eksternal, dan pengumpulan secret |
  | `plugin-sdk/ssrf-policy` | Pembantu kebijakan SSRF | Pembantu daftar izin host dan kebijakan jaringan privat |
  | `plugin-sdk/ssrf-runtime` | Pembantu runtime SSRF | Dispatcher terpancang, fetch yang dijaga, pembantu kebijakan SSRF |
  | `plugin-sdk/system-event-runtime` | Pembantu peristiwa sistem | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Pembantu Heartbeat | Pembantu bangun, peristiwa, dan visibilitas Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Pembantu antrean pengiriman | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Pembantu aktivitas saluran | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Pembantu deduplikasi | Cache deduplikasi dalam memori |
  | `plugin-sdk/file-access-runtime` | Pembantu akses file | Pembantu jalur file/media lokal yang aman |
  | `plugin-sdk/transport-ready-runtime` | Pembantu kesiapan transport | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Pembantu kebijakan persetujuan exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Pembantu cache berbatas | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Pembantu gerbang diagnostik | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Pembantu pemformatan kesalahan | `formatUncaughtError`, `isApprovalNotFoundError`, pembantu graf kesalahan |
  | `plugin-sdk/fetch-runtime` | Pembantu fetch/proxy terbungkus | `resolveFetch`, pembantu proxy, pembantu opsi EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Pembantu normalisasi host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Pembantu percobaan ulang | `RetryConfig`, `retryAsync`, runner kebijakan |
  | `plugin-sdk/allow-from` | Pemformatan daftar izin dan pemetaan input | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Pembantu gerbang perintah dan permukaan perintah | `resolveControlCommandGate`, pembantu otorisasi pengirim, pembantu registri perintah termasuk pemformatan menu argumen dinamis |
  | `plugin-sdk/command-status` | Perender status/bantuan perintah | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Penguraian input secret | Pembantu input secret |
  | `plugin-sdk/webhook-ingress` | Pembantu permintaan Webhook | Utilitas target Webhook |
  | `plugin-sdk/webhook-request-guards` | Pembantu penjaga body Webhook | Pembantu baca/batas body permintaan |
  | `plugin-sdk/reply-runtime` | Runtime balasan bersama | Pengiriman masuk, Heartbeat, perencana balasan, pemotongan chunk |
  | `plugin-sdk/reply-dispatch-runtime` | Pembantu pengiriman balasan sempit | Finalisasi, pengiriman penyedia, dan pembantu label percakapan |
  | `plugin-sdk/reply-history` | Pembantu riwayat balasan | `createChannelHistoryWindow`; ekspor kompatibilitas pembantu map yang tidak digunakan lagi seperti `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, dan `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Perencanaan referensi balasan | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Pembantu chunk balasan | Pembantu pemotongan chunk teks/markdown |
  | `plugin-sdk/session-store-runtime` | Pembantu penyimpanan sesi | Pembantu jalur penyimpanan + updated-at |
  | `plugin-sdk/state-paths` | Pembantu jalur status | Pembantu direktori status dan OAuth |
  | `plugin-sdk/routing` | Pembantu perutean/kunci sesi | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, pembantu normalisasi kunci sesi |
  | `plugin-sdk/status-helpers` | Pembantu status kanal | Pembuat ringkasan status kanal/akun, nilai bawaan status runtime, pembantu metadata isu |
  | `plugin-sdk/target-resolver-runtime` | Pembantu penyelesai target | Pembantu penyelesai target bersama |
  | `plugin-sdk/string-normalization-runtime` | Pembantu normalisasi string | Pembantu normalisasi slug/string |
  | `plugin-sdk/request-url` | Pembantu URL permintaan | Mengekstrak URL string dari masukan mirip permintaan |
  | `plugin-sdk/run-command` | Pembantu perintah berwaktu | Runner perintah berwaktu dengan stdout/stderr ternormalisasi |
  | `plugin-sdk/param-readers` | Pembaca param | Pembaca param umum untuk alat/CLI |
  | `plugin-sdk/tool-payload` | Ekstraksi payload alat | Mengekstrak payload ternormalisasi dari objek hasil alat |
  | `plugin-sdk/tool-send` | Ekstraksi pengiriman alat | Mengekstrak bidang target pengiriman kanonis dari argumen alat |
  | `plugin-sdk/temp-path` | Pembantu jalur sementara | Pembantu jalur unduhan sementara bersama |
  | `plugin-sdk/logging-core` | Pembantu pencatatan log | Pembantu logger subsistem dan penyamaran |
  | `plugin-sdk/markdown-table-runtime` | Pembantu tabel Markdown | Pembantu mode tabel Markdown |
  | `plugin-sdk/reply-payload` | Tipe balasan pesan | Tipe payload balasan |
  | `plugin-sdk/provider-setup` | Pembantu penyiapan penyedia lokal/self-hosted terkurasi | Pembantu penemuan/konfigurasi penyedia self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Pembantu penyiapan penyedia self-hosted kompatibel OpenAI yang terfokus | Pembantu penemuan/konfigurasi penyedia self-hosted yang sama |
  | `plugin-sdk/provider-auth-runtime` | Pembantu autentikasi runtime penyedia | Pembantu resolusi kunci API runtime |
  | `plugin-sdk/provider-auth-api-key` | Pembantu penyiapan kunci API penyedia | Pembantu onboarding/penulisan profil kunci API |
  | `plugin-sdk/provider-auth-result` | Pembantu hasil autentikasi penyedia | Pembuat hasil autentikasi OAuth standar |
  | `plugin-sdk/provider-selection-runtime` | Pembantu pemilihan penyedia | Pemilihan penyedia terkonfigurasi atau otomatis dan penggabungan konfigurasi penyedia mentah |
  | `plugin-sdk/provider-env-vars` | Pembantu env-var penyedia | Pembantu pencarian env-var autentikasi penyedia |
  | `plugin-sdk/provider-model-shared` | Pembantu model/replay penyedia bersama | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, pembuat kebijakan replay bersama, pembantu endpoint penyedia, dan pembantu normalisasi id model |
  | `plugin-sdk/provider-catalog-shared` | Pembantu katalog penyedia bersama | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch onboarding penyedia | Pembantu konfigurasi onboarding |
  | `plugin-sdk/provider-http` | Pembantu HTTP penyedia | Pembantu kapabilitas HTTP/endpoint penyedia generik, termasuk pembantu formulir multipart transkripsi audio |
  | `plugin-sdk/provider-web-fetch` | Pembantu web-fetch penyedia | Pembantu pendaftaran/cache penyedia web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Pembantu konfigurasi web-search penyedia | Pembantu konfigurasi/kredensial web-search sempit untuk penyedia yang tidak memerlukan wiring pengaktifan plugin |
  | `plugin-sdk/provider-web-search-contract` | Pembantu kontrak web-search penyedia | Pembantu kontrak konfigurasi/kredensial web-search sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, dan setter/getter kredensial berlingkup |
  | `plugin-sdk/provider-web-search` | Pembantu web-search penyedia | Pembantu pendaftaran/cache/runtime penyedia web-search |
  | `plugin-sdk/provider-tools` | Pembantu kompatibilitas alat/skema penyedia | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, dan pembersihan skema + diagnostik DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Pembantu penggunaan penyedia | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, dan pembantu penggunaan penyedia lainnya |
  | `plugin-sdk/provider-stream` | Pembantu pembungkus stream penyedia | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe pembungkus stream, dan pembantu pembungkus bersama Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Pembantu transport penyedia | Pembantu transport penyedia native seperti fetch terjaga, transformasi pesan transport, dan stream peristiwa transport yang dapat ditulis |
  | `plugin-sdk/keyed-async-queue` | Antrean asinkron berurutan | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Pembantu media bersama | Pembantu pengambilan/transformasi/penyimpanan media, probing dimensi video berbasis ffprobe, dan pembuat payload media |
  | `plugin-sdk/media-generation-runtime` | Pembantu pembuatan media bersama | Pembantu failover bersama, pemilihan kandidat, dan pesan model hilang untuk pembuatan gambar/video/musik |
  | `plugin-sdk/media-understanding` | Pembantu pemahaman media | Tipe penyedia pemahaman media serta ekspor pembantu gambar/audio yang menghadap penyedia |
  | `plugin-sdk/text-runtime` | Ekspor kompatibilitas teks luas yang tidak digunakan lagi | Gunakan `string-coerce-runtime`, `text-chunking`, `text-utility-runtime`, dan `logging-core` |
  | `plugin-sdk/text-chunking` | Pembantu pemotongan teks | Pembantu pemotongan teks keluar |
  | `plugin-sdk/speech` | Pembantu wicara | Tipe penyedia wicara serta pembantu direktif, registri, validasi yang menghadap penyedia, dan pembuat TTS kompatibel OpenAI |
  | `plugin-sdk/speech-core` | Inti wicara bersama | Tipe penyedia wicara, registri, direktif, normalisasi |
  | `plugin-sdk/realtime-transcription` | Pembantu transkripsi realtime | Tipe penyedia, pembantu registri, dan pembantu sesi WebSocket bersama |
  | `plugin-sdk/realtime-voice` | Pembantu suara realtime | Tipe penyedia, pembantu registri/resolusi, pembantu sesi bridge, antrean balasan bicara agen bersama, kontrol suara run aktif, kesehatan transkrip/peristiwa, penekanan gema, pencocokan pertanyaan konsultasi, koordinasi konsultasi paksa, pelacakan konteks giliran, pelacakan aktivitas keluaran, dan pembantu konsultasi konteks cepat |
  | `plugin-sdk/image-generation` | Pembantu pembuatan gambar | Tipe penyedia pembuatan gambar serta pembantu aset gambar/data URL dan pembuat penyedia gambar kompatibel OpenAI |
  | `plugin-sdk/image-generation-core` | Inti pembuatan gambar bersama | Tipe pembuatan gambar, failover, autentikasi, dan pembantu registri |
  | `plugin-sdk/music-generation` | Pembantu pembuatan musik | Tipe penyedia/permintaan/hasil pembuatan musik |
  | `plugin-sdk/music-generation-core` | Inti pembuatan musik bersama | Tipe pembuatan musik, pembantu failover, pencarian penyedia, dan parsing ref model |
  | `plugin-sdk/video-generation` | Pembantu pembuatan video | Tipe penyedia/permintaan/hasil pembuatan video |
  | `plugin-sdk/video-generation-core` | Inti pembuatan video bersama | Tipe pembuatan video, pembantu failover, pencarian penyedia, dan parsing ref model |
  | `plugin-sdk/interactive-runtime` | Pembantu balasan interaktif | Normalisasi/reduksi payload balasan interaktif |
  | `plugin-sdk/channel-config-primitives` | Primitif konfigurasi kanal | Primitif skema konfigurasi kanal sempit |
  | `plugin-sdk/channel-config-writes` | Pembantu penulisan konfigurasi kanal | Pembantu otorisasi penulisan konfigurasi kanal |
  | `plugin-sdk/channel-plugin-common` | Prelude kanal bersama | Ekspor prelude Plugin kanal bersama |
  | `plugin-sdk/channel-status` | Pembantu status kanal | Pembantu snapshot/ringkasan status kanal bersama |
  | `plugin-sdk/allowlist-config-edit` | Pembantu konfigurasi daftar-izin | Pembantu edit/baca konfigurasi daftar-izin |
  | `plugin-sdk/group-access` | Pembantu akses grup | Pembantu keputusan akses grup bersama |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fasad kompatibilitas yang tidak digunakan lagi | Gunakan `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Pembantu penjaga DM langsung | Pembantu kebijakan penjaga pra-crypto sempit |
  | `plugin-sdk/extension-shared` | Pembantu ekstensi bersama | Primitif pembantu kanal pasif/status dan proksi sekitar |
  | `plugin-sdk/webhook-targets` | Pembantu target Webhook | Pembantu registri target Webhook dan pemasangan rute |
  | `plugin-sdk/webhook-path` | Alias jalur webhook yang tidak digunakan lagi | Gunakan `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Pembantu media web bersama | Pembantu pemuatan media remote/lokal |
  | `plugin-sdk/zod` | Ekspor ulang kompatibilitas Zod yang tidak digunakan lagi | Impor `zod` dari `zod` secara langsung |
  | `plugin-sdk/memory-core` | Pembantu memory-core terbundel | Permukaan pembantu pengelola/konfigurasi/file/CLI memori |
  | `plugin-sdk/memory-core-engine-runtime` | Fasad runtime mesin memori | Fasad runtime indeks/pencarian memori |
  | `plugin-sdk/memory-core-host-embedding-registry` | Registri embedding memori | Pembantu registri penyedia embedding memori ringan |
  | `plugin-sdk/memory-core-host-engine-foundation` | Mesin fondasi host memori | Ekspor mesin fondasi host memori |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Mesin embedding host memori | Kontrak embedding memori, akses registri, penyedia lokal, dan pembantu batch/remote generik; penyedia remote konkret berada di Plugin pemiliknya |
  | `plugin-sdk/memory-core-host-engine-qmd` | Mesin QMD host memori | Ekspor mesin QMD host memori |
  | `plugin-sdk/memory-core-host-engine-storage` | Mesin penyimpanan host memori | Ekspor mesin penyimpanan host memori |
  | `plugin-sdk/memory-core-host-multimodal` | Pembantu multimodal host memori | Pembantu multimodal host memori |
  | `plugin-sdk/memory-core-host-query` | Pembantu kueri host memori | Pembantu kueri host memori |
  | `plugin-sdk/memory-core-host-secret` | Pembantu rahasia host memori | Pembantu rahasia host memori |
  | `plugin-sdk/memory-core-host-events` | Alias peristiwa memori yang tidak digunakan lagi | Gunakan `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Pembantu status host memori | Pembantu status host memori |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI host memori | Pembantu runtime CLI host memori |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime inti host memori | Pembantu runtime inti host memori |
  | `plugin-sdk/memory-core-host-runtime-files` | Pembantu file/runtime host memori | Pembantu file/runtime host memori |
  | `plugin-sdk/memory-host-core` | Alias runtime inti host memori | Alias netral-vendor untuk pembantu runtime inti host memori |
  | `plugin-sdk/memory-host-events` | Alias jurnal peristiwa host memori | Alias netral-vendor untuk pembantu jurnal peristiwa host memori |
  | `plugin-sdk/memory-host-files` | Alias file/runtime memori yang tidak digunakan lagi | Gunakan `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Pembantu markdown terkelola | Pembantu markdown terkelola bersama untuk Plugin yang berdekatan dengan memori |
  | `plugin-sdk/memory-host-search` | Fasad pencarian Active Memory | Fasad runtime pengelola pencarian active-memory yang malas dimuat |
  | `plugin-sdk/memory-host-status` | Alias status host memori yang tidak digunakan lagi | Gunakan `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Utilitas pengujian | Barrel kompatibilitas usang lokal-repo; gunakan subjalur pengujian lokal-repo yang terfokus seperti `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`, dan `plugin-sdk/test-fixtures` |
</Accordion>

Tabel ini sengaja berisi subset migrasi umum, bukan seluruh permukaan SDK.
Inventaris entrypoint compiler berada di
`scripts/lib/plugin-sdk-entrypoints.json`; ekspor paket dihasilkan dari
subset publik.

Seam helper plugin bawaan yang dicadangkan telah dihentikan dari peta ekspor
SDK publik kecuali facade kompatibilitas yang didokumentasikan secara eksplisit
seperti shim `plugin-sdk/discord` yang sudah tidak digunakan lagi tetapi
dipertahankan untuk paket `@openclaw/discord@2026.3.13` yang telah
dipublikasikan. Helper khusus pemilik berada di dalam paket plugin pemiliknya;
perilaku host bersama harus bergerak melalui kontrak SDK generik seperti
`plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, dan
`plugin-sdk/plugin-config-runtime`.

Gunakan impor tersempit yang sesuai dengan tugasnya. Jika Anda tidak dapat
menemukan ekspor, periksa sumber di `src/plugin-sdk/` atau tanyakan kepada
maintainer kontrak generik mana yang seharusnya memilikinya.

## Depresiasi aktif

Depresiasi yang lebih sempit yang berlaku di seluruh SDK plugin, kontrak
provider, permukaan runtime, dan manifest. Masing-masing masih berfungsi hari
ini tetapi akan dihapus dalam rilis mayor mendatang. Entri di bawah setiap item
memetakan API lama ke pengganti kanonisnya.

<AccordionGroup>
  <Accordion title="builder bantuan command-auth → command-status">
    **Lama (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Baru (`openclaw/plugin-sdk/command-status`)**: signature yang sama,
    ekspor yang sama - hanya diimpor dari subpath yang lebih sempit.
    `command-auth` mengekspornya ulang sebagai stub kompatibilitas.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Helper mention gating → resolveInboundMentionDecision">
    **Lama**: `resolveInboundMentionRequirement({ facts, policy })` dan
    `shouldDropInboundForMention(...)` dari
    `openclaw/plugin-sdk/channel-inbound` atau
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Baru**: `resolveInboundMentionDecision({ facts, policy })` - mengembalikan
    satu objek keputusan, bukan dua panggilan terpisah.

    Plugin channel hilir (Slack, Discord, Matrix, MS Teams) sudah beralih.

  </Accordion>

  <Accordion title="Shim runtime channel dan helper aksi channel">
    `openclaw/plugin-sdk/channel-runtime` adalah shim kompatibilitas untuk
    plugin channel lama. Jangan mengimpornya dari kode baru; gunakan
    `openclaw/plugin-sdk/channel-runtime-context` untuk mendaftarkan objek
    runtime.

    Helper `channelActions*` di `openclaw/plugin-sdk/channel-actions` sudah
    tidak digunakan lagi bersama ekspor channel "actions" mentah. Paparkan
    kapabilitas melalui permukaan semantik `presentation` sebagai gantinya -
    plugin channel mendeklarasikan apa yang mereka render (kartu, tombol,
    pilihan) alih-alih nama aksi mentah mana yang mereka terima.

  </Accordion>

  <Accordion title="Helper tool() provider pencarian web → createTool() pada plugin">
    **Lama**: factory `tool()` dari `openclaw/plugin-sdk/provider-web-search`.

    **Baru**: implementasikan `createTool(...)` langsung pada plugin provider.
    OpenClaw tidak lagi membutuhkan helper SDK untuk mendaftarkan wrapper tool.

  </Accordion>

  <Accordion title="Envelope channel plaintext → BodyForAgent">
    **Lama**: `formatInboundEnvelope(...)` (dan
    `ChannelMessageForAgent.channelEnvelope`) untuk membangun envelope prompt
    plaintext datar dari pesan channel masuk.

    **Baru**: `BodyForAgent` plus blok konteks pengguna terstruktur. Plugin
    channel melampirkan metadata routing (thread, topik, balas-ke, reaksi)
    sebagai field bertipe alih-alih menggabungkannya ke dalam string prompt.
    Helper `formatAgentEnvelope(...)` masih didukung untuk envelope yang
    disintesis dan menghadap asisten, tetapi envelope plaintext masuk sedang
    ditinggalkan.

    Area terdampak: `inbound_claim`, `message_received`, dan plugin channel
    kustom apa pun yang memproses ulang teks `channelEnvelope`.

  </Accordion>

  <Accordion title="hook deactivate → gateway_stop">
    **Lama**: `api.on("deactivate", handler)`.

    **Baru**: `api.on("gateway_stop", handler)`. Event dan konteksnya adalah
    kontrak pembersihan shutdown yang sama; hanya nama hook yang berubah.

    ```typescript
    // Before
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // After
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` tetap terhubung sebagai alias kompatibilitas yang sudah tidak
    digunakan lagi hingga setelah 2026-08-16.

  </Accordion>

  <Accordion title="hook subagent_spawning → binding thread core">
    **Lama**: `api.on("subagent_spawning", handler)` mengembalikan
    `threadBindingReady` atau `deliveryOrigin`.

    **Baru**: biarkan core menyiapkan binding subagent `thread: true` melalui
    adapter session-binding channel. Gunakan `api.on("subagent_spawned", handler)`
    hanya untuk observasi pasca-peluncuran.

    ```typescript
    // Before
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // After
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    `subagent_spawning`, `PluginHookSubagentSpawningEvent`,
    `PluginHookSubagentSpawningResult`, dan
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` tetap hanya sebagai
    permukaan kompatibilitas yang sudah tidak digunakan lagi sementara plugin
    eksternal bermigrasi.

  </Accordion>

  <Accordion title="Tipe discovery provider → tipe katalog provider">
    Empat alias tipe discovery sekarang menjadi wrapper tipis di atas tipe era
    katalog:

    | Alias lama                | Tipe baru                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Ditambah bag statis `ProviderCapabilities` legacy - plugin provider
    sebaiknya menggunakan hook provider eksplisit seperti `buildReplayPolicy`,
    `normalizeToolSchemas`, dan `wrapStreamFn` alih-alih objek statis.

  </Accordion>

  <Accordion title="Hook kebijakan thinking → resolveThinkingProfile">
    **Lama** (tiga hook terpisah pada `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, dan
    `resolveDefaultThinkingLevel(ctx)`.

    **Baru**: satu `resolveThinkingProfile(ctx)` yang mengembalikan
    `ProviderThinkingProfile` dengan `id` kanonis, `label` opsional, dan
    daftar level berperingkat. OpenClaw menurunkan nilai tersimpan yang usang
    berdasarkan peringkat profil secara otomatis.

    Konteks mencakup `provider`, `modelId`, `reasoning` gabungan opsional, dan
    fakta `compat` model gabungan opsional. Plugin provider dapat menggunakan
    fakta katalog tersebut untuk memaparkan profil khusus model hanya ketika
    kontrak permintaan yang dikonfigurasi mendukungnya.

    Implementasikan satu hook, bukan tiga. Hook legacy tetap berfungsi selama
    jendela depresiasi tetapi tidak dikomposisikan dengan hasil profil.

  </Accordion>

  <Accordion title="Provider auth eksternal → contracts.externalAuthProviders">
    **Lama**: mengimplementasikan hook auth eksternal tanpa mendeklarasikan
    provider di manifest plugin.

    **Baru**: deklarasikan `contracts.externalAuthProviders` di manifest plugin
    **dan** implementasikan `resolveExternalAuthProfiles(...)`.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Lookup env-var provider → setup.providers[].envVars">
    Field manifest **lama**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Baru**: cerminkan lookup env-var yang sama ke `setup.providers[].envVars`
    pada manifest. Ini mengonsolidasikan metadata env setup/status di satu
    tempat dan menghindari boot runtime plugin hanya untuk menjawab lookup
    env-var.

    `providerAuthEnvVars` tetap didukung melalui adapter kompatibilitas hingga
    jendela depresiasi ditutup.

  </Accordion>

  <Accordion title="Registrasi plugin memori → registerMemoryCapability">
    **Lama**: tiga panggilan terpisah -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Baru**: satu panggilan pada API memory-state -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Slot yang sama, satu panggilan registrasi. Helper prompt dan corpus aditif
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) tidak
    terpengaruh.

  </Accordion>

  <Accordion title="API provider embedding memori">
    **Lama**: `api.registerMemoryEmbeddingProvider(...)` plus
    `contracts.memoryEmbeddingProviders`.

    **Baru**: `api.registerEmbeddingProvider(...)` plus
    `contracts.embeddingProviders`.

    Kontrak provider embedding generik dapat digunakan ulang di luar memori dan
    merupakan jalur yang didukung untuk provider baru. API registrasi khusus
    memori tetap terhubung sebagai kompatibilitas yang sudah tidak digunakan
    lagi sementara provider yang ada bermigrasi. Inspeksi plugin melaporkan
    penggunaan non-bawaan sebagai utang kompatibilitas.

  </Accordion>

  <Accordion title="Tipe pesan session subagent diganti namanya">
    Dua alias tipe legacy masih diekspor dari `src/plugins/runtime/types.ts`:

    | Lama                          | Baru                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Metode runtime `readSession` sudah tidak digunakan lagi dan digantikan oleh
    `getSessionMessages`. Signature sama; metode lama meneruskan panggilan ke
    metode baru.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Lama**: `runtime.tasks.flow` (tunggal) mengembalikan accessor task-flow
    live.

    **Baru**: `runtime.tasks.managedFlows` mempertahankan runtime mutasi
    TaskFlow terkelola untuk plugin yang membuat, memperbarui, membatalkan,
    atau menjalankan child task dari sebuah flow. Gunakan `runtime.tasks.flows`
    ketika plugin hanya membutuhkan pembacaan berbasis DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Factory ekstensi embedded → middleware hasil tool agen">
    Dicakup dalam "Cara bermigrasi → Migrasikan ekstensi hasil tool embedded ke
    middleware" di atas. Disertakan di sini demi kelengkapan: jalur khusus
    embedded-runner yang dihapus, `api.registerEmbeddedExtensionFactory(...)`,
    digantikan oleh `api.registerAgentToolResultMiddleware(...)` dengan daftar
    runtime eksplisit di `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` yang diekspor ulang dari `openclaw/plugin-sdk`
    sekarang adalah alias satu baris untuk `OpenClawConfig`. Pilih nama
    kanonis.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Depresiasi tingkat ekstensi (di dalam plugin channel/provider bawaan di bawah
`extensions/`) dilacak di dalam barrel `api.ts` dan `runtime-api.ts` masing-masing.
Depresiasi tersebut tidak memengaruhi kontrak plugin pihak ketiga dan tidak
dicantumkan di sini. Jika Anda memakai barrel lokal plugin bawaan secara
langsung, baca komentar depresiasi di barrel tersebut sebelum meningkatkan versi.
</Note>

## Linimasa penghapusan

| Kapan                  | Apa yang terjadi                                                       |
| ---------------------- | ---------------------------------------------------------------------- |
| **Sekarang**           | Permukaan yang dideprekasi memunculkan peringatan runtime              |
| **Rilis mayor berikutnya** | Permukaan yang dideprekasi akan dihapus; plugin yang masih menggunakannya akan gagal |

Semua plugin inti sudah dimigrasikan. Plugin eksternal harus bermigrasi
sebelum rilis mayor berikutnya.

## Menekan peringatan sementara

Tetapkan variabel lingkungan ini saat Anda mengerjakan migrasi:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Ini adalah jalan keluar sementara, bukan solusi permanen.

## Terkait

- [Memulai](/id/plugins/building-plugins) - buat plugin pertama Anda
- [Ikhtisar SDK](/id/plugins/sdk-overview) - referensi impor subpath lengkap
- [Plugin Kanal](/id/plugins/sdk-channel-plugins) - membangun plugin kanal
- [Plugin Penyedia](/id/plugins/sdk-provider-plugins) - membangun plugin penyedia
- [Internal Plugin](/id/plugins/architecture) - pembahasan mendalam arsitektur
- [Manifest Plugin](/id/plugins/manifest) - referensi skema manifest
