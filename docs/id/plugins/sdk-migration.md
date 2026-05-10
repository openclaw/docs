---
read_when:
    - Anda melihat peringatan OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Anda melihat peringatan OPENCLAW_EXTENSION_API_DEPRECATED
    - Anda menggunakan api.registerEmbeddedExtensionFactory sebelum OpenClaw 2026.4.25
    - Anda sedang memperbarui Plugin ke arsitektur Plugin modern
    - Anda memelihara Plugin OpenClaw eksternal
sidebarTitle: Migrate to SDK
summary: Migrasi dari lapisan kompatibilitas mundur lama ke SDK Plugin modern
title: Migrasi SDK Plugin
x-i18n:
    generated_at: "2026-05-10T19:47:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7595b41c15ce36dd8d2a3faf320cc9847b013b1f4807c02b8b97c6feaee4415
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw telah berpindah dari lapisan kompatibilitas mundur yang luas ke arsitektur plugin modern dengan impor yang terfokus dan terdokumentasi. Jika plugin Anda dibuat sebelum arsitektur baru, panduan ini membantu Anda melakukan migrasi.

## Apa yang berubah

Sistem plugin lama menyediakan dua permukaan yang sangat terbuka yang memungkinkan plugin mengimpor apa pun yang dibutuhkan dari satu titik masuk:

- **`openclaw/plugin-sdk/compat`** - satu impor yang mengekspor ulang puluhan
  helper. Ini diperkenalkan untuk menjaga plugin lama berbasis hook tetap
  berfungsi saat arsitektur plugin baru sedang dibangun.
- **`openclaw/plugin-sdk/infra-runtime`** - barrel helper runtime luas yang
  mencampur event sistem, status Heartbeat, antrean pengiriman, helper fetch/proxy,
  helper file, tipe persetujuan, dan utilitas yang tidak terkait.
- **`openclaw/plugin-sdk/config-runtime`** - barrel kompatibilitas config luas
  yang masih membawa helper load/write langsung yang sudah deprecated selama
  jendela migrasi.
- **`openclaw/extension-api`** - bridge yang memberi plugin akses langsung ke
  helper sisi host seperti runner agen tertanam.
- **`api.registerEmbeddedExtensionFactory(...)`** - hook ekstensi bundel khusus Pi
  yang telah dihapus yang dapat mengamati event embedded-runner seperti
  `tool_result`.

Permukaan impor yang luas kini **deprecated**. Permukaan itu masih berfungsi saat runtime,
tetapi plugin baru tidak boleh menggunakannya, dan plugin yang ada sebaiknya bermigrasi sebelum
rilis mayor berikutnya menghapusnya. API pendaftaran factory ekstensi tertanam khusus Pi
telah dihapus; gunakan middleware hasil tool sebagai gantinya.

OpenClaw tidak menghapus atau menafsirkan ulang perilaku plugin terdokumentasi dalam perubahan yang sama
yang memperkenalkan penggantinya. Perubahan kontrak yang breaking harus terlebih dahulu melalui
adapter kompatibilitas, diagnostik, docs, dan jendela deprecation.
Itu berlaku untuk impor SDK, field manifest, API setup, hook, dan perilaku
pendaftaran runtime.

<Warning>
  Lapisan kompatibilitas mundur akan dihapus dalam rilis mayor mendatang.
  Plugin yang masih mengimpor dari permukaan ini akan rusak saat itu terjadi.
  Pendaftaran factory ekstensi tertanam khusus Pi sudah tidak lagi dimuat.
</Warning>

## Mengapa ini berubah

Pendekatan lama menyebabkan masalah:

- **Startup lambat** - mengimpor satu helper memuat puluhan modul yang tidak terkait
- **Dependensi sirkular** - re-export luas memudahkan pembuatan siklus impor
- **Permukaan API tidak jelas** - tidak ada cara untuk mengetahui ekspor mana yang stabil vs internal

SDK plugin modern memperbaiki ini: setiap path impor (`openclaw/plugin-sdk/\<subpath\>`)
adalah modul kecil dan mandiri dengan tujuan yang jelas dan kontrak terdokumentasi.

Seam kemudahan provider legacy untuk channel bundel juga sudah hilang.
Seam helper bermerek channel adalah shortcut privat mono-repo, bukan kontrak
plugin yang stabil. Gunakan subpath SDK generik yang sempit sebagai gantinya. Di dalam workspace
plugin bundel, simpan helper milik provider di `api.ts` atau
`runtime-api.ts` milik plugin itu sendiri.

Contoh provider bundel saat ini:

- Anthropic menyimpan helper stream khusus Claude di seam `api.ts` /
  `contract-api.ts` miliknya sendiri
- OpenAI menyimpan builder provider, helper model default, dan builder provider realtime
  di `api.ts` miliknya sendiri
- OpenRouter menyimpan builder provider dan helper onboarding/config di
  `api.ts` miliknya sendiri

## Rencana migrasi Talk dan suara realtime

Kode Talk untuk suara realtime, telephony, meeting, dan browser sedang dipindahkan dari
pencatatan turn lokal permukaan ke controller sesi Talk bersama yang diekspor oleh
`openclaw/plugin-sdk/realtime-voice`. Controller baru memiliki envelope event Talk
umum, status turn aktif, status capture, status audio output, riwayat event terbaru,
dan penolakan turn usang. Plugin provider harus tetap memiliki sesi realtime
spesifik vendor; plugin permukaan harus tetap memiliki capture,
playback, telephony, dan kekhasan meeting.

Migrasi Talk ini sengaja dibuat bersih meski breaking:

1. Simpan primitive controller/runtime bersama di
   `plugin-sdk/realtime-voice`.
2. Pindahkan permukaan bundel ke controller bersama: relay browser,
   handoff managed-room, realtime voice-call, STT streaming voice-call, Google
   Meet realtime, dan native push-to-talk.
3. Ganti keluarga RPC Talk lama dengan API final `talk.session.*` dan
   `talk.client.*`.
4. Iklankan satu channel event Talk live di Gateway
   `hello-ok.features.events`: `talk.event`.
5. Hapus endpoint HTTP realtime lama dan semua path override instruksi saat request.

