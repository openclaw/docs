---
read_when:
    - Anda melihat peringatan OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Anda melihat peringatan OPENCLAW_EXTENSION_API_DEPRECATED
    - Anda menggunakan api.registerEmbeddedExtensionFactory sebelum OpenClaw 2026.4.25
    - Anda sedang memperbarui Plugin ke arsitektur Plugin modern
    - Anda memelihara Plugin OpenClaw eksternal
sidebarTitle: Migrate to SDK
summary: Bermigrasi dari lapisan kompatibilitas mundur lama ke SDK Plugin modern
title: Migrasi Plugin SDK
x-i18n:
    generated_at: "2026-05-06T09:23:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: f629f6e3f9a0c122f3065d9b0b6b418e1c1ba29d42aff9ed025d61189be3e42a
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw telah beralih dari lapisan kompatibilitas mundur yang luas ke arsitektur Plugin modern dengan impor yang terfokus dan terdokumentasi. Jika Plugin Anda dibuat sebelum arsitektur baru, panduan ini membantu Anda bermigrasi.

## Apa yang berubah

Sistem Plugin lama menyediakan dua permukaan yang sangat terbuka yang memungkinkan Plugin mengimpor apa pun yang mereka perlukan dari satu titik masuk:

- **`openclaw/plugin-sdk/compat`** - satu impor yang mengekspor ulang puluhan helper. Ini diperkenalkan untuk menjaga Plugin lama berbasis hook tetap berfungsi sementara arsitektur Plugin baru sedang dibangun.
- **`openclaw/plugin-sdk/infra-runtime`** - barrel helper runtime yang luas yang mencampur event sistem, status heartbeat, antrean pengiriman, helper fetch/proxy, helper file, tipe approval, dan utilitas yang tidak terkait.
- **`openclaw/plugin-sdk/config-runtime`** - barrel kompatibilitas config yang luas yang masih membawa helper load/write langsung yang sudah deprecated selama jendela migrasi.
- **`openclaw/extension-api`** - bridge yang memberi Plugin akses langsung ke helper sisi host seperti runner agent tertanam.
- **`api.registerEmbeddedExtensionFactory(...)`** - hook ekstensi bundled khusus Pi yang sudah dihapus yang dapat mengamati event embedded-runner seperti `tool_result`.

Permukaan impor yang luas sekarang **deprecated**. Permukaan tersebut masih berfungsi saat runtime, tetapi Plugin baru tidak boleh menggunakannya, dan Plugin yang sudah ada sebaiknya bermigrasi sebelum rilis major berikutnya menghapusnya. API pendaftaran embedded extension factory khusus Pi telah dihapus; gunakan middleware hasil-tool sebagai gantinya.

OpenClaw tidak menghapus atau menafsirkan ulang perilaku Plugin yang terdokumentasi dalam perubahan yang sama saat pengganti diperkenalkan. Perubahan kontrak yang breaking harus terlebih dahulu melalui adapter kompatibilitas, diagnostik, docs, dan jendela deprecation. Ini berlaku untuk impor SDK, field manifest, API setup, hook, dan perilaku pendaftaran runtime.

<Warning>
  Lapisan kompatibilitas mundur akan dihapus dalam rilis major mendatang.
  Plugin yang masih mengimpor dari permukaan ini akan rusak ketika itu terjadi.
  Pendaftaran embedded extension factory khusus Pi sudah tidak lagi dimuat.
</Warning>

## Mengapa ini berubah

Pendekatan lama menyebabkan masalah:

- **Startup lambat** - mengimpor satu helper memuat puluhan modul yang tidak terkait
- **Dependensi sirkular** - re-export yang luas memudahkan pembuatan siklus impor
- **Permukaan API tidak jelas** - tidak ada cara untuk mengetahui export mana yang stabil vs internal

SDK Plugin modern memperbaiki ini: setiap jalur impor (`openclaw/plugin-sdk/\<subpath\>`) adalah modul kecil, mandiri, dengan tujuan yang jelas dan kontrak yang terdokumentasi.

Seam kemudahan provider legacy untuk channel bundled juga sudah dihapus. Seam helper bermerek channel adalah shortcut mono-repo privat, bukan kontrak Plugin yang stabil. Gunakan subpath SDK generik yang sempit sebagai gantinya. Di dalam workspace Plugin bundled, simpan helper milik provider di `api.ts` atau `runtime-api.ts` milik Plugin itu sendiri.

Contoh provider bundled saat ini:

- Anthropic menyimpan helper stream khusus Claude di seam `api.ts` / `contract-api.ts` miliknya sendiri
- OpenAI menyimpan builder provider, helper model default, dan builder provider realtime di `api.ts` miliknya sendiri
- OpenRouter menyimpan builder provider dan helper onboarding/config di `api.ts` miliknya sendiri

## Rencana migrasi Talk dan suara realtime

Kode suara realtime, telephony, meeting, dan Talk browser berpindah dari pembukuan turn lokal-permukaan ke controller sesi Talk bersama yang diekspor oleh `openclaw/plugin-sdk/realtime-voice`. Controller baru memiliki envelope event Talk umum, status turn aktif, status capture, status output-audio, riwayat event terbaru, dan penolakan stale-turn. Plugin provider harus tetap memiliki sesi realtime khusus vendor; Plugin permukaan harus tetap memiliki capture, playback, telephony, dan kekhususan meeting.

Migrasi Talk ini sengaja breaking-clean:

1. Simpan primitive controller/runtime bersama di `plugin-sdk/realtime-voice`.
2. Pindahkan permukaan bundled ke controller bersama: browser relay, managed-room handoff, voice-call realtime, voice-call streaming STT, Google Meet realtime, dan native push-to-talk.
3. Ganti keluarga RPC Talk lama dengan API final `talk.session.*` dan `talk.client.*`.
4. Iklankan satu channel event Talk live di Gateway `hello-ok.features.events`: `talk.event`.
5. Hapus endpoint HTTP realtime lama dan jalur override instruksi pada waktu request apa pun.

Kode baru sebaiknya tidak memanggil `createTalkEventSequencer(...)` secara langsung kecuali sedang mengimplementasikan adapter level rendah atau fixture test. Pilih controller bersama agar event dengan cakupan turn tidak dapat dipancarkan tanpa turn id, panggilan `turnEnd` / `turnCancel` yang stale tidak dapat menghapus turn aktif yang lebih baru, dan event lifecycle output-audio tetap konsisten di telephony, meeting, browser relay, managed-room handoff, dan client Talk native.

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

