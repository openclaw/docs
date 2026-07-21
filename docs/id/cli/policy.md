---
read_when:
    - Anda ingin memeriksa pengaturan OpenClaw berdasarkan policy.jsonc yang telah dibuat
    - Anda menginginkan temuan kebijakan dalam lint doctor
    - Anda memerlukan hash pengesahan kebijakan untuk bukti audit
summary: Referensi CLI untuk pemeriksaan kepatuhan `openclaw policy`
title: Kebijakan
x-i18n:
    generated_at: "2026-07-21T12:49:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: abb9ad87dceaa2004817db6a8c270e66ce1c3848a1680d2119ad95faa5453cc0
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` disediakan oleh Plugin Policy bawaan. Ini merupakan lapisan
kesesuaian perusahaan di atas pengaturan OpenClaw yang sudah ada, bukan sistem
konfigurasi kedua. Anda menulis persyaratan di `policy.jsonc`; OpenClaw mengamati
ruang kerja aktif sebagai bukti; Policy melaporkan penyimpangan melalui `doctor --lint`.
Policy tidak memberlakukan panggilan alat atau menulis ulang perilaku runtime pada
saat permintaan, dan tidak mengesahkan penyimpanan kredensial per agen seperti
`auth-profiles.json`.

Policy memeriksa saluran yang dikonfigurasi, server MCP, penyedia model, postur
SSRF jaringan, akses ingress/saluran, eksposur Gateway dan postur perintah node,
probe perutean pesan yang ditulis,
akses ruang kerja agen, postur sandbox, postur penanganan data, postur penyedia
rahasia/profil autentikasi, dan metadata alat yang diatur (`TOOLS.md`).
Gunakan ini ketika ruang kerja memerlukan pernyataan yang tahan lama dan dapat
diperiksa seperti "Telegram tidak boleh diaktifkan" atau "alat yang diatur harus
mendeklarasikan metadata risiko dan pemilik." Jika Anda hanya memerlukan perilaku
lokal tanpa pengesahan atau deteksi penyimpangan, konfigurasi biasa sudah cukup.

## Mulai cepat

```bash
openclaw plugins enable policy
```

Plugin tetap aktif meskipun `policy.jsonc` tidak ada, sehingga doctor dapat
melaporkan artefak yang hilang alih-alih melewati pemeriksaan secara diam-diam.

Tulis `policy.jsonc` secara manual; ini tidak dihasilkan dari pengaturan saat
ini. Setiap bagian tingkat atas merupakan namespace aturan: pemeriksaan hanya
berjalan ketika ada aturan konkret di bawahnya (bagian atau kunci yang tidak
didukung gagal sebagai `policy/policy-jsonc-invalid` alih-alih diabaikan secara diam-diam).
Contoh minimal yang mencakup setiap bagian yang didukung:

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "Telegram tidak disetujui untuk ruang kerja ini.",
      },
    ],
  },
  "mcp": {
    "servers": {
      "allow": ["docs"],
      "deny": ["untrusted"],
    },
  },
  "models": {
    "providers": {
      "allow": ["openai", "anthropic"],
      "deny": ["openrouter"],
    },
  },
  "network": {
    "privateNetwork": {
      "allow": false,
    },
  },
  "routing": {
    "requireBindings": true,
    "requireConfiguredChannels": true,
    "probes": [
      {
        "id": "family-dm",
        "route": {
          "channel": "imessage",
          "peer": { "kind": "direct", "id": "+15555550123" },
        },
        "expect": {
          "agentId": "family",
          "matchedBy": ["binding.peer"],
        },
      },
    ],
  },
  "ingress": {
    "session": {
      "requireDmScope": "per-channel-peer",
    },
    "channels": {
      "allowDmPolicies": ["pairing", "allowlist", "disabled"],
      "denyOpenGroups": true,
      "requireMentionInGroups": true,
    },
  },
  "gateway": {
    "exposure": {
      "allowNonLoopbackBind": false,
      "allowTailscaleFunnel": false,
    },
    "auth": {
      "requireAuth": true,
      "requireExplicitRateLimit": true,
    },
    "controlUi": {
      "allowInsecure": false,
    },
    "remote": {
      "allow": false,
    },
    "http": {
      "denyEndpoints": ["chatCompletions", "responses"],
      "requireUrlAllowlists": true,
    },
    "nodes": {
      "denyCommands": ["system.run"],
    },
  },
  "agents": {
    "workspace": {
      "allowedAccess": ["none", "ro"],
      "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
    },
  },
  "dataHandling": {
    "sensitiveLogging": {
      "requireRedaction": true,
    },
    "telemetry": {
      "denyContentCapture": true,
    },
    "retention": {
      "requireSessionMaintenance": true,
    },
    "memory": {
      "denySessionTranscriptIndexing": true,
    },
  },
  "secrets": {
    "requireManagedProviders": true,
    "denySources": ["exec"],
    "allowInsecureProviders": false,
  },
  "auth": {
    "profiles": {
      "requireMetadata": ["provider", "mode"],
      "allowModes": ["api_key", "token"],
    },
  },
  "execApprovals": {
    "requireFile": true,
    "defaults": { "allowSecurity": ["deny"] },
    "agents": {
      "allowSecurity": ["deny", "allowlist"],
      "allowAutoAllowSkills": false,
      "allowlist": { "expected": ["deploy", "status"] },
    },
  },
  "tools": {
    "requireMetadata": ["risk", "sensitivity", "owner"],
    "profiles": {
      "allow": ["messaging", "minimal"],
    },
    "fs": {
      "requireWorkspaceOnly": true,
    },
    "exec": {
      "allowSecurity": ["deny", "allowlist"],
      "requireAsk": ["always"],
      "allowHosts": ["sandbox"],
    },
    "elevated": {
      "allow": false,
    },
    "denyTools": ["group:runtime", "group:fs"],
  },
}
```

Catatan lintas bagian yang tidak terlihat jelas dari tabel aturan di bawah:

- Menghilangkan `gateway.bind` saat melarang pengikatan non-loopback berarti Anda
  menerima nilai default runtime; tetapkan `gateway.bind: "loopback"` untuk kesesuaian ketat.
- Untuk agen hanya-baca, tetapkan `mode` sandbox ke `all` atau
  `non-main` pada default/agen yang berlaku dan `workspaceAccess` ke
  `none` atau `ro`. Mode sandbox yang tidak ada atau
  `off` tidak memenuhi kebijakan hanya-baca.
- `agents.workspace.denyTools` menerima `exec`, `process`,
  `write`, `edit`, `apply_patch`. Grup penolakan alat
  konfigurasi `group:fs` (mutasi file) dan `group:runtime` (shell/proses)
  memenuhi postur yang setara.
- Pemeriksaan persetujuan eksekusi membaca artefak `exec-approvals.json` aktif hanya
  ketika ada aturan `execApprovals`; artefak yang hilang atau tidak valid
  merupakan bukti yang tidak dapat diamati, bukan kelulusan sintetis.