Kode baru sebaiknya tidak memanggil `createTalkEventSequencer(...)` langsung kecuali jika
mengimplementasikan adapter level rendah atau fixture test. Pilih controller bersama
agar event yang ber-scope turn tidak dapat dipancarkan tanpa id turn, panggilan `turnEnd` /
`turnCancel` yang usang tidak dapat menghapus turn aktif yang lebih baru, dan event lifecycle
audio output tetap konsisten di telephony, meeting, relay browser, handoff managed-room,
dan klien Talk native.

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
```

Sesi WebRTC/provider-websocket milik browser menggunakan `talk.client.create`,
karena browser memiliki negosiasi provider dan transport media sementara
Gateway memiliki kredensial, instruksi, dan kebijakan tool. `talk.session.*` adalah
permukaan umum yang dikelola Gateway untuk realtime gateway-relay, transcription
gateway-relay, dan sesi STT/TTS native managed-room.

Config legacy yang menempatkan selector realtime di samping `talk.provider` /
`talk.providers` harus diperbaiki dengan `openclaw doctor --fix`; runtime Talk
tidak menafsirkan ulang config provider speech/TTS sebagai config provider realtime.

Kombinasi `talk.session.create` yang didukung sengaja dibuat kecil:

| Mode            | Transport       | Brain           | Pemilik            | Catatan                                                                                                            |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Audio provider full-duplex dijembatani melalui Gateway; panggilan tool dirutekan melalui tool agent-consult.       |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Hanya STT streaming; pemanggil mengirim audio input dan menerima event transcript.                                 |
| `stt-tts`       | `managed-room`  | `agent-consult` | Ruang native/klien | Ruang bergaya push-to-talk dan walkie-talkie tempat klien memiliki capture/playback dan Gateway memiliki status turn. |
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
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Tambahkan chunk audio PCM base64 ke sesi provider yang dimiliki oleh koneksi Gateway yang sama.                                                                                          |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Mulai turn pengguna managed-room.                                                                                                                                                        |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Akhiri turn aktif setelah validasi turn usang.                                                                                                                                           |
| `talk.session.cancelTurn`       | semua sesi milik Gateway                                | Batalkan pekerjaan capture/provider/agen/TTS aktif untuk sebuah turn.                                                                                                                    |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Hentikan output audio asisten tanpa harus mengakhiri turn pengguna.                                                                                                                      |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Selesaikan panggilan tool provider yang dipancarkan oleh relay; berikan `options.willContinue` untuk output sementara atau `options.suppressResponse` untuk memenuhi panggilan tanpa respons asisten lain. |
| `talk.session.close`            | semua sesi terpadu                                      | Hentikan sesi relay atau cabut status managed-room, lalu lupakan id sesi terpadu.                                                                                                        |

  Jangan tambahkan kasus khusus penyedia atau platform di core untuk membuat ini berfungsi.
  Core memiliki semantik sesi Talk. Plugin penyedia memiliki penyiapan sesi vendor.
  Panggilan suara dan Google Meet memiliki adapter telepon/rapat. Browser dan aplikasi
  native memiliki UX penangkapan/pemutaran perangkat.

  ## Kebijakan kompatibilitas

  Untuk plugin eksternal, pekerjaan kompatibilitas mengikuti urutan ini:

  1. tambahkan kontrak baru
  2. pertahankan perilaku lama yang disambungkan melalui adapter kompatibilitas
  3. keluarkan diagnostik atau peringatan yang menyebutkan jalur lama dan penggantinya
  4. cakup kedua jalur dalam pengujian
  5. dokumentasikan penghentian dan jalur migrasi
  6. hapus hanya setelah jendela migrasi yang diumumkan, biasanya dalam rilis mayor

  Maintainer dapat mengaudit antrean migrasi saat ini dengan
  `pnpm plugins:boundary-report`. Gunakan `pnpm plugins:boundary-report:summary` untuk
  hitungan ringkas, `--owner <id>` untuk satu plugin atau pemilik kompatibilitas, dan
  `pnpm plugins:boundary-report:ci` saat gate CI harus gagal pada catatan
  kompatibilitas yang jatuh tempo, impor SDK reserved lintas pemilik, atau subpath SDK
  reserved yang tidak digunakan. Laporan mengelompokkan catatan kompatibilitas yang
  dihentikan berdasarkan tanggal penghapusan, menghitung referensi kode/dokumen lokal,
  memunculkan impor SDK reserved lintas pemilik, dan meringkas bridge SDK host memori
  privat sehingga pembersihan kompatibilitas tetap eksplisit, bukan bergantung pada
  pencarian ad hoc. Subpath SDK reserved harus memiliki penggunaan pemilik yang
  terlacak; ekspor helper reserved yang tidak digunakan harus dihapus dari SDK publik.

  Jika sebuah field manifes masih diterima, penulis plugin dapat terus menggunakannya sampai
  dokumentasi dan diagnostik mengatakan sebaliknya. Kode baru sebaiknya memilih pengganti
  yang terdokumentasi, tetapi plugin yang ada tidak boleh rusak selama rilis minor biasa.

  ## Cara bermigrasi

  <Steps>
  <Step title="Migrasikan helper pemuatan/penulisan konfigurasi runtime">
    Plugin bawaan harus berhenti memanggil
    `api.runtime.config.loadConfig()` dan
    `api.runtime.config.writeConfigFile(...)` secara langsung. Pilih konfigurasi yang
    sudah diteruskan ke jalur panggilan aktif. Handler berumur panjang yang membutuhkan
    snapshot proses saat ini dapat menggunakan `api.runtime.config.current()`. Tool agen
    berumur panjang harus menggunakan `ctx.getRuntimeConfig()` milik konteks tool di dalam
    `execute` sehingga tool yang dibuat sebelum penulisan konfigurasi tetap melihat
    konfigurasi runtime yang telah disegarkan.

    Penulisan konfigurasi harus melalui helper transaksional dan memilih kebijakan
    setelah-penulisan:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Gunakan `afterWrite: { mode: "restart", reason: "..." }` saat pemanggil mengetahui
    bahwa perubahan memerlukan restart Gateway yang bersih, dan
    `afterWrite: { mode: "none", reason: "..." }` hanya saat pemanggil memiliki tindak
    lanjut dan secara sengaja ingin menekan perencana reload.
    Hasil mutasi menyertakan ringkasan `followUp` bertipe untuk pengujian dan logging;
    Gateway tetap bertanggung jawab untuk menerapkan atau menjadwalkan restart.
    `loadConfig` dan `writeConfigFile` tetap sebagai helper kompatibilitas yang dihentikan
    untuk plugin eksternal selama jendela migrasi dan memperingatkan sekali dengan
    kode kompatibilitas `runtime-config-load-write`. Plugin bawaan dan kode runtime repo
    dilindungi oleh guardrail pemindai di
    `pnpm check:deprecated-api-usage` dan
    `pnpm check:no-runtime-action-load-config`: penggunaan plugin produksi baru
    langsung gagal, penulisan konfigurasi langsung gagal, metode server Gateway harus
    menggunakan snapshot runtime permintaan, helper kirim/aksi/klien channel runtime
    harus menerima konfigurasi dari boundary-nya, dan modul runtime berumur panjang
    memiliki nol panggilan ambient `loadConfig()` yang diizinkan.

    Kode plugin baru juga harus menghindari mengimpor barrel kompatibilitas luas
    `openclaw/plugin-sdk/config-runtime`. Gunakan subpath SDK sempit yang cocok dengan
    pekerjaannya:

    | Kebutuhan | Impor |
    | --- | --- |
    | Tipe konfigurasi seperti `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Assertion konfigurasi yang sudah dimuat dan lookup konfigurasi entry plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Pembacaan snapshot runtime saat ini | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Penulisan konfigurasi | `openclaw/plugin-sdk/config-mutation` |
    | Helper penyimpanan sesi | `openclaw/plugin-sdk/session-store-runtime` |
    | Konfigurasi tabel Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helper runtime kebijakan grup | `openclaw/plugin-sdk/runtime-group-policy` |
    | Resolusi input rahasia | `openclaw/plugin-sdk/secret-input-runtime` |
    | Override model/sesi | `openclaw/plugin-sdk/model-session-runtime` |

    Plugin bawaan dan pengujiannya dijaga pemindai terhadap barrel luas
    sehingga impor dan mock tetap lokal pada perilaku yang dibutuhkan. Barrel luas
    masih ada untuk kompatibilitas eksternal, tetapi kode baru tidak boleh
    bergantung padanya.

  </Step>

  <Step title="Migrasikan ekstensi hasil tool Pi ke middleware">
    Plugin bawaan harus mengganti handler hasil tool khusus Pi
    `api.registerEmbeddedExtensionFactory(...)` dengan middleware yang netral runtime.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Perbarui manifes plugin pada saat yang sama:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Plugin eksternal tidak dapat mendaftarkan middleware hasil tool karena itu dapat
    menulis ulang output tool dengan kepercayaan tinggi sebelum model melihatnya.

  </Step>

  <Step title="Migrasikan handler native approval ke fakta kapabilitas">
    Plugin channel yang mendukung approval kini mengekspos perilaku approval native melalui
    `approvalCapability.nativeRuntime` plus registry konteks runtime bersama.

    Perubahan utama:

    - Ganti `approvalCapability.handler.loadRuntime(...)` dengan
      `approvalCapability.nativeRuntime`
    - Pindahkan auth/delivery khusus approval dari wiring lama `plugin.auth` /
      `plugin.approvals` ke `approvalCapability`
    - `ChannelPlugin.approvals` telah dihapus dari kontrak plugin channel
      publik; pindahkan field delivery/native/render ke `approvalCapability`
    - `plugin.auth` tetap untuk alur login/logout channel saja; hook auth approval
      di sana tidak lagi dibaca oleh core
    - Daftarkan objek runtime milik channel seperti klien, token, atau aplikasi Bolt
      melalui `openclaw/plugin-sdk/channel-runtime-context`
    - Jangan mengirim pemberitahuan reroute milik plugin dari handler approval native;
      core kini memiliki pemberitahuan routed-elsewhere dari hasil delivery aktual
    - Saat meneruskan `channelRuntime` ke `createChannelManager(...)`, sediakan
      surface `createPluginRuntime().channel` yang nyata. Stub parsial ditolak.

    Lihat `/plugins/sdk-channel-plugins` untuk tata letak kapabilitas approval saat ini.

  </Step>

  <Step title="Audit perilaku fallback wrapper Windows">
    Jika plugin Anda menggunakan `openclaw/plugin-sdk/windows-spawn`, wrapper Windows
    `.cmd`/`.bat` yang tidak terselesaikan kini gagal tertutup kecuali Anda secara eksplisit meneruskan
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

    Jika pemanggil Anda tidak secara sengaja bergantung pada fallback shell, jangan set
    `allowShellFallback` dan tangani error yang dilempar sebagai gantinya.

  </Step>

  <Step title="Temukan impor yang dihentikan">
    Cari plugin Anda untuk impor dari salah satu surface yang dihentikan:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Ganti dengan impor yang terfokus">
    Setiap ekspor dari surface lama dipetakan ke jalur impor modern yang spesifik:

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

    Untuk helper sisi host, gunakan runtime plugin yang diinjeksi alih-alih mengimpor
    secara langsung:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
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
    eksternal, tetapi kode baru harus mengimpor surface helper terfokus yang
    benar-benar dibutuhkannya:

    | Kebutuhan | Impor |
    | --- | --- |
    | Helper antrean event sistem | `openclaw/plugin-sdk/system-event-runtime` |
    | Helper wake, event, dan visibilitas Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Drain antrean delivery tertunda | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetri aktivitas channel | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Cache dedupe dalam memori | `openclaw/plugin-sdk/dedupe-runtime` |
    | Helper path file/media lokal yang aman | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch yang sadar dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Helper proxy dan fetch berpenjaga | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipe kebijakan dispatcher SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipe permintaan/resolusi approval | `openclaw/plugin-sdk/approval-runtime` |
    | Helper payload balasan approval dan command | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helper pemformatan error | `openclaw/plugin-sdk/error-runtime` |
    | Tunggu kesiapan transport | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helper token aman | `openclaw/plugin-sdk/secure-random-runtime` |
    | Konkurensi tugas async berbatas | `openclaw/plugin-sdk/concurrency-runtime` |
    | Koersi numerik | `openclaw/plugin-sdk/number-runtime` |
    | Lock async lokal proses | `openclaw/plugin-sdk/async-lock-runtime` |
    | Lock file | `openclaw/plugin-sdk/file-lock` |

    Plugin bawaan dijaga pemindai terhadap `infra-runtime`, sehingga kode repo
    tidak dapat regresi ke barrel luas.

  </Step>

  <Step title="Migrasikan helper route channel">
    Kode route channel baru harus menggunakan `openclaw/plugin-sdk/channel-route`.
    Nama route-key dan comparable-target yang lebih lama tetap sebagai alias kompatibilitas
    selama jendela migrasi, tetapi plugin baru harus menggunakan nama route
    yang menjelaskan perilaku secara langsung:

    | Fungsi bantu lama | Fungsi bantu modern |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Fungsi bantu rute modern menormalkan `{ channel, to, accountId, threadId }`
    secara konsisten di seluruh persetujuan native, penekanan balasan, dedupe masuk,
    pengiriman Cron, dan perutean sesi. Jika plugin Anda memiliki tata bahasa target
    khusus, gunakan `resolveChannelRouteTargetWithParser(...)` untuk menyesuaikan
    parser tersebut ke dalam kontrak target rute yang sama.

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referensi jalur impor

  <Accordion title="Tabel jalur impor umum">
  | Jalur impor | Tujuan | Ekspor utama |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper entri Plugin kanonis | `definePluginEntry` |
  | `plugin-sdk/core` | Ekspor ulang payung lama untuk definisi/pembangun entri channel | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Ekspor skema konfigurasi root | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper entri penyedia tunggal | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definisi dan pembangun entri channel terfokus | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helper wizard setup bersama | Prompt allowlist, pembangun status setup |
  | `plugin-sdk/setup-runtime` | Helper runtime saat setup | Adapter patch setup yang aman diimpor, helper catatan pencarian, `promptResolvedAllowFrom`, `splitSetupEntries`, proksi setup yang didelegasikan |
  | `plugin-sdk/setup-adapter-runtime` | Alias adapter setup yang tidak digunakan lagi | Gunakan `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Helper tooling setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper multi-akun | Helper daftar/konfigurasi/gerbang tindakan akun |
  | `plugin-sdk/account-id` | Helper ID akun | `DEFAULT_ACCOUNT_ID`, normalisasi ID akun |
  | `plugin-sdk/account-resolution` | Helper pencarian akun | Helper pencarian akun + fallback default |
  | `plugin-sdk/account-helpers` | Helper akun sempit | Helper daftar akun/tindakan akun |
  | `plugin-sdk/channel-setup` | Adapter wizard setup | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitif pemasangan DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Perangkaian prefiks balasan, pengetikan, dan pengiriman sumber | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Factory adapter konfigurasi dan helper akses DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Pembangun skema konfigurasi | Primitif skema konfigurasi channel bersama dan hanya pembangun generik |
  | `plugin-sdk/bundled-channel-config-schema` | Skema konfigurasi bawaan | Hanya Plugin bawaan yang dikelola OpenClaw; Plugin baru harus menentukan skema lokal Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Skema konfigurasi bawaan yang tidak digunakan lagi | Hanya alias kompatibilitas; gunakan `plugin-sdk/bundled-channel-config-schema` untuk Plugin bawaan yang dipelihara |
  | `plugin-sdk/telegram-command-config` | Helper konfigurasi perintah Telegram | Normalisasi nama perintah, pemangkasan deskripsi, validasi duplikat/konflik |
  | `plugin-sdk/channel-policy` | Resolusi kebijakan grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helper status akun dan siklus hidup stream draf | `createAccountStatusSink`, helper finalisasi pratinjau draf |
  | `plugin-sdk/inbound-envelope` | Helper envelope masuk | Helper rute bersama + pembangun envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helper balasan masuk | Helper catat-dan-dispatch bersama |
  | `plugin-sdk/messaging-targets` | Parsing target pesan | Helper parsing/pencocokan target |
  | `plugin-sdk/outbound-media` | Helper media keluar | Pemuatan media keluar bersama |
  | `plugin-sdk/outbound-send-deps` | Helper dependensi pengiriman keluar | Pencarian `resolveOutboundSendDep` ringan tanpa mengimpor runtime keluar penuh |
  | `plugin-sdk/outbound-runtime` | Helper runtime keluar | Helper pengiriman keluar, delegasi identitas/kirim, sesi, pemformatan, dan perencanaan payload |
  | `plugin-sdk/thread-bindings-runtime` | Helper pengikatan thread | Helper siklus hidup dan adapter pengikatan thread |
  | `plugin-sdk/agent-media-payload` | Helper payload media lama | Pembangun payload media agen untuk tata letak field lama |
  | `plugin-sdk/channel-runtime` | Shim kompatibilitas yang tidak digunakan lagi | Hanya utilitas runtime channel lama |
  | `plugin-sdk/channel-send-result` | Tipe hasil kirim | Tipe hasil balasan |
  | `plugin-sdk/runtime-store` | Penyimpanan Plugin persisten | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helper runtime luas | Helper runtime/logging/backup/instalasi Plugin |
  | `plugin-sdk/runtime-env` | Helper env runtime sempit | Helper logger/env runtime, timeout, retry, dan backoff |
  | `plugin-sdk/plugin-runtime` | Helper runtime Plugin bersama | Helper perintah/hook/http/interaktif Plugin |
  | `plugin-sdk/hook-runtime` | Helper pipeline hook | Helper pipeline webhook/internal hook bersama |
  | `plugin-sdk/lazy-runtime` | Helper runtime malas | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper proses | Helper exec bersama |
  | `plugin-sdk/cli-runtime` | Helper runtime CLI | Pemformatan perintah, penantian, helper versi |
  | `plugin-sdk/gateway-runtime` | Helper Gateway | Klien Gateway, helper mulai siap event loop, dan helper patch status channel |
  | `plugin-sdk/config-runtime` | Shim kompatibilitas konfigurasi yang tidak digunakan lagi | Utamakan `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, dan `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Helper perintah Telegram | Helper validasi perintah Telegram yang stabil terhadap fallback saat permukaan kontrak Telegram bawaan tidak tersedia |
  | `plugin-sdk/approval-runtime` | Helper prompt persetujuan | Payload persetujuan exec/Plugin, helper kapabilitas/profil persetujuan, helper routing/runtime persetujuan native, dan pemformatan jalur tampilan persetujuan terstruktur |
  | `plugin-sdk/approval-auth-runtime` | Helper auth persetujuan | Resolusi pemberi persetujuan, auth tindakan chat yang sama |
  | `plugin-sdk/approval-client-runtime` | Helper klien persetujuan | Helper profil/filter persetujuan exec native |
  | `plugin-sdk/approval-delivery-runtime` | Helper pengiriman persetujuan | Adapter kapabilitas/pengiriman persetujuan native |
  | `plugin-sdk/approval-gateway-runtime` | Helper Gateway persetujuan | Helper resolusi Gateway persetujuan bersama |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helper adapter persetujuan | Helper pemuatan adapter persetujuan native ringan untuk entrypoint channel panas |
  | `plugin-sdk/approval-handler-runtime` | Helper handler persetujuan | Helper runtime handler persetujuan yang lebih luas; utamakan seam adapter/Gateway yang lebih sempit saat sudah cukup |
  | `plugin-sdk/approval-native-runtime` | Helper target persetujuan | Helper pengikatan target/akun persetujuan native |
  | `plugin-sdk/approval-reply-runtime` | Helper balasan persetujuan | Helper payload balasan persetujuan exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Helper konteks runtime channel | Helper register/get/watch konteks runtime channel generik |
  | `plugin-sdk/security-runtime` | Helper keamanan | Helper kepercayaan bersama, gerbang DM, file/jalur berbatas root, konten eksternal, dan pengumpulan rahasia |
  | `plugin-sdk/ssrf-policy` | Helper kebijakan SSRF | Helper allowlist host dan kebijakan jaringan privat |
  | `plugin-sdk/ssrf-runtime` | Helper runtime SSRF | Dispatcher yang dipin, fetch terlindungi, helper kebijakan SSRF |
  | `plugin-sdk/system-event-runtime` | Helper event sistem | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Helper Heartbeat | Helper bangun, event, dan visibilitas Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Helper antrean pengiriman | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Helper aktivitas channel | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Helper dedupe | Cache dedupe dalam memori |
  | `plugin-sdk/file-access-runtime` | Helper akses file | Helper jalur file/media lokal aman |
  | `plugin-sdk/transport-ready-runtime` | Helper kesiapan transport | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Helper cache berbatas | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper gerbang diagnostik | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper pemformatan error | `formatUncaughtError`, `isApprovalNotFoundError`, helper graf error |
  | `plugin-sdk/fetch-runtime` | Helper fetch/proxy terbungkus | `resolveFetch`, helper proxy, helper opsi EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Helper normalisasi host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper retry | `RetryConfig`, `retryAsync`, runner kebijakan |
  | `plugin-sdk/allow-from` | Pemformatan allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Pemetaan input allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gerbang perintah dan helper permukaan perintah | `resolveControlCommandGate`, helper otorisasi pengirim, helper registry perintah termasuk pemformatan menu argumen dinamis |
  | `plugin-sdk/command-status` | Perender status/bantuan perintah | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing input rahasia | Helper input rahasia |
  | `plugin-sdk/webhook-ingress` | Helper permintaan Webhook | Utilitas target Webhook |
  | `plugin-sdk/webhook-request-guards` | Helper guard body Webhook | Helper baca/batas body permintaan |
  | `plugin-sdk/reply-runtime` | Runtime balasan bersama | Dispatch masuk, Heartbeat, perencana balasan, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helper dispatch balasan sempit | Helper finalisasi, dispatch penyedia, dan label percakapan |
  | `plugin-sdk/reply-history` | Helper riwayat balasan | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Perencanaan referensi balasan | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper chunk balasan | Helper chunking teks/markdown |
  | `plugin-sdk/session-store-runtime` | Helper penyimpanan sesi | Helper jalur penyimpanan + updated-at |
  | `plugin-sdk/state-paths` | Helper jalur status | Helper direktori status dan OAuth |
  | `plugin-sdk/routing` | Helper routing/kunci sesi | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper normalisasi kunci sesi |
  | `plugin-sdk/status-helpers` | Helper status channel | Pembangun ringkasan status channel/akun, default status runtime, helper metadata isu |
  | `plugin-sdk/target-resolver-runtime` | Helper resolver target | Helper resolver target bersama |
  | `plugin-sdk/string-normalization-runtime` | Helper normalisasi string | Helper normalisasi slug/string |
  | `plugin-sdk/request-url` | Helper URL permintaan | Ekstrak URL string dari input mirip permintaan |
  | `plugin-sdk/run-command` | Helper perintah berwaktu | Runner perintah berwaktu dengan stdout/stderr ternormalisasi |
  | `plugin-sdk/param-readers` | Pembaca param | Pembaca param tool/CLI umum |
  | `plugin-sdk/tool-payload` | Ekstraksi payload alat | Ekstrak payload ternormalisasi dari objek hasil alat |
  | `plugin-sdk/tool-send` | Ekstraksi pengiriman alat | Ekstrak kolom target pengiriman kanonis dari argumen alat |
  | `plugin-sdk/temp-path` | Pembantu jalur sementara | Pembantu jalur unduhan sementara bersama |
  | `plugin-sdk/logging-core` | Pembantu pencatatan log | Pembantu logger subsistem dan redaksi |
  | `plugin-sdk/markdown-table-runtime` | Pembantu tabel Markdown | Pembantu mode tabel Markdown |
  | `plugin-sdk/reply-payload` | Tipe balasan pesan | Tipe payload balasan |
  | `plugin-sdk/provider-setup` | Pembantu penyiapan penyedia lokal/swakelola terkurasi | Pembantu penemuan/konfigurasi penyedia swak-hosting |
  | `plugin-sdk/self-hosted-provider-setup` | Pembantu penyiapan penyedia swak-hosting kompatibel OpenAI yang terfokus | Pembantu penemuan/konfigurasi penyedia swak-hosting yang sama |
  | `plugin-sdk/provider-auth-runtime` | Pembantu autentikasi runtime penyedia | Pembantu resolusi kunci API runtime |
  | `plugin-sdk/provider-auth-api-key` | Pembantu penyiapan kunci API penyedia | Pembantu onboarding/penulisan profil kunci API |
  | `plugin-sdk/provider-auth-result` | Pembantu hasil autentikasi penyedia | Pembuat hasil autentikasi OAuth standar |
  | `plugin-sdk/provider-selection-runtime` | Pembantu pemilihan penyedia | Pemilihan penyedia terkonfigurasi-atau-otomatis dan penggabungan konfigurasi penyedia mentah |
  | `plugin-sdk/provider-env-vars` | Pembantu variabel lingkungan penyedia | Pembantu pencarian variabel lingkungan autentikasi penyedia |
  | `plugin-sdk/provider-model-shared` | Pembantu model/replay penyedia bersama | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, pembuat kebijakan replay bersama, pembantu endpoint penyedia, dan pembantu normalisasi ID model |
  | `plugin-sdk/provider-catalog-shared` | Pembantu katalog penyedia bersama | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch onboarding penyedia | Pembantu konfigurasi onboarding |
  | `plugin-sdk/provider-http` | Pembantu HTTP penyedia | Pembantu kemampuan HTTP/endpoint penyedia generik, termasuk pembantu formulir multipart transkripsi audio |
  | `plugin-sdk/provider-web-fetch` | Pembantu pengambilan web penyedia | Pembantu pendaftaran/cache penyedia pengambilan web |
  | `plugin-sdk/provider-web-search-config-contract` | Pembantu konfigurasi pencarian web penyedia | Pembantu konfigurasi/kredensial pencarian web sempit untuk penyedia yang tidak memerlukan pengabelan pengaktifan Plugin |
  | `plugin-sdk/provider-web-search-contract` | Pembantu kontrak pencarian web penyedia | Pembantu kontrak konfigurasi/kredensial pencarian web sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, dan setter/getter kredensial berskop |
  | `plugin-sdk/provider-web-search` | Pembantu pencarian web penyedia | Pembantu pendaftaran/cache/runtime penyedia pencarian web |
  | `plugin-sdk/provider-tools` | Pembantu kompatibilitas alat/skema penyedia | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, serta pembersihan skema Gemini + diagnostik |
  | `plugin-sdk/provider-usage` | Pembantu penggunaan penyedia | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, dan pembantu penggunaan penyedia lainnya |
  | `plugin-sdk/provider-stream` | Pembantu pembungkus stream penyedia | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe pembungkus stream, dan pembantu pembungkus bersama Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Pembantu transport penyedia | Pembantu transport penyedia native seperti pengambilan berpagar, transformasi pesan transport, dan stream peristiwa transport yang dapat ditulis |
  | `plugin-sdk/keyed-async-queue` | Antrean asinkron berurutan | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Pembantu media bersama | Pembantu pengambilan/transformasi/penyimpanan media, probing dimensi video berbasis ffprobe, dan pembuat payload media |
  | `plugin-sdk/media-generation-runtime` | Pembantu pembuatan media bersama | Pembantu failover bersama, pemilihan kandidat, dan pesan model hilang untuk pembuatan gambar/video/musik |
  | `plugin-sdk/media-understanding` | Pembantu pemahaman media | Tipe penyedia pemahaman media plus ekspor pembantu gambar/audio yang menghadap penyedia |
  | `plugin-sdk/text-runtime` | Ekspor kompatibilitas teks luas yang tidak digunakan lagi | Gunakan `string-coerce-runtime`, `text-chunking`, `text-utility-runtime`, dan `logging-core` |
  | `plugin-sdk/text-chunking` | Pembantu pemecahan teks | Pembantu pemecahan teks keluar |
  | `plugin-sdk/speech` | Pembantu ucapan | Tipe penyedia ucapan plus pembantu direktif, registri, validasi yang menghadap penyedia, dan pembuat TTS kompatibel OpenAI |
  | `plugin-sdk/speech-core` | Inti ucapan bersama | Tipe penyedia ucapan, registri, direktif, normalisasi |
  | `plugin-sdk/realtime-transcription` | Pembantu transkripsi realtime | Tipe penyedia, pembantu registri, dan pembantu sesi WebSocket bersama |
  | `plugin-sdk/realtime-voice` | Pembantu suara realtime | Tipe penyedia, pembantu registri/resolusi, pembantu sesi bridge, antrean talk-back agen bersama, kesehatan transkrip/peristiwa, penekanan gema, dan pembantu konsultasi konteks cepat |
  | `plugin-sdk/image-generation` | Pembantu pembuatan gambar | Tipe penyedia pembuatan gambar plus pembantu aset gambar/URL data dan pembuat penyedia gambar kompatibel OpenAI |
  | `plugin-sdk/image-generation-core` | Inti pembuatan gambar bersama | Tipe pembuatan gambar, failover, autentikasi, dan pembantu registri |
  | `plugin-sdk/music-generation` | Pembantu pembuatan musik | Tipe penyedia/permintaan/hasil pembuatan musik |
  | `plugin-sdk/music-generation-core` | Inti pembuatan musik bersama | Tipe pembuatan musik, pembantu failover, pencarian penyedia, dan parsing ref model |
  | `plugin-sdk/video-generation` | Pembantu pembuatan video | Tipe penyedia/permintaan/hasil pembuatan video |
  | `plugin-sdk/video-generation-core` | Inti pembuatan video bersama | Tipe pembuatan video, pembantu failover, pencarian penyedia, dan parsing ref model |
  | `plugin-sdk/interactive-runtime` | Pembantu balasan interaktif | Normalisasi/reduksi payload balasan interaktif |
  | `plugin-sdk/channel-config-primitives` | Primitif konfigurasi saluran | Primitif skema konfigurasi saluran sempit |
  | `plugin-sdk/channel-config-writes` | Pembantu penulisan konfigurasi saluran | Pembantu otorisasi penulisan konfigurasi saluran |
  | `plugin-sdk/channel-plugin-common` | Prelude saluran bersama | Ekspor prelude Plugin saluran bersama |
  | `plugin-sdk/channel-status` | Pembantu status saluran | Pembantu snapshot/ringkasan status saluran bersama |
  | `plugin-sdk/allowlist-config-edit` | Pembantu konfigurasi allowlist | Pembantu edit/baca konfigurasi allowlist |
  | `plugin-sdk/group-access` | Pembantu akses grup | Pembantu keputusan akses grup bersama |
  | `plugin-sdk/direct-dm` | Pembantu DM langsung | Pembantu autentikasi/guard DM langsung bersama |
  | `plugin-sdk/extension-shared` | Pembantu ekstensi bersama | Primitif pembantu saluran pasif/status dan proxy ambien |
  | `plugin-sdk/webhook-targets` | Pembantu target Webhook | Registri target Webhook dan pembantu pemasangan rute |
  | `plugin-sdk/webhook-path` | Alias jalur Webhook yang tidak digunakan lagi | Gunakan `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Pembantu media web bersama | Pembantu pemuatan media jarak jauh/lokal |
  | `plugin-sdk/zod` | Ekspor ulang kompatibilitas Zod yang tidak digunakan lagi | Impor `zod` dari `zod` secara langsung |
  | `plugin-sdk/memory-core` | Pembantu memory-core bawaan | Permukaan pembantu manajer/konfigurasi/file/CLI memori |
  | `plugin-sdk/memory-core-engine-runtime` | Fasad runtime mesin memori | Fasad runtime indeks/pencarian memori |
  | `plugin-sdk/memory-core-host-engine-foundation` | Mesin fondasi host memori | Ekspor mesin fondasi host memori |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Mesin embedding host memori | Kontrak embedding memori, akses registri, penyedia lokal, dan pembantu batch/jarak jauh generik; penyedia jarak jauh konkret berada di Plugin pemiliknya |
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
  | `plugin-sdk/memory-host-core` | Alias runtime inti host memori | Alias netral vendor untuk pembantu runtime inti host memori |
  | `plugin-sdk/memory-host-events` | Alias jurnal peristiwa host memori | Alias netral vendor untuk pembantu jurnal peristiwa host memori |
  | `plugin-sdk/memory-host-files` | Alias file/runtime memori yang tidak digunakan lagi | Gunakan `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Pembantu markdown terkelola | Pembantu markdown terkelola bersama untuk Plugin yang berdekatan dengan memori |
  | `plugin-sdk/memory-host-search` | Fasad pencarian memori aktif | Fasad runtime manajer pencarian memori aktif malas |
  | `plugin-sdk/memory-host-status` | Alias status host memori yang tidak digunakan lagi | Gunakan `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Utilitas pengujian | Barrel kompatibilitas yang tidak digunakan lagi lokal repo; gunakan subjalur pengujian lokal repo yang terfokus seperti `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`, dan `plugin-sdk/test-fixtures` |