Sesi WebRTC/provider-websocket milik browser menggunakan `talk.client.create`, karena browser memiliki negosiasi provider dan transport media sementara Gateway memiliki kredensial, instruksi, dan kebijakan tool. `talk.session.*` adalah permukaan umum yang dikelola Gateway untuk realtime gateway-relay, transkripsi gateway-relay, dan sesi native STT/TTS managed-room.

Config legacy yang menempatkan selector realtime di samping `talk.provider` / `talk.providers` sebaiknya diperbaiki dengan `openclaw doctor --fix`; runtime Talk tidak menafsirkan ulang config provider speech/TTS sebagai config provider realtime.

Kombinasi `talk.session.create` yang didukung sengaja kecil:

| Mode            | Transport       | Brain           | Pemilik            | Catatan                                                                                                            |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Audio provider full-duplex dijembatani melalui Gateway; panggilan tool dirutekan melalui tool agent-consult.       |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Hanya STT streaming; caller mengirim audio input dan menerima event transkrip.                                     |
| `stt-tts`       | `managed-room`  | `agent-consult` | Room native/client | Room gaya push-to-talk dan walkie-talkie tempat client memiliki capture/playback dan Gateway memiliki status turn. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Room native/client | Mode room khusus admin untuk permukaan first-party tepercaya yang menjalankan tindakan tool Gateway secara langsung. |

Peta method yang dihapus:

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

Kosakata kontrol terpadu juga sengaja sempit:

| Method                          | Berlaku untuk                                           | Kontrak                                                                                       |
| ------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Tambahkan chunk audio PCM base64 ke sesi provider yang dimiliki oleh koneksi Gateway yang sama. |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Mulai turn pengguna managed-room.                                                             |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Akhiri turn aktif setelah validasi stale-turn.                                                 |
| `talk.session.cancelTurn`       | semua sesi milik Gateway                                | Batalkan pekerjaan capture/provider/agent/TTS aktif untuk sebuah turn.                        |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Hentikan output audio assistant tanpa harus mengakhiri turn pengguna.                         |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Selesaikan panggilan tool provider yang dipancarkan oleh relay.                               |
| `talk.session.close`            | semua sesi terpadu                                      | Hentikan sesi relay atau cabut status managed-room, lalu lupakan id sesi terpadu.             |

Jangan memperkenalkan kasus khusus provider atau platform di core untuk membuat ini berfungsi. Core memiliki semantik sesi Talk. Plugin provider memiliki setup sesi vendor. Voice-call dan Google Meet memiliki adapter telephony/meeting. Aplikasi browser dan native memiliki UX capture/playback perangkat.

## Kebijakan kompatibilitas

Untuk Plugin eksternal, pekerjaan kompatibilitas mengikuti urutan ini:

1. tambahkan kontrak baru
2. pertahankan perilaku lama yang dihubungkan melalui adapter kompatibilitas
3. pancarkan diagnostik atau warning yang menyebutkan jalur lama dan penggantinya
4. cakup kedua jalur dalam test
5. dokumentasikan deprecation dan jalur migrasi
6. hapus hanya setelah jendela migrasi yang diumumkan, biasanya dalam rilis major

  Pengelola dapat mengaudit antrean migrasi saat ini dengan
  `pnpm plugins:boundary-report`. Gunakan `pnpm plugins:boundary-report:summary` untuk
  jumlah yang ringkas, `--owner <id>` untuk satu plugin atau pemilik kompatibilitas, dan
  `pnpm plugins:boundary-report:ci` ketika gerbang CI harus gagal pada catatan
  kompatibilitas yang jatuh tempo, impor SDK tercadangkan lintas-pemilik, atau subjalur SDK
  tercadangkan yang tidak digunakan. Laporan mengelompokkan catatan kompatibilitas
  yang tidak digunakan lagi berdasarkan tanggal penghapusan, menghitung referensi
  kode/dokumen lokal, menampilkan impor SDK tercadangkan lintas-pemilik, dan merangkum
  jembatan SDK host memori privat agar pembersihan kompatibilitas tetap eksplisit alih-alih
  bergantung pada pencarian ad hoc. Subjalur SDK tercadangkan harus memiliki penggunaan
  pemilik yang terlacak; ekspor helper tercadangkan yang tidak digunakan harus dihapus dari SDK publik.

  Jika sebuah bidang manifes masih diterima, penulis plugin dapat terus menggunakannya hingga
  dokumentasi dan diagnostik menyatakan sebaliknya. Kode baru sebaiknya mengutamakan
  pengganti yang terdokumentasi, tetapi plugin yang sudah ada tidak boleh rusak selama
  rilis minor biasa.

  ## Cara bermigrasi

  <Steps>
  <Step title="Migrasikan helper muat/tulis konfigurasi waktu proses">
    Plugin bawaan harus berhenti memanggil
    `api.runtime.config.loadConfig()` dan
    `api.runtime.config.writeConfigFile(...)` secara langsung. Utamakan konfigurasi yang
    sudah diteruskan ke jalur panggilan aktif. Penangan berumur panjang yang memerlukan
    cuplikan proses saat ini dapat menggunakan `api.runtime.config.current()`. Alat agen
    berumur panjang harus menggunakan `ctx.getRuntimeConfig()` dari konteks alat di dalam
    `execute` agar alat yang dibuat sebelum penulisan konfigurasi tetap melihat
    konfigurasi waktu proses yang telah disegarkan.

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

    Gunakan `afterWrite: { mode: "restart", reason: "..." }` ketika pemanggil mengetahui
    perubahan tersebut memerlukan restart Gateway yang bersih, dan
    `afterWrite: { mode: "none", reason: "..." }` hanya ketika pemanggil memiliki tindak
    lanjutnya dan dengan sengaja ingin menekan perencana pemuatan ulang.
    Hasil mutasi menyertakan ringkasan `followUp` bertipe untuk pengujian dan pencatatan;
    Gateway tetap bertanggung jawab untuk menerapkan atau menjadwalkan restart.
    `loadConfig` dan `writeConfigFile` tetap menjadi helper kompatibilitas yang
    tidak digunakan lagi untuk plugin eksternal selama jendela migrasi dan memperingatkan
    sekali dengan kode kompatibilitas `runtime-config-load-write`. Plugin bawaan dan kode
    waktu proses repo dilindungi oleh pagar pembatas pemindai di
    `pnpm check:deprecated-internal-config-api` dan
    `pnpm check:no-runtime-action-load-config`: penggunaan plugin produksi baru
    langsung gagal, penulisan konfigurasi langsung gagal, metode server Gateway harus
    menggunakan cuplikan waktu proses permintaan, helper kirim/aksi/klien saluran waktu
    proses harus menerima konfigurasi dari batasnya, dan modul waktu proses berumur panjang
    tidak memiliki panggilan `loadConfig()` ambien yang diizinkan.

    Kode plugin baru juga harus menghindari mengimpor modul pengumpul kompatibilitas luas
    `openclaw/plugin-sdk/config-runtime`. Gunakan subjalur SDK sempit yang sesuai dengan pekerjaan:

    | Kebutuhan | Impor |
    | --- | --- |
    | Tipe konfigurasi seperti `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Asersi konfigurasi yang sudah dimuat dan pencarian konfigurasi entri-plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Pembacaan cuplikan waktu proses saat ini | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Penulisan konfigurasi | `openclaw/plugin-sdk/config-mutation` |
    | Helper penyimpanan sesi | `openclaw/plugin-sdk/session-store-runtime` |
    | Konfigurasi tabel Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helper waktu proses kebijakan grup | `openclaw/plugin-sdk/runtime-group-policy` |
    | Resolusi masukan rahasia | `openclaw/plugin-sdk/secret-input-runtime` |
    | Penggantian model/sesi | `openclaw/plugin-sdk/model-session-runtime` |

    Plugin bawaan dan pengujiannya dilindungi pemindai dari modul pengumpul luas
    agar impor dan mock tetap lokal pada perilaku yang dibutuhkan. Modul pengumpul luas
    masih ada untuk kompatibilitas eksternal, tetapi kode baru tidak boleh
    bergantung padanya.

  </Step>

  <Step title="Migrasikan ekstensi hasil-alat Pi ke middleware">
    Plugin bawaan harus mengganti penangan hasil-alat khusus Pi
    `api.registerEmbeddedExtensionFactory(...)` dengan middleware netral waktu proses.

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

    Plugin eksternal tidak dapat mendaftarkan middleware hasil-alat karena middleware tersebut dapat
    menulis ulang keluaran alat berkepercayaan tinggi sebelum model melihatnya.

  </Step>

  <Step title="Migrasikan penangan native-persetujuan ke fakta kapabilitas">
    Plugin saluran berkemampuan persetujuan sekarang mengekspos perilaku persetujuan native melalui
    `approvalCapability.nativeRuntime` plus registri konteks waktu proses bersama.

    Perubahan utama:

    - Ganti `approvalCapability.handler.loadRuntime(...)` dengan
      `approvalCapability.nativeRuntime`
    - Pindahkan auth/pengiriman khusus persetujuan dari pengkabelan lama `plugin.auth` /
      `plugin.approvals` ke `approvalCapability`
    - `ChannelPlugin.approvals` telah dihapus dari kontrak plugin saluran publik;
      pindahkan bidang pengiriman/native/render ke `approvalCapability`
    - `plugin.auth` tetap ada hanya untuk alur login/logout saluran; hook auth persetujuan
      di sana tidak lagi dibaca oleh core
    - Daftarkan objek waktu proses milik saluran seperti klien, token, atau aplikasi Bolt
      melalui `openclaw/plugin-sdk/channel-runtime-context`
    - Jangan kirim pemberitahuan pengalihan milik plugin dari penangan persetujuan native;
      core sekarang memiliki pemberitahuan dialihkan-ke-tempat-lain dari hasil pengiriman aktual
    - Saat meneruskan `channelRuntime` ke `createChannelManager(...)`, sediakan
      permukaan `createPluginRuntime().channel` yang nyata. Stub parsial ditolak.

    Lihat `/plugins/sdk-channel-plugins` untuk tata letak kapabilitas persetujuan saat ini.

  </Step>

  <Step title="Audit perilaku fallback wrapper Windows">
    Jika plugin Anda menggunakan `openclaw/plugin-sdk/windows-spawn`, wrapper Windows
    `.cmd`/`.bat` yang tidak terselesaikan sekarang gagal secara tertutup kecuali Anda secara eksplisit meneruskan
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

    Jika pemanggil Anda tidak sengaja bergantung pada fallback melalui shell, jangan tetapkan
    `allowShellFallback` dan tangani error yang dilempar sebagai gantinya.

  </Step>

  <Step title="Temukan impor yang tidak digunakan lagi">
    Cari impor dari salah satu permukaan yang tidak digunakan lagi di plugin Anda:

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

    Untuk helper sisi host, gunakan waktu proses plugin yang diinjeksi alih-alih mengimpor
    secara langsung:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Pola yang sama berlaku untuk helper jembatan lama lainnya:

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
    `openclaw/plugin-sdk/infra-runtime` masih ada untuk kompatibilitas eksternal,
    tetapi kode baru harus mengimpor permukaan helper terfokus yang
    benar-benar dibutuhkannya:

    | Kebutuhan | Impor |
    | --- | --- |
    | Helper antrean peristiwa sistem | `openclaw/plugin-sdk/system-event-runtime` |
    | Helper peristiwa dan visibilitas Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Pengurasan antrean pengiriman tertunda | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetri aktivitas saluran | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Cache deduplikasi dalam memori | `openclaw/plugin-sdk/dedupe-runtime` |
    | Helper jalur file/media lokal yang aman | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch yang sadar dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Helper proxy dan fetch berpagar | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipe kebijakan dispatcher SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipe permintaan/resolusi persetujuan | `openclaw/plugin-sdk/approval-runtime` |
    | Helper payload balasan persetujuan dan perintah | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helper pemformatan error | `openclaw/plugin-sdk/error-runtime` |
    | Penungguan kesiapan transport | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helper token aman | `openclaw/plugin-sdk/secure-random-runtime` |
    | Konkurensi tugas asinkron berbatas | `openclaw/plugin-sdk/concurrency-runtime` |
    | Koersi numerik | `openclaw/plugin-sdk/number-runtime` |
    | Kunci asinkron lokal-proses | `openclaw/plugin-sdk/async-lock-runtime` |
    | Kunci file | `openclaw/plugin-sdk/file-lock` |

    Plugin bawaan dilindungi pemindai dari `infra-runtime`, sehingga kode repo
    tidak dapat mundur ke modul pengumpul luas.

  </Step>

  <Step title="Migrasikan helper rute saluran">
    Kode rute saluran baru harus menggunakan `openclaw/plugin-sdk/channel-route`.
    Nama route-key dan comparable-target yang lebih lama tetap ada sebagai alias kompatibilitas
    selama jendela migrasi, tetapi plugin baru harus menggunakan nama rute
    yang menjelaskan perilaku secara langsung:

    | Helper lama | Helper modern |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Helper rute modern menormalkan `{ channel, to, accountId, threadId }`
    secara konsisten di seluruh persetujuan native, supresi balasan, deduplikasi inbound,
    pengiriman cron, dan perutean sesi. Jika plugin Anda memiliki tata bahasa target
    kustom, gunakan `resolveChannelRouteTargetWithParser(...)` untuk mengadaptasi
    parser tersebut ke kontrak target rute yang sama.

  </Step>

  <Step title="Bangun dan uji">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referensi jalur impor

  <Accordion title="Common import path table">
  | Jalur impor | Tujuan | Ekspor utama |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper entri plugin kanonis | `definePluginEntry` |
  | `plugin-sdk/core` | Ekspor ulang payung legacy untuk definisi/builder entri channel | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Ekspor skema konfigurasi root | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper entri provider tunggal | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definisi dan builder entri channel terfokus | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helper wizard setup bersama | Prompt allowlist, builder status setup |
  | `plugin-sdk/setup-runtime` | Helper runtime saat setup | Adapter patch setup yang aman diimpor, helper catatan lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy setup terdelegasi |
  | `plugin-sdk/setup-adapter-runtime` | Helper adapter setup | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helper tooling setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper multi-akun | Helper daftar akun/konfigurasi/action-gate |
  | `plugin-sdk/account-id` | Helper account-id | `DEFAULT_ACCOUNT_ID`, normalisasi account-id |
  | `plugin-sdk/account-resolution` | Helper lookup akun | Helper lookup akun + default-fallback |
  | `plugin-sdk/account-helpers` | Helper akun sempit | Helper daftar akun/account-action |
  | `plugin-sdk/channel-setup` | Adapter wizard setup | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitif pairing DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Pengawatan prefiks balasan, pengetikan, dan pengiriman sumber | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Factory adapter konfigurasi dan helper akses DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Builder skema konfigurasi | Primitif skema konfigurasi channel bersama dan hanya builder generik |
  | `plugin-sdk/bundled-channel-config-schema` | Skema konfigurasi bundel | Hanya plugin bundel yang dipelihara OpenClaw; plugin baru harus mendefinisikan skema lokal plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Skema konfigurasi bundel yang tidak digunakan lagi | Hanya alias kompatibilitas; gunakan `plugin-sdk/bundled-channel-config-schema` untuk plugin bundel yang dipelihara |
  | `plugin-sdk/telegram-command-config` | Helper konfigurasi perintah Telegram | Normalisasi nama perintah, pemangkasan deskripsi, validasi duplikat/konflik |
  | `plugin-sdk/channel-policy` | Resolusi kebijakan grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helper status akun dan siklus hidup stream draf | `createAccountStatusSink`, helper finalisasi pratinjau draf |
  | `plugin-sdk/inbound-envelope` | Helper envelope masuk | Helper builder route + envelope bersama |
  | `plugin-sdk/inbound-reply-dispatch` | Helper balasan masuk | Helper pencatatan-dan-dispatch bersama |
  | `plugin-sdk/messaging-targets` | Parsing target pesan | Helper parsing/pencocokan target |
  | `plugin-sdk/outbound-media` | Helper media keluar | Pemuatan media keluar bersama |
  | `plugin-sdk/outbound-send-deps` | Helper dependensi kirim keluar | Lookup `resolveOutboundSendDep` ringan tanpa mengimpor runtime keluar penuh |
  | `plugin-sdk/outbound-runtime` | Helper runtime keluar | Helper pengiriman keluar, delegasi identitas/kirim, sesi, pemformatan, dan perencanaan payload |
  | `plugin-sdk/thread-bindings-runtime` | Helper thread-binding | Helper siklus hidup thread-binding dan adapter |
  | `plugin-sdk/agent-media-payload` | Helper payload media legacy | Builder payload media agen untuk tata letak field legacy |
  | `plugin-sdk/channel-runtime` | Shim kompatibilitas yang tidak digunakan lagi | Hanya utilitas runtime channel legacy |
  | `plugin-sdk/channel-send-result` | Tipe hasil kirim | Tipe hasil balasan |
  | `plugin-sdk/runtime-store` | Penyimpanan plugin persisten | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helper runtime luas | Helper runtime/logging/backup/instalasi-plugin |
  | `plugin-sdk/runtime-env` | Helper env runtime sempit | Logger/runtime env, timeout, retry, dan helper backoff |
  | `plugin-sdk/plugin-runtime` | Helper runtime plugin bersama | Helper perintah/hook/http/interaktif plugin |
  | `plugin-sdk/hook-runtime` | Helper pipeline hook | Helper pipeline Webhook/internal hook bersama |
  | `plugin-sdk/lazy-runtime` | Helper runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper proses | Helper exec bersama |
  | `plugin-sdk/cli-runtime` | Helper runtime CLI | Pemformatan perintah, penantian, helper versi |
  | `plugin-sdk/gateway-runtime` | Helper Gateway | Klien Gateway, helper start event-loop-ready, dan helper patch status-channel |
  | `plugin-sdk/config-runtime` | Shim kompatibilitas konfigurasi yang tidak digunakan lagi | Utamakan `config-types`, `plugin-config-runtime`, `runtime-config-snapshot`, dan `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Helper perintah Telegram | Helper validasi perintah Telegram yang stabil sebagai fallback saat permukaan kontrak Telegram bundel tidak tersedia |
  | `plugin-sdk/approval-runtime` | Helper prompt persetujuan | Payload persetujuan exec/plugin, helper kapabilitas/profil persetujuan, helper routing/runtime persetujuan native, dan pemformatan jalur tampilan persetujuan terstruktur |
  | `plugin-sdk/approval-auth-runtime` | Helper auth persetujuan | Resolusi approver, auth aksi di chat yang sama |
  | `plugin-sdk/approval-client-runtime` | Helper klien persetujuan | Helper profil/filter persetujuan exec native |
  | `plugin-sdk/approval-delivery-runtime` | Helper pengiriman persetujuan | Adapter kapabilitas/pengiriman persetujuan native |
  | `plugin-sdk/approval-gateway-runtime` | Helper Gateway persetujuan | Helper resolusi Gateway persetujuan bersama |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helper adapter persetujuan | Helper pemuatan adapter persetujuan native ringan untuk entrypoint channel panas |
  | `plugin-sdk/approval-handler-runtime` | Helper handler persetujuan | Helper runtime handler persetujuan yang lebih luas; utamakan seam adapter/gateway yang lebih sempit ketika sudah cukup |
  | `plugin-sdk/approval-native-runtime` | Helper target persetujuan | Helper binding target/akun persetujuan native |
  | `plugin-sdk/approval-reply-runtime` | Helper balasan persetujuan | Helper payload balasan persetujuan exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helper runtime-context channel | Helper register/get/watch runtime-context channel generik |
  | `plugin-sdk/security-runtime` | Helper keamanan | Trust bersama, gating DM, helper file/jalur berbatas root, konten eksternal, dan pengumpulan rahasia |
  | `plugin-sdk/ssrf-policy` | Helper kebijakan SSRF | Helper kebijakan allowlist host dan jaringan privat |
  | `plugin-sdk/ssrf-runtime` | Helper runtime SSRF | Helper pinned-dispatcher, guarded fetch, kebijakan SSRF |
  | `plugin-sdk/system-event-runtime` | Helper event sistem | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Helper Heartbeat | Helper event Heartbeat dan visibilitas |
  | `plugin-sdk/delivery-queue-runtime` | Helper antrean pengiriman | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Helper aktivitas channel | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Helper dedupe | Cache dedupe dalam memori |
  | `plugin-sdk/file-access-runtime` | Helper akses file | Helper jalur file/media lokal yang aman |
  | `plugin-sdk/transport-ready-runtime` | Helper kesiapan transport | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Helper cache berbatas | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper gating diagnostik | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper pemformatan error | `formatUncaughtError`, `isApprovalNotFoundError`, helper grafik error |
  | `plugin-sdk/fetch-runtime` | Helper fetch/proxy terbungkus | `resolveFetch`, helper proxy, helper opsi EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Helper normalisasi host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper retry | `RetryConfig`, `retryAsync`, runner kebijakan |
  | `plugin-sdk/allow-from` | Pemformatan allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Pemetaan input allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating perintah dan helper permukaan perintah | `resolveControlCommandGate`, helper otorisasi pengirim, helper registry perintah termasuk pemformatan menu argumen dinamis |
  | `plugin-sdk/command-status` | Renderer status/bantuan perintah | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing input rahasia | Helper input rahasia |
  | `plugin-sdk/webhook-ingress` | Helper permintaan Webhook | Utilitas target Webhook |
  | `plugin-sdk/webhook-request-guards` | Helper guard body Webhook | Helper pembacaan/batas body permintaan |
  | `plugin-sdk/reply-runtime` | Runtime balasan bersama | Dispatch masuk, heartbeat, perencana balasan, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helper dispatch balasan sempit | Helper finalisasi, dispatch provider, dan label percakapan |
  | `plugin-sdk/reply-history` | Helper riwayat balasan | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Perencanaan referensi balasan | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper chunk balasan | Helper chunking teks/markdown |
  | `plugin-sdk/session-store-runtime` | Helper store sesi | Helper jalur store + updated-at |
  | `plugin-sdk/state-paths` | Helper jalur status | Helper dir status dan OAuth |
  | `plugin-sdk/routing` | Helper routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper normalisasi session-key |
  | `plugin-sdk/status-helpers` | Helper status channel | Builder ringkasan status channel/akun, default runtime-state, helper metadata isu |
  | `plugin-sdk/target-resolver-runtime` | Helper resolver target | Helper resolver target bersama |
  | `plugin-sdk/string-normalization-runtime` | Helper normalisasi string | Helper normalisasi slug/string |
  | `plugin-sdk/request-url` | Helper URL permintaan | Ekstrak URL string dari input mirip permintaan |
  | `plugin-sdk/run-command` | Helper perintah berwaktu | Runner perintah berwaktu dengan stdout/stderr ternormalisasi |
  | `plugin-sdk/param-readers` | Reader param | Reader param tool/CLI umum |
  | `plugin-sdk/tool-payload` | Ekstraksi payload alat | Ekstrak payload ternormalisasi dari objek hasil alat |
  | `plugin-sdk/tool-send` | Ekstraksi pengiriman alat | Ekstrak bidang target pengiriman kanonis dari argumen alat |
  | `plugin-sdk/temp-path` | Helper jalur sementara | Helper jalur unduhan sementara bersama |
  | `plugin-sdk/logging-core` | Helper pencatatan log | Helper pencatat log subsistem dan redaksi |
  | `plugin-sdk/markdown-table-runtime` | Helper tabel Markdown | Helper mode tabel Markdown |
  | `plugin-sdk/reply-payload` | Jenis balasan pesan | Jenis payload balasan |
  | `plugin-sdk/provider-setup` | Helper penyiapan penyedia lokal/dihosting sendiri yang dikurasi | Helper penemuan/konfigurasi penyedia yang dihosting sendiri |
  | `plugin-sdk/self-hosted-provider-setup` | Helper penyiapan penyedia dihosting sendiri yang kompatibel dengan OpenAI dan terfokus | Helper penemuan/konfigurasi penyedia yang dihosting sendiri yang sama |
  | `plugin-sdk/provider-auth-runtime` | Helper autentikasi runtime penyedia | Helper resolusi kunci API runtime |
  | `plugin-sdk/provider-auth-api-key` | Helper penyiapan kunci API penyedia | Helper orientasi kunci API/penulisan profil |
  | `plugin-sdk/provider-auth-result` | Helper hasil autentikasi penyedia | Builder hasil autentikasi OAuth standar |
  | `plugin-sdk/provider-auth-login` | Helper login interaktif penyedia | Helper login interaktif bersama |
  | `plugin-sdk/provider-selection-runtime` | Helper pemilihan penyedia | Pemilihan penyedia terkonfigurasi-atau-otomatis dan penggabungan konfigurasi penyedia mentah |
  | `plugin-sdk/provider-env-vars` | Helper variabel lingkungan penyedia | Helper pencarian variabel lingkungan autentikasi penyedia |
  | `plugin-sdk/provider-model-shared` | Helper model/pemutaran ulang penyedia bersama | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder kebijakan pemutaran ulang bersama, helper titik akhir penyedia, dan helper normalisasi ID model |
  | `plugin-sdk/provider-catalog-shared` | Helper katalog penyedia bersama | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch orientasi penyedia | Helper konfigurasi orientasi |
  | `plugin-sdk/provider-http` | Helper HTTP penyedia | Helper kemampuan HTTP/titik akhir penyedia generik, termasuk helper formulir multipart transkripsi audio |
  | `plugin-sdk/provider-web-fetch` | Helper pengambilan web penyedia | Helper pendaftaran/cache penyedia pengambilan web |
  | `plugin-sdk/provider-web-search-config-contract` | Helper konfigurasi pencarian web penyedia | Helper konfigurasi/kredensial pencarian web yang sempit untuk penyedia yang tidak memerlukan pengawatan pengaktifan Plugin |
  | `plugin-sdk/provider-web-search-contract` | Helper kontrak pencarian web penyedia | Helper kontrak konfigurasi/kredensial pencarian web yang sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, dan setter/getter kredensial terskop |
  | `plugin-sdk/provider-web-search` | Helper pencarian web penyedia | Helper pendaftaran/cache/runtime penyedia pencarian web |
  | `plugin-sdk/provider-tools` | Helper kompatibilitas alat/skema penyedia | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pembersihan skema Gemini + diagnostik, dan helper kompatibilitas xAI seperti `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helper penggunaan penyedia | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, dan helper penggunaan penyedia lainnya |
  | `plugin-sdk/provider-stream` | Helper pembungkus stream penyedia | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, jenis pembungkus stream, dan helper pembungkus Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot bersama |
  | `plugin-sdk/provider-transport-runtime` | Helper transport penyedia | Helper transport penyedia native seperti fetch terlindungi, transformasi pesan transport, dan stream peristiwa transport yang dapat ditulis |
  | `plugin-sdk/keyed-async-queue` | Antrean asinkron terurut | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helper media bersama | Helper pengambilan/transformasi/penyimpanan media, pemeriksaan dimensi video berbasis ffprobe, dan builder payload media |
  | `plugin-sdk/media-generation-runtime` | Helper pembuatan media bersama | Helper failover bersama, pemilihan kandidat, dan pesan model yang hilang untuk pembuatan gambar/video/musik |
  | `plugin-sdk/media-understanding` | Helper pemahaman media | Jenis penyedia pemahaman media plus ekspor helper gambar/audio yang menghadap penyedia |
  | `plugin-sdk/text-runtime` | Helper teks bersama | Penghapusan teks yang terlihat oleh asisten, helper render/pemotongan/tabel Markdown, helper redaksi, helper tag direktif, utilitas teks aman, dan helper teks/pencatatan log terkait |
  | `plugin-sdk/text-chunking` | Helper pemotongan teks | Helper pemotongan teks keluar |
  | `plugin-sdk/speech` | Helper wicara | Jenis penyedia wicara plus helper direktif, registri, validasi yang menghadap penyedia, dan builder TTS kompatibel OpenAI |
  | `plugin-sdk/speech-core` | Inti wicara bersama | Jenis penyedia wicara, registri, direktif, normalisasi |
  | `plugin-sdk/realtime-transcription` | Helper transkripsi realtime | Jenis penyedia, helper registri, dan helper sesi WebSocket bersama |
  | `plugin-sdk/realtime-voice` | Helper suara realtime | Jenis penyedia, helper registri/resolusi, helper sesi bridge, antrean bicara-balik agen bersama, kesehatan transkrip/peristiwa, penekanan gema, dan helper konsultasi konteks cepat |
  | `plugin-sdk/image-generation` | Helper pembuatan gambar | Jenis penyedia pembuatan gambar plus helper aset gambar/URL data dan builder penyedia gambar kompatibel OpenAI |
  | `plugin-sdk/image-generation-core` | Inti pembuatan gambar bersama | Jenis pembuatan gambar, failover, autentikasi, dan helper registri |
  | `plugin-sdk/music-generation` | Helper pembuatan musik | Jenis penyedia/permintaan/hasil pembuatan musik |
  | `plugin-sdk/music-generation-core` | Inti pembuatan musik bersama | Jenis pembuatan musik, helper failover, pencarian penyedia, dan penguraian ref model |
  | `plugin-sdk/video-generation` | Helper pembuatan video | Jenis penyedia/permintaan/hasil pembuatan video |
  | `plugin-sdk/video-generation-core` | Inti pembuatan video bersama | Jenis pembuatan video, helper failover, pencarian penyedia, dan penguraian ref model |
  | `plugin-sdk/interactive-runtime` | Helper balasan interaktif | Normalisasi/reduksi payload balasan interaktif |
  | `plugin-sdk/channel-config-primitives` | Primitif konfigurasi channel | Primitif skema konfigurasi channel yang sempit |
  | `plugin-sdk/channel-config-writes` | Helper penulisan konfigurasi channel | Helper otorisasi penulisan konfigurasi channel |
  | `plugin-sdk/channel-plugin-common` | Prelude channel bersama | Ekspor prelude Plugin channel bersama |
  | `plugin-sdk/channel-status` | Helper status channel | Helper snapshot/ringkasan status channel bersama |
  | `plugin-sdk/allowlist-config-edit` | Helper konfigurasi allowlist | Helper edit/baca konfigurasi allowlist |
  | `plugin-sdk/group-access` | Helper akses grup | Helper keputusan akses grup bersama |
  | `plugin-sdk/direct-dm` | Helper DM langsung | Helper autentikasi/penjaga DM langsung bersama |
  | `plugin-sdk/extension-shared` | Helper ekstensi bersama | Primitif helper channel/status pasif dan proxy ambien |
  | `plugin-sdk/webhook-targets` | Helper target Webhook | Registri target Webhook dan helper pemasangan rute |
  | `plugin-sdk/webhook-path` | Helper jalur Webhook | Helper normalisasi jalur Webhook |
  | `plugin-sdk/web-media` | Helper media web bersama | Helper pemuatan media jarak jauh/lokal |
  | `plugin-sdk/zod` | Ekspor ulang Zod | `zod` yang diekspor ulang untuk konsumen SDK Plugin |
  | `plugin-sdk/memory-core` | Helper memory-core bawaan | Permukaan helper manajer/konfigurasi/berkas/CLI memori |
  | `plugin-sdk/memory-core-engine-runtime` | Fasad runtime mesin memori | Fasad runtime indeks/pencarian memori |
  | `plugin-sdk/memory-core-host-engine-foundation` | Mesin fondasi host memori | Ekspor mesin fondasi host memori |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Mesin embedding host memori | Kontrak embedding memori, akses registri, penyedia lokal, dan helper batch/jarak jauh generik; penyedia jarak jauh konkret berada di Plugin pemiliknya |
  | `plugin-sdk/memory-core-host-engine-qmd` | Mesin QMD host memori | Ekspor mesin QMD host memori |
  | `plugin-sdk/memory-core-host-engine-storage` | Mesin penyimpanan host memori | Ekspor mesin penyimpanan host memori |
  | `plugin-sdk/memory-core-host-multimodal` | Helper multimodal host memori | Helper multimodal host memori |
  | `plugin-sdk/memory-core-host-query` | Helper kueri host memori | Helper kueri host memori |
  | `plugin-sdk/memory-core-host-secret` | Helper rahasia host memori | Helper rahasia host memori |
  | `plugin-sdk/memory-core-host-events` | Helper jurnal peristiwa host memori | Helper jurnal peristiwa host memori |
  | `plugin-sdk/memory-core-host-status` | Helper status host memori | Helper status host memori |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI host memori | Helper runtime CLI host memori |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime inti host memori | Helper runtime inti host memori |
  | `plugin-sdk/memory-core-host-runtime-files` | Helper berkas/runtime host memori | Helper berkas/runtime host memori |
  | `plugin-sdk/memory-host-core` | Alias runtime inti host memori | Alias netral vendor untuk helper runtime inti host memori |
  | `plugin-sdk/memory-host-events` | Alias jurnal peristiwa host memori | Alias netral vendor untuk helper jurnal peristiwa host memori |
  | `plugin-sdk/memory-host-files` | Alias berkas/runtime host memori | Alias netral vendor untuk helper berkas/runtime host memori |
  | `plugin-sdk/memory-host-markdown` | Helper markdown terkelola | Helper markdown terkelola bersama untuk Plugin yang berdekatan dengan memori |
  | `plugin-sdk/memory-host-search` | Fasad pencarian memori aktif | Fasad runtime manajer pencarian memori aktif yang malas |
  | `plugin-sdk/memory-host-status` | Alias status host memori | Alias netral vendor untuk helper status host memori |
  | `plugin-sdk/testing` | Utilitas pengujian | Barrel kompatibilitas luas warisan; utamakan subjalur pengujian yang terfokus seperti `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`, dan `plugin-sdk/test-fixtures` |
</Accordion>

Tabel ini sengaja merupakan subset migrasi umum, bukan seluruh permukaan SDK. Daftar lengkap 200+ titik masuk berada di `scripts/lib/plugin-sdk-entrypoints.json`.

Seam pembantu bundled-plugin yang dicadangkan telah dipensiunkan dari peta ekspor SDK publik kecuali facade kompatibilitas yang didokumentasikan secara eksplisit seperti shim `plugin-sdk/discord` yang tidak digunakan lagi tetapi dipertahankan untuk paket `@openclaw/discord@2026.3.13` yang telah dipublikasikan. Pembantu khusus pemilik berada di dalam paket plugin pemiliknya; perilaku host bersama harus bergerak melalui kontrak SDK generik seperti `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, dan `plugin-sdk/plugin-config-runtime`.