- Bukti rahasia dan profil autentikasi hanya mencatat postur penyedia/sumber dan
  metadata SecretRef, tidak pernah nilai mentah. Policy tidak membaca atau mengesahkan
  penyimpanan kredensial per agen seperti `auth-profiles.json`.
- Bukti penanganan data hanya berupa postur tingkat konfigurasi (mode redaksi,
  tombol pengambilan telemetri, mode pemeliharaan sesi, pengaturan pengindeksan
  transkrip). Ini tidak memeriksa log, ekspor telemetri, transkrip, atau file
  memori, dan hasil bersih tidak membuktikan bahwa tidak ada data pribadi atau
  rahasia di dalamnya.
- Probe perutean menggunakan kembali resolver pengikatan runtime OpenClaw. Bukti
  perutean hanya mencatat id probe, agen yang diresolusi, jenis kecocokan, dan metadata
  pengikatan yang disunting. Bukti ini tidak pernah mencatat pengidentifikasi rekan,
  akun, guild, tim, atau peran. Menambahkan bagian perutean secara sengaja mengubah
  hash kebijakan dan pengesahan; kebijakan tanpa perutean mempertahankan bentuk
  bukti yang ada.

### Referensi aturan Policy

Setiap aturan di bawah bersifat opsional; pemeriksaan hanya berjalan ketika
aturan tersebut ada. Status yang diamati adalah konfigurasi OpenClaw atau
metadata ruang kerja yang sudah ada.

#### Overlay tercakup

Gunakan `scopes.<scopeName>` ketika agen atau saluran tertentu memerlukan kebijakan
yang lebih ketat daripada garis dasar tingkat atas. Nama cakupan hanyalah label;
pencocokan menggunakan selektor di dalam cakupan. Overlay bersifat aditif: aturan
global tetap berjalan, dan aturan tercakup dapat menambahkan temuannya sendiri
terhadap bukti yang sama.

| Selektor     | Bagian yang didukung                                                            | Gunakan ketika                                           |
| ------------ | ------------------------------------------------------------------------------ | -------------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, `execApprovals` | Satu atau beberapa agen runtime memerlukan aturan lebih ketat. |
| `channelIds` | `ingress.channels`                                                             | Satu atau beberapa saluran memerlukan aturan ingress lebih ketat. |

Jika entri `agentIds` tidak ada di `agents.list[]`, OpenClaw
mengevaluasi aturan tercakup terhadap postur global/default yang diwarisi untuk
id agen runtime tersebut alih-alih melewatinya.

```jsonc
{
  "tools": {
    "exec": {
      "allowHosts": ["sandbox", "node"],
    },
  },
  "sandbox": {
    "requireMode": ["all", "non-main"],
  },
  "scopes": {
    "release-workspace": {
      "agentIds": ["release-agent", "review-agent"],
      "agents": {
        "workspace": {
          "allowedAccess": ["none", "ro"],
        },
      },
    },
    "release-lockdown": {
      "agentIds": ["release-agent"],
      "tools": {
        "exec": {
          "allowHosts": ["sandbox"],
          "allowSecurity": ["deny", "allowlist"],
          "requireAsk": ["always"],
        },
        "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
      },
      "sandbox": {
        "requireMode": ["all"],
        "allowBackends": ["docker"],
      },
      "dataHandling": {
        "memory": {
          "denySessionTranscriptIndexing": true,
        },
      },
    },
    "shell-sandbox": {
      "agentIds": ["shell-agent"],
      "sandbox": {
        "allowBackends": ["openshell"],
        "containers": {
          "requireReadOnlyMounts": false,
        },
      },
    },
    "telegram-ingress": {
      "channelIds": ["telegram"],
      "ingress": {
        "channels": {
          "allowDmPolicies": ["pairing"],
          "denyOpenGroups": true,
          "requireMentionInGroups": true,
        },
      },
    },
  },
}
```

Agen yang sama dapat muncul dalam beberapa cakupan jika setiap cakupan mengatur
bidang yang berbeda, seperti di atas. Bidang tercakup yang berulang untuk agen
yang sama harus sama ketatnya atau lebih ketat; klaim duplikat yang lebih lemah
ditolak (daftar izin merupakan subset, daftar penolakan merupakan superset,
boolean yang diwajibkan bersifat tetap).

Aturan postur kontainer (`sandbox.containers.*`) hanya diperiksa terhadap bukti
yang dapat diekspos oleh backend sandbox agen yang cocok. Jika backend tidak
dapat mengamati aturan yang Anda aktifkan untuknya, Policy melaporkan
`policy/sandbox-container-posture-unobservable` alih-alih meluluskannya; cakupkan aturan kontainer ke grup
agen yang menggunakan backend yang dapat mengeksposnya.

`ingress.session.requireDmScope` tingkat atas tetap global; `session.dmScope` bukan bukti
yang dapat diatribusikan ke saluran, sehingga tidak dapat dicakup oleh
`channelIds`.

Setiap cakupan yang ada di `policy.jsonc` harus valid dan dapat diberlakukan.

#### Saluran

| Bidang kebijakan                      | Status yang diamati                      | Gunakan ketika                                                        |
| ------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| `channels.denyRules[].when.provider` | Penyedia `channels.*` dan status aktif | Menolak saluran yang dikonfigurasi dari penyedia seperti `telegram`. |
| `channels.denyRules[].reason`        | Pesan temuan dan konteks petunjuk perbaikan | Menjelaskan alasan penyedia ditolak.                                  |

#### Server MCP

| Bidang kebijakan    | Status yang diamati    | Gunakan ketika                                                        |
| ------------------- | ---------------------- | --------------------------------------------------------------------- |
| `mcp.servers.allow` | Id `mcp.servers.*` | Mewajibkan setiap server MCP yang dikonfigurasi berada dalam daftar izin. |
| `mcp.servers.deny`  | Id `mcp.servers.*` | Menolak id server MCP tertentu yang dikonfigurasi.                     |

#### Penyedia model

| Bidang kebijakan          | Status yang diamati                                      | Gunakan ketika                                                                         |
| ------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `models.providers.allow` | Id `models.providers.*` dan referensi model yang dipilih | Mewajibkan penyedia yang dikonfigurasi dan referensi model yang dipilih menggunakan penyedia yang disetujui. |
| `models.providers.deny`  | Id `models.providers.*` dan referensi model yang dipilih | Menolak penyedia yang dikonfigurasi dan referensi model yang dipilih berdasarkan id penyedia. |

#### Jaringan

| Bidang kebijakan                   | Status yang diamati                      | Gunakan saat                                                           |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | Jalur keluar SSRF jaringan privat | Atur ke `false` untuk mewajibkan akses jaringan privat tetap dinonaktifkan. |

#### Perutean pesan