</Accordion>

  Tabel ini sengaja merupakan subset migrasi umum, bukan seluruh permukaan
  SDK. Inventaris entrypoint compiler berada di
  `scripts/lib/plugin-sdk-entrypoints.json`; ekspor paket dibuat dari
  subset publik.

  Seam pembantu Plugin bundel yang dicadangkan telah dipensiunkan dari peta
  ekspor SDK publik kecuali facade kompatibilitas yang didokumentasikan secara
  eksplisit seperti shim `plugin-sdk/discord` yang sudah deprecated dan
  dipertahankan untuk paket `@openclaw/discord@2026.3.13` yang telah
  dipublikasikan. Pembantu khusus pemilik berada di dalam paket plugin
  pemiliknya; perilaku host bersama harus bergerak melalui kontrak SDK generik
  seperti `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`,
  dan `plugin-sdk/plugin-config-runtime`.

  Gunakan impor paling sempit yang sesuai dengan tugasnya. Jika Anda tidak dapat
  menemukan ekspor, periksa sumber di `src/plugin-sdk/` atau tanyakan kepada
  maintainer kontrak generik mana yang harus memilikinya.

  ## Deprecation aktif

  Deprecation yang lebih sempit yang berlaku di seluruh SDK plugin, kontrak
  provider, permukaan runtime, dan manifes. Masing-masing masih berfungsi hari
  ini tetapi akan dihapus dalam rilis mayor mendatang. Entri di bawah setiap
  item memetakan API lama ke pengganti kanonisnya.

  <AccordionGroup>
  <Accordion title="pembuat bantuan command-auth → command-status">
    **Lama (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Baru (`openclaw/plugin-sdk/command-status`)**: signature yang sama, ekspor
    yang sama - hanya diimpor dari subpath yang lebih sempit. `command-auth`
    mengekspor ulang semuanya sebagai stub kompatibilitas.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Pembantu gating mention → resolveInboundMentionDecision">
    **Lama**: `resolveInboundMentionRequirement({ facts, policy })` dan
    `shouldDropInboundForMention(...)` dari
    `openclaw/plugin-sdk/channel-inbound` atau
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Baru**: `resolveInboundMentionDecision({ facts, policy })` - mengembalikan
    satu objek keputusan, bukan dua panggilan terpisah.

    Plugin channel downstream (Slack, Discord, Matrix, MS Teams) sudah
    beralih.

  </Accordion>

  <Accordion title="Shim runtime channel dan pembantu aksi channel">
    `openclaw/plugin-sdk/channel-runtime` adalah shim kompatibilitas untuk plugin
    channel lama. Jangan mengimpornya dari kode baru; gunakan
    `openclaw/plugin-sdk/channel-runtime-context` untuk mendaftarkan objek
    runtime.

    Pembantu `channelActions*` di `openclaw/plugin-sdk/channel-actions` sudah
    deprecated bersama ekspor channel "actions" mentah. Paparkan capability
    melalui permukaan semantik `presentation` sebagai gantinya - plugin channel
    mendeklarasikan apa yang mereka render (kartu, tombol, select), bukan nama
    aksi mentah mana yang mereka terima.

  </Accordion>

  <Accordion title="Pembantu tool() provider pencarian web → createTool() pada plugin">
    **Lama**: factory `tool()` dari `openclaw/plugin-sdk/provider-web-search`.

    **Baru**: implementasikan `createTool(...)` langsung pada plugin provider.
    OpenClaw tidak lagi memerlukan pembantu SDK untuk mendaftarkan wrapper tool.

  </Accordion>

  <Accordion title="Envelope channel plaintext → BodyForAgent">
    **Lama**: `formatInboundEnvelope(...)` (dan
    `ChannelMessageForAgent.channelEnvelope`) untuk membangun envelope prompt
    plaintext datar dari pesan channel masuk.

    **Baru**: `BodyForAgent` ditambah blok konteks pengguna terstruktur. Plugin
    channel melampirkan metadata routing (thread, topik, reply-to, reaksi) sebagai
    field bertipe, bukan menggabungkannya ke dalam string prompt. Pembantu
    `formatAgentEnvelope(...)` masih didukung untuk envelope sintetis yang
    menghadap asisten, tetapi envelope plaintext masuk sedang menuju
    penghapusan.

    Area terdampak: `inbound_claim`, `message_received`, dan plugin channel
    kustom apa pun yang memproses pasca teks `channelEnvelope`.

  </Accordion>

  <Accordion title="Tipe discovery provider → tipe katalog provider">
    Empat alias tipe discovery sekarang menjadi wrapper tipis di atas tipe
    era katalog:

    | Alias lama                | Tipe baru                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Ditambah bag statis lama `ProviderCapabilities` - plugin provider sebaiknya
    menggunakan hook provider eksplisit seperti `buildReplayPolicy`,
    `normalizeToolSchemas`, dan `wrapStreamFn`, bukan objek statis.

  </Accordion>

  <Accordion title="Hook kebijakan berpikir → resolveThinkingProfile">
    **Lama** (tiga hook terpisah pada `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, dan
    `resolveDefaultThinkingLevel(ctx)`.

    **Baru**: satu `resolveThinkingProfile(ctx)` yang mengembalikan
    `ProviderThinkingProfile` dengan `id` kanonis, `label` opsional, dan
    daftar level berperingkat. OpenClaw menurunkan nilai tersimpan yang basi
    berdasarkan peringkat profil secara otomatis.

    Implementasikan satu hook, bukan tiga. Hook lama tetap berfungsi selama
    periode deprecation tetapi tidak dikomposisikan dengan hasil profil.

  </Accordion>

  <Accordion title="Fallback provider OAuth eksternal → contracts.externalAuthProviders">
    **Lama**: mengimplementasikan `resolveExternalOAuthProfiles(...)` tanpa
    mendeklarasikan provider di manifes plugin.

    **Baru**: deklarasikan `contracts.externalAuthProviders` di manifes plugin
    **dan** implementasikan `resolveExternalAuthProfiles(...)`. Jalur lama
    "fallback autentikasi" mengeluarkan peringatan saat runtime dan akan dihapus.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Pencarian env-var provider → setup.providers[].envVars">
    Bidang manifes **lama**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Baru**: cerminkan pencarian env-var yang sama ke `setup.providers[].envVars`
    pada manifes. Ini mengonsolidasikan metadata env penyiapan/status di satu
    tempat dan menghindari menjalankan runtime plugin hanya untuk menjawab
    pencarian env-var.

    `providerAuthEnvVars` tetap didukung melalui adapter kompatibilitas
    hingga jendela deprekasi ditutup.

  </Accordion>

  <Accordion title="Pendaftaran plugin memori → registerMemoryCapability">
    **Lama**: tiga panggilan terpisah -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Baru**: satu panggilan pada API memory-state -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Slot yang sama, satu panggilan pendaftaran. Helper memori tambahan
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) tidak terpengaruh.

  </Accordion>

  <Accordion title="Tipe pesan sesi subagen diganti nama">
    Dua alias tipe lama masih diekspor dari `src/plugins/runtime/types.ts`:

    | Lama                          | Baru                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Metode runtime `readSession` dideprekasi dan digantikan oleh
    `getSessionMessages`. Signature sama; metode lama meneruskan panggilan ke
    metode baru.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Lama**: `runtime.tasks.flow` (tunggal) mengembalikan aksesor task-flow live.

    **Baru**: `runtime.tasks.managedFlows` mempertahankan runtime mutasi
    TaskFlow terkelola untuk plugin yang membuat, memperbarui, membatalkan,
    atau menjalankan tugas anak dari flow. Gunakan `runtime.tasks.flows` saat
    plugin hanya memerlukan pembacaan berbasis DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Factory ekstensi tertanam → middleware hasil tool agen">
    Dicakup dalam "Cara bermigrasi → Migrasikan ekstensi hasil tool Pi ke
    middleware" di atas. Disertakan di sini untuk kelengkapan: jalur khusus Pi
    `api.registerEmbeddedExtensionFactory(...)` yang telah dihapus digantikan oleh
    `api.registerAgentToolResultMiddleware(...)` dengan daftar runtime eksplisit
    di `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` yang diekspor ulang dari `openclaw/plugin-sdk` sekarang
    adalah alias satu baris untuk `OpenClawConfig`. Utamakan nama kanonis.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Deprekasi tingkat ekstensi (di dalam plugin channel/provider bawaan di bawah
`extensions/`) dilacak di dalam barrel `api.ts` dan `runtime-api.ts`
masing-masing. Deprekasi tersebut tidak memengaruhi kontrak plugin pihak ketiga
dan tidak dicantumkan di sini. Jika Anda menggunakan barrel lokal plugin bawaan
secara langsung, baca komentar deprekasi di barrel tersebut sebelum meningkatkan versi.
</Note>

## Linimasa penghapusan

| Kapan                  | Apa yang terjadi                                                       |
| ---------------------- | ----------------------------------------------------------------------- |
| **Sekarang**           | Surface yang dideprekasi mengeluarkan peringatan runtime                |
| **Rilis mayor berikutnya** | Surface yang dideprekasi akan dihapus; plugin yang masih menggunakannya akan gagal |

Semua plugin inti sudah dimigrasikan. Plugin eksternal harus bermigrasi
sebelum rilis mayor berikutnya.

## Menekan peringatan sementara

Tetapkan variabel lingkungan ini saat Anda mengerjakan migrasi:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Ini adalah pintu keluar sementara, bukan solusi permanen.

## Terkait

- [Memulai](/id/plugins/building-plugins) - bangun plugin pertama Anda
- [Ikhtisar SDK](/id/plugins/sdk-overview) - referensi impor subpath lengkap
- [Plugin Channel](/id/plugins/sdk-channel-plugins) - membangun plugin channel
- [Plugin Provider](/id/plugins/sdk-provider-plugins) - membangun plugin provider
- [Internal Plugin](/id/plugins/architecture) - pembahasan mendalam arsitektur
- [Manifes Plugin](/id/plugins/manifest) - referensi skema manifes