Gunakan impor paling sempit yang sesuai dengan pekerjaan. Jika Anda tidak dapat menemukan ekspor, periksa sumber di `src/plugin-sdk/` atau tanyakan kepada maintainer kontrak generik mana yang seharusnya memilikinya.

## Penghentian aktif

Penghentian yang lebih sempit yang berlaku di seluruh SDK plugin, kontrak penyedia, permukaan runtime, dan manifest. Masing-masing masih berfungsi saat ini tetapi akan dihapus dalam rilis mayor mendatang. Entri di bawah setiap item memetakan API lama ke pengganti kanonisnya.

<AccordionGroup>
  <Accordion title="pembuat bantuan command-auth → command-status">
    **Lama (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Baru (`openclaw/plugin-sdk/command-status`)**: tanda tangan sama, ekspor
    sama - hanya diimpor dari subpath yang lebih sempit. `command-auth`
    mengekspornya kembali sebagai stub kompatibilitas.

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

    Plugin saluran hilir (Slack, Discord, Matrix, MS Teams) sudah beralih.

  </Accordion>

  <Accordion title="Shim runtime saluran dan pembantu tindakan saluran">
    `openclaw/plugin-sdk/channel-runtime` adalah shim kompatibilitas untuk plugin
    saluran lama. Jangan impor dari kode baru; gunakan
    `openclaw/plugin-sdk/channel-runtime-context` untuk mendaftarkan objek
    runtime.

    Pembantu `channelActions*` di `openclaw/plugin-sdk/channel-actions` tidak
    digunakan lagi bersama ekspor saluran "actions" mentah. Ekspos kapabilitas
    melalui permukaan semantik `presentation` sebagai gantinya - plugin saluran
    mendeklarasikan apa yang mereka render (kartu, tombol, pilihan), bukan nama
    tindakan mentah mana yang mereka terima.

  </Accordion>

  <Accordion title="Pembantu tool() penyedia pencarian web → createTool() pada plugin">
    **Lama**: factory `tool()` dari `openclaw/plugin-sdk/provider-web-search`.

    **Baru**: implementasikan `createTool(...)` langsung pada plugin penyedia.
    OpenClaw tidak lagi membutuhkan pembantu SDK untuk mendaftarkan wrapper tool.

  </Accordion>

  <Accordion title="Envelope saluran plaintext → BodyForAgent">
    **Lama**: `formatInboundEnvelope(...)` (dan
    `ChannelMessageForAgent.channelEnvelope`) untuk membangun envelope prompt
    plaintext datar dari pesan saluran masuk.

    **Baru**: `BodyForAgent` plus blok konteks pengguna terstruktur. Plugin
    saluran melampirkan metadata routing (thread, topik, balas-ke, reaksi)
    sebagai field bertipe, bukan menggabungkannya ke dalam string prompt.
    Pembantu `formatAgentEnvelope(...)` masih didukung untuk envelope sintetis
    yang ditujukan ke asisten, tetapi envelope plaintext masuk sedang menuju
    penghentian.

    Area terdampak: `inbound_claim`, `message_received`, dan plugin saluran
    kustom apa pun yang memproses lanjut teks `channelEnvelope`.

  </Accordion>

  <Accordion title="Tipe penemuan penyedia → tipe katalog penyedia">
    Empat alias tipe penemuan sekarang menjadi wrapper tipis di atas tipe era
    katalog:

    | Alias lama                 | Tipe baru                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Ditambah kantong statis `ProviderCapabilities` lama - plugin penyedia
    sebaiknya menggunakan hook penyedia eksplisit seperti `buildReplayPolicy`,
    `normalizeToolSchemas`, dan `wrapStreamFn`, bukan objek statis.

  </Accordion>

  <Accordion title="Hook kebijakan berpikir → resolveThinkingProfile">
    **Lama** (tiga hook terpisah pada `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, dan
    `resolveDefaultThinkingLevel(ctx)`.

    **Baru**: satu `resolveThinkingProfile(ctx)` yang mengembalikan
    `ProviderThinkingProfile` dengan `id` kanonis, `label` opsional, dan
    daftar level berperingkat. OpenClaw menurunkan nilai tersimpan yang usang
    berdasarkan peringkat profil secara otomatis.

    Implementasikan satu hook, bukan tiga. Hook lama tetap berfungsi selama
    jendela penghentian tetapi tidak dikomposisikan dengan hasil profil.

  </Accordion>

  <Accordion title="Fallback penyedia OAuth eksternal → contracts.externalAuthProviders">
    **Lama**: mengimplementasikan `resolveExternalOAuthProfiles(...)` tanpa
    mendeklarasikan penyedia dalam manifest plugin.

    **Baru**: deklarasikan `contracts.externalAuthProviders` dalam manifest
    plugin **dan** implementasikan `resolveExternalAuthProfiles(...)`. Jalur
    "fallback auth" lama memancarkan peringatan saat runtime dan akan dihapus.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Lookup env-var penyedia → setup.providers[].envVars">
    Field manifest **lama**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Baru**: cerminkan lookup env-var yang sama ke `setup.providers[].envVars`
    pada manifest. Ini mengonsolidasikan metadata env setup/status di satu
    tempat dan menghindari boot runtime plugin hanya untuk menjawab lookup
    env-var.

    `providerAuthEnvVars` tetap didukung melalui adaptor kompatibilitas
    sampai jendela penghentian ditutup.

  </Accordion>

  <Accordion title="Pendaftaran plugin memori → registerMemoryCapability">
    **Lama**: tiga panggilan terpisah -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Baru**: satu panggilan pada API memory-state -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Slot sama, satu panggilan pendaftaran. Pembantu memori aditif
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) tidak terdampak.

  </Accordion>

  <Accordion title="Tipe pesan sesi subagent diganti nama">
    Dua alias tipe lama masih diekspor dari `src/plugins/runtime/types.ts`:

    | Lama                           | Baru                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Metode runtime `readSession` tidak digunakan lagi dan digantikan oleh
    `getSessionMessages`. Tanda tangan sama; metode lama meneruskan panggilan
    ke yang baru.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Lama**: `runtime.tasks.flow` (tunggal) mengembalikan pengakses task-flow
    langsung.

    **Baru**: `runtime.tasks.managedFlows` mempertahankan runtime mutasi
    TaskFlow terkelola untuk plugin yang membuat, memperbarui, membatalkan,
    atau menjalankan tugas anak dari sebuah flow. Gunakan `runtime.tasks.flows`
    saat plugin hanya membutuhkan pembacaan berbasis DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Factory ekstensi tertanam → middleware hasil-tool agen">
    Dicakup dalam "Cara bermigrasi → Migrasikan ekstensi hasil-tool Pi ke
    middleware" di atas. Disertakan di sini demi kelengkapan: jalur khusus Pi
    yang telah dihapus `api.registerEmbeddedExtensionFactory(...)` digantikan
    oleh `api.registerAgentToolResultMiddleware(...)` dengan daftar runtime
    eksplisit di `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` yang diekspor ulang dari `openclaw/plugin-sdk` sekarang
    menjadi alias satu baris untuk `OpenClawConfig`. Lebih baik gunakan nama
    kanonisnya.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Penghentian tingkat ekstensi (di dalam plugin saluran/penyedia bawaan di bawah
`extensions/`) dilacak di dalam barrel `api.ts` dan `runtime-api.ts` mereka
sendiri. Penghentian tersebut tidak memengaruhi kontrak plugin pihak ketiga dan
tidak dicantumkan di sini. Jika Anda mengonsumsi barrel lokal plugin bawaan
secara langsung, baca komentar penghentian di barrel tersebut sebelum
meningkatkan versi.
</Note>

## Linimasa penghapusan

| Kapan                   | Apa yang terjadi                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **Sekarang**                | Permukaan yang tidak digunakan lagi memancarkan peringatan runtime                               |
| **Rilis mayor berikutnya** | Permukaan yang tidak digunakan lagi akan dihapus; plugin yang masih menggunakannya akan gagal |

Semua plugin inti sudah dimigrasikan. Plugin eksternal sebaiknya bermigrasi
sebelum rilis mayor berikutnya.

## Menekan peringatan untuk sementara

Tetapkan variabel lingkungan ini saat Anda mengerjakan migrasi:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Ini adalah jalan keluar sementara, bukan solusi permanen.

## Terkait

- [Mulai Cepat](/id/plugins/building-plugins) - bangun plugin pertama Anda
- [Ringkasan SDK](/id/plugins/sdk-overview) - referensi impor subpath lengkap
- [Plugin Saluran](/id/plugins/sdk-channel-plugins) - membangun plugin saluran
- [Plugin Penyedia](/id/plugins/sdk-provider-plugins) - membangun plugin penyedia
- [Internal Plugin](/id/plugins/architecture) - pendalaman arsitektur
- [Manifest Plugin](/id/plugins/manifest) - referensi skema manifest