| Bidang kebijakan                        | Status yang diamati                                      | Gunakan saat                                                               |
| ----------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------- |
| `routing.requireBindings`           | Pengikatan rute saluran, tidak termasuk pengikatan ACP      | Wajibkan setidaknya satu pengikatan perutean pesan.                          |
| `routing.requireConfiguredChannels` | ID saluran pengikatan dan ID `channels.*` yang dikonfigurasi | Deteksi ID saluran pengikatan yang usang atau salah eja.                        |
| `routing.probes[].route`            | Resolver rute publik OpenClaw                  | Deskripsikan rute masuk yang representatif tanpa mengirim pesan.     |
| `routing.probes[].expect.agentId`   | ID agen yang di-resolve                                   | Wajibkan rute mencapai agen yang telah ditinjau.                         |
| `routing.probes[].expect.matchedBy` | Jenis kecocokan resolver                                 | Wajibkan kekhususan pengikatan peer, akun, saluran, atau pengikatan lain yang telah ditinjau. |

ID probe harus unik. Sebuah rute mendukung `channel`, `accountId` opsional,
`peer`, `parentPeer`, `guildId`, `teamId`, dan `memberRoleIds`. Jenis peer adalah
`direct`, `group`, dan `channel`. `matchedBy` dapat berisi satu atau beberapa jenis
kecocokan runtime, termasuk `binding.peer`, `binding.account`, `binding.channel`,
atau `default`.

Pemeriksaan perutean hanya merupakan pemeriksaan kesesuaian. Pemeriksaan ini tidak mengubah startup,
pengiriman pesan, prioritas pengikatan, atau perilaku fallback. Temuan memerlukan
peninjauan operator karena perubahan pengikatan secara otomatis dapat mengalihkan
pesan privat.

#### Akses masuk dan saluran

| Bidang kebijakan                              | Status yang diamati                                                 | Gunakan saat                                                           |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | Wajibkan cakupan isolasi pesan langsung yang telah ditinjau.                 |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` dan bidang kebijakan DM saluran lama      | Izinkan hanya kebijakan saluran pesan langsung yang telah ditinjau.               |
| `ingress.channels.denyOpenGroups`         | Kebijakan akses masuk saluran, akun, dan grup                     | Tolak akses masuk grup terbuka untuk saluran dan akun yang dikonfigurasi.      |
| `ingress.channels.requireMentionInGroups` | Konfigurasi gerbang mention saluran, akun, grup, guild, dan bertingkat | Wajibkan gerbang mention ketika akses masuk grup terbuka atau dibatasi mention. |

#### Gateway

| Bidang kebijakan                            | Status yang diamati                                 | Gunakan saat                                                                             |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | Atur ke `false` untuk mewajibkan pengikatan Gateway loopback.                                  |
| `gateway.exposure.allowTailscaleFunnel` | Postur serve/funnel Gateway Tailscale         | Atur ke `false` untuk menolak eksposur Tailscale Funnel.                                    |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | Atur ke `true` untuk menolak autentikasi Gateway yang dinonaktifkan.                                       |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | Atur ke `true` untuk mewajibkan konfigurasi pembatasan laju autentikasi yang eksplisit.                            |
| `gateway.controlUi.allowInsecure`       | Tombol aktif/nonaktif autentikasi/perangkat/origin Control UI yang tidak aman | Atur ke `false` untuk menolak tombol aktif/nonaktif eksposur Control UI yang tidak aman.                         |
| `gateway.remote.allow`                  | Mode/konfigurasi Gateway jarak jauh                     | Atur ke `false` untuk menolak mode Gateway jarak jauh.                                          |
| `gateway.http.denyEndpoints`            | Endpoint API HTTP Gateway                     | Tolak ID endpoint seperti `chatCompletions` atau `responses`.                          |
| `gateway.http.requireUrlAllowlists`     | Input pengambilan URL HTTP Gateway                  | Atur ke `true` untuk mewajibkan daftar izin URL pada input pengambilan URL.                         |
| `gateway.nodes.denyCommands`            | `gateway.nodes.denyCommands`                   | Wajibkan ID perintah node yang persis seperti `system.run` ditolak dalam konfigurasi OpenClaw. |

`gateway.nodes.denyCommands` adalah aturan superset penolakan yang persis dan peka huruf besar-kecil.
Gunakan saat kebijakan harus membuktikan bahwa perintah node berhak istimewa secara eksplisit
ditolak oleh konfigurasi OpenClaw. Deployment yang sengaja mengizinkan perintah
node berhak istimewa harus memperbarui `policy.jsonc` setelah peninjauan, alih-alih hanya
mengandalkan `gateway.nodes.allowCommands`.

#### Ruang kerja agen

| Bidang kebijakan                     | Status yang diamati                                                                        | Gunakan saat                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` dan `agents.list[].sandbox.workspaceAccess` | Izinkan hanya nilai akses ruang kerja sandbox seperti `none` atau `ro`.                       |
| `agents.workspace.denyTools`     | Konfigurasi penolakan alat global dan per agen                                                 | Wajibkan alat mutasi (`exec`, `process`, `write`, `edit`, `apply_patch`) ditolak. |

#### Postur sandbox

| Bidang kebijakan                                          | Status yang diamati                                          | Gunakan saat                                                       |
| ----------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` dan mode per agen       | Izinkan hanya mode sandbox yang telah ditinjau seperti `all` atau `non-main`. |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` dan backend per agen | Izinkan hanya backend sandbox yang telah ditinjau seperti `docker`.         |
| `sandbox.containers.denyHostNetwork`                  | Mode jaringan sandbox/peramban berbasis kontainer           | Tolak mode jaringan host.                                        |
| `sandbox.containers.denyContainerNamespaceJoin`       | Mode jaringan sandbox/peramban berbasis kontainer           | Tolak bergabung dengan namespace jaringan kontainer lain.              |
| `sandbox.containers.requireReadOnlyMounts`            | Mode mount sandbox/peramban berbasis kontainer             | Wajibkan mount bersifat hanya-baca.                                |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | Target mount sandbox/peramban berbasis kontainer          | Tolak mount soket runtime kontainer.                          |
| `sandbox.containers.denyUnconfinedProfiles`           | Postur profil keamanan kontainer                      | Tolak profil keamanan kontainer tanpa pembatasan.                   |
| `sandbox.browser.requireCdpSourceRange`               | Rentang sumber CDP peramban sandbox                        | Wajibkan eksposur CDP peramban mendeklarasikan rentang sumber.        |

Kebijakan memperlakukan `sandbox.mode` yang tidak ada sebagai nilai default implisitnya, `off`, sehingga
`sandbox.requireMode` melaporkan sandbox baru atau belum dikonfigurasi sebagai berada di luar
daftar izin seperti `["all"]`.

#### Penanganan data

| Bidang kebijakan                                        | Status yang diamati                                                                       | Gunakan saat                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | Atur ke `true` untuk menolak `logging.redactSensitive: "off"`.              |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | Atur ke `true` untuk menolak perekaman konten telemetri.                     |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | Atur ke `true` untuk mewajibkan mode pemeliharaan sesi efektif `enforce`. |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` dan `agents.*.memorySearch.experimental.sessionMemory` | Atur ke `true` untuk menolak pengindeksan transkrip sesi ke dalam memori.       |

#### Rahasia

| Bidang kebijakan                      | Status yang diamati                                           | Gunakan saat                                                                |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | SecretRef konfigurasi dan deklarasi `secrets.providers.*` | Atur ke `true` untuk mewajibkan SecretRef mengarah ke penyedia yang dideklarasikan.     |
| `secrets.denySources`             | Sumber penyedia rahasia dan sumber SecretRef            | Tolak sumber seperti `exec`, `file`, atau nama sumber lain yang dikonfigurasi. |
| `secrets.allowInsecureProviders`  | Flag postur penyedia rahasia yang tidak aman                   | Atur ke `false` untuk menolak penyedia yang memilih postur tidak aman.      |

#### Persetujuan eksekusi

Pemeriksaan persetujuan eksekusi membaca artefak runtime `exec-approvals.json`:
`~/.openclaw/exec-approvals.json` secara default, atau
`$OPENCLAW_STATE_DIR/exec-approvals.json` ketika `OPENCLAW_STATE_DIR` ditetapkan.
Aturan postur di bawah `execApprovals.defaults.*` atau `execApprovals.agents.*`
mewajibkan bukti artefak yang dapat dibaca; artefak yang tidak ada atau tidak valid dilaporkan sebagai
bukti yang tidak dapat diamati, bukan kelulusan berdasarkan upaya terbaik. Setelah dapat dibaca, bidang yang
dihilangkan mewarisi default runtime: `defaults.security` yang tidak ada adalah `full`, dan
keamanan agen yang tidak ada mewarisi default tersebut. Bukti mencakup `defaults`,
`agents.*`, `agents.*.allowlist[].pattern`, `argPattern` opsional, postur efektif
`autoAllowSkills`, dan sumber entri — tidak pernah berupa jalur/token soket,
`commandText`, `lastUsedCommand`, jalur yang di-resolve, atau stempel waktu.

| Bidang kebijakan                           | Status yang diamati                                                                      | Gunakan ketika                                                                           |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | Jalur `exec-approvals.json` runtime aktif                                              | Atur ke `true` untuk mewajibkan artefak persetujuan tersedia dan dapat diurai.                     |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`, dengan nilai bawaan `full`                                              | Izinkan hanya mode keamanan persetujuan bawaan yang disetujui.                                    |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`, yang mewarisi nilai bawaan                                               | Izinkan hanya mode keamanan persetujuan efektif per agen yang disetujui.                        |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` dan `agents.*.autoAllowSkills`, yang mewarisi nilai bawaan runtime | Atur ke `false` untuk mewajibkan daftar izin manual yang ketat tanpa persetujuan implisit CLI skill. |
| `execApprovals.agents.allowlist.expected`   | Pola `agents.*.allowlist[]` gabungan dan entri argPattern opsional               | Wajibkan daftar izin persetujuan agar cocok dengan kumpulan pola yang telah direview.                      |

Contoh: wajibkan artefak persetujuan, tolak nilai bawaan yang permisif, dan izinkan
hanya postur persetujuan exec yang telah direview untuk agen tertentu.

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Mode keamanan: "deny", "allowlist", atau "full".
      // Nilai bawaan ini hanya mengizinkan postur penolakan yang dikunci ketat.
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Agen yang dipilih dapat menggunakan postur daftar izin yang telah direview, tetapi bukan "full".
          "allowSecurity": ["allowlist"],
          // false berarti CLI skill harus tercantum dalam daftar izin yang telah direview, bukan
          // disetujui secara implisit oleh autoAllowSkills.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Entri sederhana: pola executable persis yang telah direview tanpa argPattern.
              "travel-hub",
              // Entri terbatas: pola beserta regex argumen yang telah direview.
              { "pattern": "calendar-cli", "argPattern": "^sync\\b" },
              "/bin/date",
            ],
          },
        },
      },
    },
  },
}
```

#### Profil autentikasi

| Bidang kebijakan                | Status yang diamati                           | Gunakan ketika                                                                               |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | Metadata penyedia dan mode `auth.profiles.*` | Wajibkan kunci metadata seperti `provider` dan `mode` pada profil autentikasi konfigurasi.               |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | Izinkan hanya mode profil autentikasi yang didukung seperti `api_key`, `aws-sdk`, `oauth`, atau `token`. |

#### Metadata alat

| Bidang kebijakan        | Status yang diamati               | Gunakan ketika                                                                               |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | Deklarasi `TOOLS.md` yang diatur | Wajibkan alat yang diatur untuk mendeklarasikan kunci metadata seperti `risk`, `sensitivity`, atau `owner`. |

#### Postur alat

| Bidang kebijakan                | Status yang diamati                                          | Gunakan ketika                                                                                             |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` dan `agents.list[].tools.profile`           | Izinkan hanya id profil alat seperti `minimal`, `messaging`, atau `coding`.                                 |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` dan penggantian `tools.fs` per agen | Atur ke `true` untuk mewajibkan postur alat sistem berkas yang terbatas hanya pada ruang kerja.                                         |
| `tools.exec.allowSecurity`      | `tools.exec.security` dan keamanan exec per agen           | Izinkan hanya mode keamanan exec seperti `deny` atau `allowlist`.                                            |
| `tools.exec.requireAsk`         | `tools.exec.ask` dan mode permintaan exec per agen                | Wajibkan postur persetujuan seperti `always`.                                                               |
| `tools.exec.allowHosts`         | `tools.exec.host` dan perutean host exec per agen           | Izinkan hanya mode perutean host exec seperti `sandbox`.                                                    |
| `tools.elevated.allow`          | `tools.elevated.enabled` dan postur elevated per agen     | Atur ke `false` untuk mewajibkan mode alat elevated tetap dinonaktifkan.                                           |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` dan `tools.alsoAllow` per agen           | Wajibkan entri `alsoAllow` yang persis dan laporkan pemberian alat tambahan yang hilang atau tidak diharapkan.                 |
| `tools.denyTools`               | `tools.deny` dan `agents.list[].tools.deny`                 | Wajibkan daftar penolakan alat yang dikonfigurasi untuk menyertakan id atau grup alat seperti `group:runtime` dan `group:fs`. |

## Jalankan pemeriksaan

Jalankan pemeriksaan khusus kebijakan selama penulisan:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` hanya menjalankan kumpulan pemeriksaan kebijakan dan menghasilkan bukti, temuan,
serta hash atestasi. Temuan yang sama juga muncul dalam
`openclaw doctor --lint` ketika Plugin Policy diaktifkan.

Bandingkan berkas kebijakan operator dengan garis dasar yang telah ditulis:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` memeriksa sintaks berkas kebijakan terhadap sintaks berkas kebijakan; perintah ini
tidak memeriksa status runtime, bukti, kredensial, atau rahasia. Perintah ini menggunakan
metadata aturan yang sama dengan yang mengatur overlay tercakup: daftar izin harus tetap sama atau
lebih sempit, daftar penolakan harus tetap sama atau lebih luas, boolean wajib harus mempertahankan
nilainya, string berurutan hanya boleh bergerak menuju ujung yang lebih ketat dari
urutan yang dikonfigurasi, dan daftar persis harus cocok. Garis dasar dapat berupa
kebijakan yang ditulis organisasi; kebijakan yang diperiksa boleh menambahkan nilai yang lebih ketat atau
aturan tambahan. Aturan tingkat teratas yang diperiksa dapat memenuhi aturan garis dasar tercakup ketika
sama ketat atau lebih ketat. Nama cakupan tidak harus cocok antarberkas;
perbandingan dikunci berdasarkan pemilih (`agentIds`/`channelIds`) dan bidang.
Untuk probe perutean, setiap id probe garis dasar harus dipertahankan dengan rute
dan agen yang diharapkan yang sama. Kebijakan yang diperiksa boleh menambahkan probe atau mempersempit `matchedBy`, tetapi
menghapus probe, mengubah rute atau agennya, atau memperluas jenis kecocokan yang diterima
merupakan kebijakan yang lebih lemah.

Perbandingan bersih (`--json`):

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

Keluaran `policy check --json` yang bersih menyertakan hash stabil yang dapat dicatat oleh operator atau
pengawas:

```json
{
  "ok": true,
  "attestation": {
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": []
}
```

## Konfigurasikan kebijakan

Konfigurasi kebijakan berada di bawah `plugins.entries.policy.config`.

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "enabled": true,
        "config": {
          "enabled": true,
          "path": "policy.jsonc",
          "workspaceRepairs": false,
          "expectedHash": "sha256:...",
          "expectedAttestationHash": "sha256:...",
        },
      },
    },
  },
}
```

| Pengaturan                | Tujuan                                                          |
| ------------------------- | --------------------------------------------------------------- |
| `enabled`                 | Aktifkan pemeriksaan kebijakan bahkan sebelum `policy.jsonc` tersedia.         |
| `workspaceRepairs`        | Izinkan `doctor --fix` mengedit pengaturan ruang kerja yang dikelola kebijakan. |
| `expectedHash`            | Penguncian hash opsional untuk artefak kebijakan yang disetujui.            |
| `expectedAttestationHash` | Penguncian hash opsional untuk pemeriksaan kebijakan bersih terakhir yang diterima.    |
| `path`                    | Lokasi artefak kebijakan yang relatif terhadap ruang kerja.             |

Atur `plugins.entries.policy.config.enabled` ke `false` untuk menonaktifkan pemeriksaan
kebijakan bagi suatu ruang kerja tanpa menghapus Plugin.

## Terima status kebijakan

Contoh keluaran JSON:

```json
{
  "ok": true,
  "attestation": {
    "checkedAt": "2026-05-10T20:00:00.000Z",
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "evidence": {
    "channels": [
      {
        "id": "telegram",
        "provider": "telegram",
        "source": "oc://openclaw.config/channels/telegram",
        "enabled": false
      }
    ],
    "mcpServers": [
      {
        "id": "docs",
        "transport": "stdio",
        "source": "oc://openclaw.config/mcp/servers/docs",
        "command": "npx"
      }
    ],
    "modelProviders": [
      {
        "id": "openai",
        "source": "oc://openclaw.config/models/providers/openai"
      }
    ],
    "modelRefs": [
      {
        "ref": "openai/gpt-5.6-sol",
        "provider": "openai",
        "model": "gpt-5.6-sol",
        "source": "oc://openclaw.config/agents/defaults/model"
      }
    ],
    "network": [
      {
        "id": "browser-private-network",
        "source": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
        "value": false
      }
    ],
    "gatewayExposure": [
      {
        "id": "gateway-bind",
        "kind": "bind",
        "source": "oc://openclaw.config/gateway/bind",
        "value": "loopback",
        "nonLoopback": false,
        "explicit": true
      }
    ],
    "agentWorkspace": [
      {
        "id": "agents-defaults-workspace-access",
        "kind": "workspaceAccess",
        "source": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
        "scope": "defaults",
        "value": "ro",
        "sandboxMode": "all",
        "sandboxModeSource": "oc://openclaw.config/agents/defaults/sandbox/mode",
        "sandboxEnabled": true,
        "explicit": true
      },
      {
        "id": "agents-defaults-tool-exec",
        "kind": "toolDeny",
        "source": "oc://openclaw.config/tools/deny",
        "scope": "defaults",
        "tool": "exec",
        "denied": true,
        "explicit": true
      }
    ],
    "secrets": [
      {
        "id": "vault",
        "kind": "provider",
        "source": "oc://openclaw.config/secrets/providers/vault",
        "providerSource": "env"
      },
      {
        "id": "oc://openclaw.config/models/providers/openai/apiKey",
        "kind": "input",
        "source": "oc://openclaw.config/models/providers/openai/apiKey",
        "provenance": "secretRef",
        "refSource": "env",
        "refProvider": "vault"
      }
    ],
    "authProfiles": [
      {
        "id": "github",
        "source": "oc://openclaw.config/auth/profiles/github",
        "validMetadata": true,
        "provider": "github",
        "mode": "token"
      }
    ],
    "tools": [
      {
        "id": "deploy",
        "source": "oc://TOOLS.md/tools/deploy",
        "line": 12,
        "risk": "critical",
        "sensitivity": "restricted",
        "capabilities": ["IRREVERSIBLE_EXTERNAL"]
      }
    ]
  },
  "checksRun": 30,
  "checksSkipped": 0,
  "findings": []
}
```

`attestation.policy.hash` mengidentifikasi artefak aturan yang dibuat. `evidence`
mencatat status OpenClaw yang diamati dan digunakan oleh pemeriksaan, serta
`workspace.hash` mengidentifikasi payload bukti tersebut. `findingsHash` mengidentifikasi
kumpulan temuan yang tepat. `checkedAt` mencatat waktu pemeriksaan dijalankan.
`attestationHash` mengidentifikasi klaim stabil (hash kebijakan, hash bukti,
hash temuan, dan status bersih/kotor) dan sengaja mengecualikan `checkedAt`,
sehingga status kebijakan yang sama selalu menghasilkan hash pengesahan yang sama. Bersama-sama,
keempat nilai ini membentuk tuple audit untuk satu pemeriksaan kebijakan.

Jika Gateway atau supervisor menggunakan kebijakan untuk memblokir, menyetujui, atau memberi anotasi pada
tindakan runtime, komponen tersebut harus mencatat hash pengesahan dari pemeriksaan bersih
terakhir. `checkedAt` tetap berada dalam output JSON untuk log audit, tetapi bukan bagian dari
hash stabil.

Siklus hidup untuk menerima status kebijakan:

1. Buat atau tinjau `policy.jsonc`.
2. Jalankan `openclaw policy check --json`.
3. Jika bersih, catat `attestation.policy.hash` sebagai `expectedHash`.
4. Catat `attestation.attestationHash` sebagai `expectedAttestationHash`.
5. Jalankan kembali `openclaw doctor --lint` dalam CI atau gerbang rilis.

Jika aturan kebijakan sengaja diubah, perbarui kedua hash yang diterima berdasarkan
pemeriksaan bersih. Jika hanya pengaturan ruang kerja yang berubah (kebijakan tetap sama),
biasanya hanya `expectedAttestationHash` yang berubah.

Mengaktifkan atau meningkatkan versi aturan `agents.workspace` menambahkan bukti `agentWorkspace`
ke hash ruang kerja dan hash pengesahan; tinjau bukti baru dan
perbarui hash pengesahan yang diterima setelah mengaktifkannya. Mengaktifkan atau meningkatkan versi
aturan postur alat menambahkan bukti `toolPosture` dengan cara yang sama.

`openclaw policy watch` menjalankan kembali pemeriksaan dan melaporkan saat bukti saat ini tidak
lagi cocok dengan `expectedAttestationHash`:

```bash
openclaw policy watch --json
```

Gunakan `--once` dalam CI atau skrip yang memerlukan satu evaluasi penyimpangan. Tanpa
`--once`, secara default pemeriksaan dilakukan setiap dua detik; gunakan `--interval-ms` untuk mengubah
interval.

## Temuan

| ID pemeriksaan                                           | Temuan                                                                            |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | Kebijakan diaktifkan, tetapi `policy.jsonc` tidak ada.                            |
| `policy/policy-jsonc-invalid`                            | Kebijakan tidak dapat diuraikan atau berisi entri aturan yang salah format.       |
| `policy/policy-hash-mismatch`                            | Kebijakan tidak cocok dengan `expectedHash` yang dikonfigurasi.                    |
| `policy/attestation-hash-mismatch`                       | Bukti kebijakan saat ini tidak lagi cocok dengan atestasi yang diterima.          |
| `policy/policy-conformance-invalid`                      | File kebijakan dasar atau yang diperiksa memiliki sintaks perbandingan yang tidak valid. |
| `policy/policy-conformance-missing`                      | File kebijakan yang diperiksa tidak memiliki aturan yang diwajibkan oleh file kebijakan dasar. |
| `policy/policy-conformance-weaker`                       | File kebijakan yang diperiksa memiliki nilai yang lebih lemah daripada file kebijakan dasar. |
| `policy/channels-denied-provider`                        | Kanal yang diaktifkan cocok dengan aturan penolakan kanal.                        |
| `policy/mcp-denied-server`                               | Server MCP yang dikonfigurasi ditolak oleh kebijakan.                             |
| `policy/mcp-unapproved-server`                           | Server MCP yang dikonfigurasi berada di luar daftar izin.                         |
| `policy/models-denied-provider`                          | Penyedia model atau referensi model yang dikonfigurasi menggunakan penyedia yang ditolak. |
| `policy/models-unapproved-provider`                      | Penyedia model atau referensi model yang dikonfigurasi berada di luar daftar izin. |
| `policy/network-private-access-enabled`                  | Jalur pintas SSRF jaringan privat diaktifkan saat kebijakan melarangnya.           |
| `policy/routing-bindings-required`                       | Kebijakan mewajibkan pengikatan rute kanal, tetapi tidak ada yang dikonfigurasi.   |
| `policy/routing-binding-channel-unconfigured`            | Pengikatan rute menyebut kanal yang tidak ada dalam `channels.*`.                 |
| `policy/routing-agent-mismatch`                          | Rute yang ditulis mengarah ke agen yang berbeda.                                  |
| `policy/routing-match-kind-mismatch`                     | Rute yang ditulis cocok pada tingkat kekhususan pengikatan yang tidak semestinya. |
| `policy/ingress-dm-policy-unapproved`                    | Kebijakan DM kanal berada di luar daftar izin kebijakan.                          |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` tidak cocok dengan cakupan isolasi DM yang diwajibkan kebijakan. |
| `policy/ingress-open-groups-denied`                      | Kebijakan grup kanal adalah `open` saat kebijakan menolak lalu lintas masuk grup terbuka. |
| `policy/ingress-group-mention-required`                  | Entri kanal atau grup menonaktifkan gerbang penyebutan saat kebijakan mewajibkannya. |
| `policy/gateway-non-loopback-bind`                       | Postur pengikatan Gateway mengizinkan paparan non-loopback saat kebijakan melarangnya. |
| `policy/gateway-auth-disabled`                           | Autentikasi Gateway dinonaktifkan saat kebijakan mewajibkan autentikasi.           |
| `policy/gateway-rate-limit-missing`                      | Postur pembatasan laju autentikasi Gateway tidak dinyatakan secara eksplisit saat kebijakan mewajibkannya. |
| `policy/gateway-control-ui-insecure`                     | Pengalih paparan tidak aman UI Kontrol Gateway diaktifkan.                         |
| `policy/gateway-tailscale-funnel`                        | Paparan Tailscale Funnel Gateway diaktifkan saat kebijakan melarangnya.            |
| `policy/gateway-remote-enabled`                          | Mode jarak jauh Gateway aktif saat kebijakan melarangnya.                          |
| `policy/gateway-http-endpoint-enabled`                   | Titik akhir API HTTP Gateway diaktifkan meskipun ditolak oleh kebijakan.           |
| `policy/gateway-http-url-fetch-unrestricted`             | Masukan pengambilan URL HTTP Gateway tidak memiliki daftar izin URL yang diwajibkan. |
| `policy/gateway-node-command-denied`                     | Perintah Node yang ditolak oleh kebijakan tidak ditolak oleh konfigurasi OpenClaw. |
| `policy/agents-workspace-access-denied`                  | Mode sandbox agen atau akses ruang kerja berada di luar daftar izin kebijakan.     |
| `policy/agents-tool-not-denied`                          | Konfigurasi agen atau bawaan tidak menolak alat yang diwajibkan oleh kebijakan.    |
| `policy/tools-profile-unapproved`                        | Profil alat global atau per agen yang dikonfigurasi berada di luar daftar izin.    |
| `policy/tools-fs-workspace-only-required`                | Alat sistem berkas tidak dikonfigurasi dengan postur jalur khusus ruang kerja.     |
| `policy/tools-exec-security-unapproved`                  | Mode keamanan eksekusi berada di luar daftar izin kebijakan.                       |
| `policy/tools-exec-ask-unapproved`                       | Mode permintaan eksekusi berada di luar daftar izin kebijakan.                     |
| `policy/tools-exec-host-unapproved`                      | Perutean host eksekusi berada di luar daftar izin kebijakan.                       |
| `policy/tools-elevated-enabled`                          | Mode alat dengan hak istimewa diaktifkan saat kebijakan melarangnya.               |
| `policy/tools-also-allow-missing`                        | Daftar `alsoAllow` yang dikonfigurasi tidak memiliki entri yang diwajibkan kebijakan. |
| `policy/tools-also-allow-unexpected`                     | Daftar `alsoAllow` yang dikonfigurasi menyertakan entri yang tidak diharapkan kebijakan. |
| `policy/tools-required-deny-missing`                     | Daftar penolakan alat global atau per agen tidak menyertakan alat yang wajib ditolak. |
| `policy/sandbox-mode-unapproved`                         | Mode sandbox berada di luar daftar izin kebijakan.                                |
| `policy/sandbox-backend-unapproved`                      | Backend sandbox berada di luar daftar izin kebijakan.                              |
| `policy/sandbox-container-posture-unobservable`          | Aturan postur kontainer diaktifkan untuk backend yang tidak dapat mengamatinya.    |
| `policy/sandbox-container-host-network-denied`           | Sandbox atau peramban berbasis kontainer menggunakan mode jaringan host.          |
| `policy/sandbox-container-namespace-join-denied`         | Sandbox atau peramban berbasis kontainer bergabung dengan namespace kontainer lain. |
| `policy/sandbox-container-mount-mode-required`           | Mount sandbox atau peramban berbasis kontainer tidak hanya-baca.                  |
| `policy/sandbox-container-runtime-socket-mount`          | Mount sandbox atau peramban berbasis kontainer mengekspos soket runtime kontainer. |
| `policy/sandbox-container-unconfined-profile`            | Profil sandbox kontainer tidak dibatasi saat kebijakan melarangnya.               |
| `policy/sandbox-browser-cdp-source-range-missing`        | Rentang sumber CDP peramban sandbox tidak ada saat kebijakan mewajibkannya.        |
| `policy/data-handling-redaction-disabled`                | Redaksi pencatatan sensitif dinonaktifkan saat kebijakan mewajibkannya.            |
| `policy/data-handling-telemetry-content-capture`         | Pengambilan konten telemetri diaktifkan saat kebijakan melarangnya.                |
| `policy/data-handling-session-retention-not-enforced`    | Pemeliharaan retensi sesi tidak diberlakukan saat kebijakan mewajibkannya.         |
| `policy/data-handling-session-transcript-memory-enabled` | Pengindeksan memori transkrip sesi diaktifkan saat kebijakan melarangnya.          |
| `policy/secrets-unmanaged-provider`                      | SecretRef konfigurasi merujuk ke penyedia yang tidak dideklarasikan di bawah `secrets.providers`. |
| `policy/secrets-denied-provider-source`                  | Penyedia rahasia konfigurasi atau SecretRef menggunakan sumber yang ditolak oleh kebijakan. |
| `policy/secrets-insecure-provider`                       | Penyedia rahasia memilih postur tidak aman saat kebijakan melarangnya.             |
| `policy/auth-profile-invalid-metadata`                   | Profil autentikasi konfigurasi tidak memiliki metadata penyedia atau mode yang valid. |
| `policy/auth-profile-unapproved-mode`                    | Mode profil autentikasi konfigurasi berada di luar daftar izin kebijakan.          |
| `policy/exec-approvals-missing`                          | Kebijakan mewajibkan `exec-approvals.json`, tetapi artefaknya tidak ada.          |
| `policy/exec-approvals-invalid`                          | Artefak persetujuan eksekusi yang dikonfigurasi tidak dapat diuraikan.             |
| `policy/exec-approvals-default-security-unapproved`      | Bawaan persetujuan eksekusi menggunakan mode keamanan di luar daftar izin kebijakan. |
| `policy/exec-approvals-agent-security-unapproved`        | Mode keamanan persetujuan eksekusi efektif per agen berada di luar daftar izin.   |
| `policy/exec-approvals-auto-allow-skills-enabled`        | Agen persetujuan eksekusi secara implisit otomatis mengizinkan CLI Skills saat kebijakan melarangnya. |
| `policy/exec-approvals-allowlist-missing`                | Daftar izin persetujuan tidak memiliki pola yang diwajibkan oleh kebijakan.        |
| `policy/exec-approvals-allowlist-unexpected`             | Daftar izin persetujuan menyertakan pola yang tidak diharapkan oleh kebijakan.     |
| `policy/tools-missing-risk-level`                        | Deklarasi alat yang diatur tidak memiliki metadata risiko.                         |
| `policy/tools-unknown-risk-level`                        | Deklarasi alat yang diatur menggunakan nilai risiko yang tidak dikenal.            |
| `policy/tools-missing-sensitivity-token`                 | Deklarasi alat yang diatur tidak memiliki metadata sensitivitas.                   |
| `policy/tools-missing-owner`                             | Deklarasi alat yang diatur tidak memiliki metadata pemilik.                       |
| `policy/tools-unknown-sensitivity-token`                 | Deklarasi alat yang diatur menggunakan nilai sensitivitas yang tidak dikenal.      |

Sebuah temuan dapat menyertakan `target` (hal yang diamati di ruang kerja dan
tidak sesuai) maupun `requirement` (aturan yang ditulis yang menjadikannya temuan).
Keduanya saat ini merupakan string alamat `oc://`, tetapi nama bidang menjelaskan peran
kebijakan, bukan format alamat.

Contoh temuan:

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "Kanal 'telegram' menggunakan penyedia 'telegram' yang ditolak.",
  "source": "policy",
  "path": "konfigurasi openclaw",
  "ocPath": "oc://openclaw.config/channels/telegram",
  "target": "oc://openclaw.config/channels/telegram",
  "requirement": "oc://policy.jsonc/channels/denyRules/#0",
  "fixHint": "Telegram tidak disetujui untuk ruang kerja ini."
}
```

```json
{
  "checkId": "policy/tools-missing-risk-level",
  "severity": "error",
  "message": "Alat 'deploy' dalam TOOLS.md tidak memiliki klasifikasi risiko eksplisit.",
  "source": "policy",
  "path": "TOOLS.md",
  "line": 12,
  "ocPath": "oc://TOOLS.md/tools/deploy",
  "target": "oc://TOOLS.md/tools/deploy",
  "requirement": "oc://policy.jsonc/tools/requireMetadata"
}
```

```json
{
  "checkId": "policy/mcp-unapproved-server",
  "severity": "error",
  "message": "Server MCP 'remote' tidak ada dalam daftar izin kebijakan.",
  "source": "policy",
  "path": "konfigurasi openclaw",
  "ocPath": "oc://openclaw.config/mcp/servers/remote",
  "target": "oc://openclaw.config/mcp/servers/remote",
  "requirement": "oc://policy.jsonc/mcp/servers/allow"
}
```

```json
{
  "checkId": "policy/models-unapproved-provider",
  "severity": "error",
  "message": "Referensi model 'anthropic/claude-sonnet-4.7' menggunakan penyedia 'anthropic' yang tidak disetujui.",
  "source": "policy",
  "path": "konfigurasi openclaw",
  "ocPath": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "target": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "requirement": "oc://policy.jsonc/models/providers/allow"
}
```

```json
{
  "checkId": "policy/network-private-access-enabled",
  "severity": "error",
  "message": "Pengaturan jaringan 'browser-private-network' mengizinkan akses jaringan privat.",
  "source": "policy",
  "path": "konfigurasi openclaw",
  "ocPath": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "target": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "requirement": "oc://policy.jsonc/network/privateNetwork/allow"
}
```

```json
{
  "checkId": "policy/gateway-non-loopback-bind",
  "severity": "error",
  "message": "Pengaturan bind Gateway 'gateway-bind' mengizinkan paparan non-loopback.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/bind",
  "target": "oc://openclaw.config/gateway/bind",
  "requirement": "oc://policy.jsonc/gateway/exposure/allowNonLoopbackBind"
}
```

```json
{
  "checkId": "policy/gateway-node-command-denied",
  "severity": "error",
  "message": "Perintah node Gateway 'system.run' ditolak oleh kebijakan, tetapi tidak ditolak oleh konfigurasi OpenClaw.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/nodes/denyCommands",
  "target": "oc://openclaw.config/gateway/nodes/denyCommands",
  "requirement": "oc://policy.jsonc/gateway/nodes/denyCommands",
  "fixHint": "Tambahkan 'system.run' ke gateway.nodes.denyCommands atau perbarui kebijakan setelah ditinjau."
}
```

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "workspaceAccess sandbox agents.defaults 'rw' tidak diizinkan oleh kebijakan.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## Perbaikan

`doctor --lint` dan `policy check` bersifat hanya-baca.

`doctor --fix` hanya mengedit pengaturan ruang kerja yang dikelola kebijakan ketika
`workspaceRepairs` diaktifkan secara eksplisit; jika tidak, pemeriksaan melaporkan apa yang
akan diperbaiki dan membiarkan pengaturan tidak berubah.

Dalam versi ini, perbaikan dapat menonaktifkan saluran yang ditolak oleh `channels.denyRules` dan
menerapkan perbaikan penyempitan otomatis yang tercantum di bawah. Aktifkan `workspaceRepairs`
hanya setelah berkas kebijakan ditinjau, karena aturan yang valid dapat mengubah
konfigurasi ruang kerja:

- tetapkan `tools.elevated.enabled=false` ketika kebijakan global melarang alat dengan hak istimewa
- tambahkan ID alat wajib-tolak yang hilang ke `tools.deny` atau
  `agents.list[].tools.deny` ketika kebijakan mengharuskan alat tersebut ditolak
- tetapkan tombol alih `gateway.controlUi.*` yang tidak aman ke `false`
- tetapkan `gateway.mode=local` ketika kebijakan menolak mode Gateway jarak jauh
- tetapkan jalur `gateway.http.endpoints.*.enabled` yang dilaporkan ke `false` ketika kebijakan
  menolak titik akhir API HTTP Gateway
- tetapkan jalur `groupPolicy` masuk saluran yang dilaporkan ke `allowlist` ketika kebijakan
  menolak masuknya grup terbuka
- tetapkan jalur `requireMention` masuk saluran yang dilaporkan ke `true` ketika kebijakan
  mewajibkan penyebutan grup
- tetapkan `logging.redactSensitive=tools` ketika kebijakan mewajibkan penyamaran
  pencatatan sensitif
- tetapkan `diagnostics.otel.captureContent=false`, atau
  `diagnostics.otel.captureContent.enabled=false` untuk pengaturan pengambilan telemetri
  berbentuk objek, ketika kebijakan menolak pengambilan konten telemetri

Perbaikan alat dengan hak istimewa terbatas cakupan hanya bersifat deteksi. Perbaikan penanganan data terbatas cakupan
juga dilewati ketika temuan melaporkan konfigurasi pencatatan atau telemetri bersama,
karena mengubah pengaturan bersama akan memengaruhi lebih dari target kebijakan
terbatas cakupan.

Perbaikan wajib-tolak terbatas cakupan dilewati ketika temuan melaporkan
`tools.deny` root yang diwarisi, karena menambahkan alat wajib tersebut ke konfigurasi root akan memengaruhi
lebih dari target kebijakan terbatas cakupan. Perbaikan wajib-tolak lokal agen dapat memperbarui
jalur `agents.list[].tools.deny` yang dilaporkan.

Perbaikan masuk saluran terbatas cakupan dilewati ketika temuan melaporkan
`channels.defaults.*` yang diwarisi, karena mengubah pengaturan bawaan saluran bersama akan memengaruhi
lebih dari target kebijakan terbatas cakupan. Temuan daftar yang diizinkan untuk pengambilan URL HTTP Gateway
tetap harus ditangani secara manual karena perbaikan otomatis tidak dapat memilih nilai daftar
URL titik akhir yang diizinkan dengan benar.

Temuan bind Gateway dan perintah node tetap memerlukan peninjauan. Ketika
`policy/gateway-non-loopback-bind` atau `policy/gateway-node-command-denied`
dapat dipetakan ke jalur konfigurasi, `doctor --fix` melaporkan usulan
perubahan `gateway.bind` atau `gateway.nodes.denyCommands` sebagai panduan
pratinjau yang dilewati. Perubahan tersebut tidak diterapkan, dan temuan tidak dianggap
telah diperbaiki sampai operator meninjau dan memperbarui konfigurasi atau kebijakan.

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "config": {
          "workspaceRepairs": true,
        },
      },
    },
  },
}
```

## Kode keluar

| Perintah          | `0`                                                    | `1`                                                                 | `2`                          |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------- | ---------------------------- |
| `policy check`   | Tidak ada temuan pada ambang batas tersebut.                          | Satu atau lebih temuan memenuhi ambang batas.                             | Kegagalan argumen atau runtime. |
| `policy compare` | Berkas kebijakan setidaknya sama ketatnya dengan garis dasar. | Berkas kebijakan tidak valid, tidak ada, atau lebih lemah daripada aturan garis dasar. | Kegagalan argumen atau runtime. |
| `policy watch`   | Tidak ada temuan dan hash yang diterima masih mutakhir.              | Terdapat temuan atau pengesahan yang diterima sudah usang.                    | Kegagalan argumen atau runtime. |

## Terkait

- [Mode lint Doctor](/id/cli/doctor#lint-mode)
- [CLI jalur](/id/cli/path)
