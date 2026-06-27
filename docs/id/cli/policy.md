---
read_when:
    - Anda ingin memeriksa pengaturan OpenClaw terhadap policy.jsonc yang ditulis.
    - Anda menginginkan temuan kebijakan dalam lint doctor
    - Anda memerlukan hash pengesahan kebijakan untuk bukti audit
summary: Referensi CLI untuk pemeriksaan kesesuaian `openclaw policy`
title: Kebijakan
x-i18n:
    generated_at: "2026-06-27T17:20:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5af65bb34aeed72bbb348a56195d65152dce1e8d0e7236da8d8681e56c9b32f4
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` disediakan oleh Plugin Policy bawaan. Policy adalah lapisan
kesesuaian enterprise di atas pengaturan OpenClaw yang sudah ada. Ini tidak
menambahkan sistem konfigurasi kedua. `policy.jsonc` mendefinisikan persyaratan
yang ditulis, OpenClaw mengamati workspace aktif sebagai bukti, dan pemeriksaan
kesehatan policy melaporkan drift melalui `doctor --lint`. Sinyal kesesuaian
akhir adalah eksekusi `doctor --lint` yang bersih; policy menyumbangkan temuan
ke permukaan lint bersama tersebut alih-alih membuat gerbang kesehatan terpisah.

Policy saat ini mengelola channel yang dikonfigurasi, server MCP, penyedia
model, postur SSRF jaringan, postur akses ingress/channel, postur eksposur Gateway, postur workspace agent,
postur penanganan data, postur penyedia rahasia/profil auth konfigurasi OpenClaw, dan deklarasi tool
yang diatur. Misalnya, IT atau operator workspace dapat mencatat bahwa Telegram
bukan penyedia channel yang disetujui, membatasi server MCP dan ref model ke
entri yang disetujui, mewajibkan akses fetch/browser jaringan privat tetap
dinonaktifkan, mewajibkan isolasi sesi pesan langsung dan postur ingress channel
tetap dalam batas yang telah ditinjau, mewajibkan bind/auth/eksposur HTTP Gateway tetap dalam batas yang telah ditinjau,
mewajibkan akses workspace agent dan penolakan tool tetap dalam postur yang telah ditinjau,
mewajibkan SecretRef konfigurasi OpenClaw menggunakan penyedia terkelola, mewajibkan
profil auth konfigurasi membawa metadata penyedia/mode, mewajibkan tool yang diatur
membawa metadata risiko dan sensitivitas, mewajibkan redaksi logging sensitif, menolak
pengambilan konten telemetri, mewajibkan pemeliharaan retensi sesi, menolak pengindeksan memori
transkrip sesi, lalu menggunakan `doctor --lint` sebagai gerbang kesesuaian
bersama.

Gunakan policy ketika workspace membutuhkan pernyataan tahan lama seperti "channel ini
tidak boleh diaktifkan" atau "tool yang diatur harus mendeklarasikan metadata persetujuan" dan
cara berulang untuk membuktikan bahwa OpenClaw masih sesuai dengan pernyataan tersebut. Gunakan
konfigurasi biasa dan dokumen workspace saja ketika Anda hanya membutuhkan perilaku lokal dan
tidak membutuhkan temuan policy atau output atestasi.

## Mulai cepat

Aktifkan Plugin Policy bawaan sebelum penggunaan pertama:

```bash
openclaw plugins enable policy
```

Ketika policy diaktifkan, doctor dapat memuat pemeriksaan kesehatan policy tanpa mengaktifkan
Plugin arbitrer. Plugin tetap aktif jika `policy.jsonc` hilang, sehingga
doctor dapat melaporkan artefak yang hilang.

Policy ditulis, bukan dibuat dari pengaturan pengguna saat ini. Policy minimal
untuk channel, server MCP, penyedia model, postur jaringan, akses ingress/channel, eksposur Gateway,
postur workspace agent, postur runtime sandbox yang dikonfigurasi, postur penanganan data
OpenClaw, postur penyedia rahasia/profil auth konfigurasi, postur file persetujuan exec,
dan metadata tool terlihat seperti ini:

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "Telegram is not approved for this workspace.",
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

Aturan adalah otoritasnya. Blok kategori hanyalah namespace; pemeriksaan berjalan
ketika aturan konkret ada. OpenClaw membaca pengaturan `channels.*` saat ini,
`mcp.servers.*`, `models.providers.*`, ref model agent yang dipilih, pengaturan SSRF jaringan,
cakupan sesi pesan langsung, policy DM channel, policy grup channel,
gerbang mention channel/grup, postur bind/auth/Control UI/Tailscale/remote/HTTP Gateway,
postur akses workspace sandbox agent konfigurasi OpenClaw dan penolakan tool,
postur konfigurasi penanganan data, asal-usul penyedia rahasia
konfigurasi dan SecretRef, metadata profil auth konfigurasi, postur tool
global/per-agent yang dikonfigurasi, dan deklarasi `TOOLS.md` sebagai bukti, lalu
melaporkan status teramati yang tidak sesuai. Jika policy menolak bind Gateway
non-loopback, hilangkan `gateway.bind` hanya ketika Anda
bersedia meninjau default runtime; atur `gateway.bind=loopback` untuk
kesesuaian konfigurasi yang ketat. Untuk postur agent read-only, konfigurasikan mode sandbox
pada default atau agent yang berlaku dan atur `workspaceAccess` ke `none` atau
`ro`; mode sandbox yang dihilangkan atau `off` tidak memenuhi policy read-only/no-write.
`agents.workspace.denyTools` mendukung `exec`, `process`, `write`,
`edit`, dan `apply_patch`; konfigurasi OpenClaw `group:fs` mencakup tool mutasi file
dan `group:runtime` mencakup tool shell/proses. Policy postur tool mengamati
`tools.profile`, `tools.allow`, `tools.alsoAllow`, `tools.deny`,
`tools.fs.workspaceOnly`, `tools.exec.security`, `tools.exec.ask`,
`tools.exec.host`, `tools.elevated.enabled`, dan override per-agent yang sama
`agents.list[].tools.*`. Policy persetujuan exec membaca artefak produk
`exec-approvals.json` bernama hanya ketika aturan `execApprovals` ada;
bukti mencatat default, postur per-agent, dan pola allowlist
tanpa token soket atau teks perintah yang terakhir digunakan. Policy tidak menerapkan panggilan tool
saat runtime. Bukti rahasia mencatat
postur penyedia/sumber dan metadata SecretRef, tidak pernah nilai rahasia mentah. Policy
tidak membaca atau mengatestasi store kredensial per-agent seperti `auth-profiles.json`;
store tersebut tetap dimiliki oleh alur auth dan kredensial yang sudah ada.
Bukti penanganan data hanya berupa postur tingkat konfigurasi: ini memeriksa
mode redaksi yang dikonfigurasi, toggle pengambilan konten telemetri, mode pemeliharaan sesi, dan
pengaturan pengindeksan memori transkrip sesi. Ini tidak memeriksa log mentah,
ekspor telemetri, isi transkrip, file memori, atau membuktikan bahwa tidak ada data pribadi
atau rahasia.

### Referensi aturan policy

Setiap field policy di bawah ini opsional. Pemeriksaan berjalan hanya ketika aturan yang cocok
ada di `policy.jsonc`. Status teramati adalah konfigurasi OpenClaw yang sudah ada atau
metadata workspace; policy melaporkan drift tetapi tidak menulis ulang perilaku runtime
kecuali jalur perbaikan tersedia secara eksplisit dan diaktifkan.
File policy bersifat ketat: section atau key aturan yang tidak didukung dilaporkan sebagai
`policy/policy-jsonc-invalid` alih-alih diabaikan.

Overlay policy menjaga aturan tingkat atas yang luas tetap global, lalu memungkinkan blok scope bernama
menambahkan section policy normal yang lebih ketat untuk selector eksplisit. Nama scope hanyalah
bucket deskriptif; pencocokan menggunakan nilai selector di dalam scope.
Overlay bersifat aditif: klaim global tetap berjalan, dan klaim scoped dapat memancarkan
temuannya sendiri terhadap konfigurasi teramati yang sama.

#### Overlay scoped

Gunakan `scopes.<scopeName>` ketika satu set agent atau channel membutuhkan
policy yang lebih ketat daripada baseline tingkat atas. Section scoped agent menggunakan `agentIds`, yang
mendukung `tools.*`, `agents.workspace.*`, `sandbox.*`, `dataHandling.memory.*`,
dan `execApprovals.*`. Ingress scoped channel
menggunakan `channelIds`, yang mendukung `ingress.channels.*`. Section yang tidak didukung
ditolak alih-alih diabaikan. Jika entri `agentIds` tidak
ada di `agents.list[]`, OpenClaw mengevaluasi aturan scoped terhadap postur global/default
yang diwarisi untuk id agent runtime tersebut.

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

Agent yang sama dapat muncul di beberapa scope ketika setiap scope mengatur field yang berbeda,
seperti ditunjukkan di atas. Field scoped berulang untuk agent yang sama harus
sama ketatnya atau lebih ketat menurut metadata policy; klaim duplikat yang lebih lemah
ditolak. Metadata strictness memperlakukan allow-list sebagai subset,
deny-list sebagai superset, dan boolean wajib sebagai persyaratan tetap.

Policy postur container dievaluasi hanya terhadap bukti yang dapat
diamati OpenClaw untuk agent yang cocok. Jika aturan `sandbox.containers.*` yang aktif berlaku
untuk agent yang backend sandbox-nya tidak dapat mengekspos field tersebut, policy melaporkan
`policy/sandbox-container-posture-unobservable` alih-alih memperlakukan klaim sebagai
lulus. Gunakan scope `agentIds` terpisah untuk grup agent yang menggunakan backend
sandbox berbeda, dan biarkan aturan container yang tidak didukung tidak diatur atau false untuk
grup tempat field tersebut tidak dapat diamati.

`ingress.session.requireDmScope` tingkat atas tetap global karena
`session.dmScope` bukan bukti yang dapat diatribusikan ke channel.

| Pemilih     | Bagian yang didukung                                                               | Gunakan saat                                          |
| ------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, dan `execApprovals` | Satu atau beberapa agen runtime memerlukan aturan yang lebih ketat.   |
| `channelIds` | `ingress.channels`                                                                 | Satu atau beberapa saluran memerlukan aturan ingress yang lebih ketat. |

Setiap cakupan yang ada di `policy.jsonc` harus valid dan dapat diberlakukan.

#### Saluran

| Kolom kebijakan                         | Status yang diamati                          | Gunakan saat                                                     |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | Provider `channels.*` dan status aktif | Menolak saluran yang dikonfigurasi dari provider seperti `telegram`. |
| `channels.denyRules[].reason`        | Konteks pesan temuan dan petunjuk perbaikan | Menjelaskan mengapa provider ditolak.                          |

#### Server MCP

| Kolom kebijakan        | Status yang diamati      | Gunakan saat                                                   |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | id `mcp.servers.*` | Mengharuskan setiap server MCP yang dikonfigurasi ada dalam allowlist. |
| `mcp.servers.deny`  | id `mcp.servers.*` | Menolak id server MCP tertentu yang dikonfigurasi.                   |

#### Provider model

| Kolom kebijakan             | Status yang diamati                                   | Gunakan saat                                                                        |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `models.providers.allow` | id `models.providers.*` dan referensi model yang dipilih | Mengharuskan provider yang dikonfigurasi dan referensi model yang dipilih menggunakan provider yang disetujui. |
| `models.providers.deny`  | id `models.providers.*` dan referensi model yang dipilih | Menolak provider yang dikonfigurasi dan referensi model yang dipilih berdasarkan id provider.               |

#### Jaringan

| Kolom kebijakan                   | Status yang diamati                      | Gunakan saat                                                           |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | Jalur pengecualian SSRF jaringan privat | Atur ke `false` untuk mengharuskan akses jaringan privat tetap dinonaktifkan. |

#### Ingress dan akses saluran

| Kolom kebijakan                              | Status yang diamati                                                 | Gunakan saat                                                           |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | Mengharuskan cakupan isolasi pesan langsung yang telah ditinjau.                 |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` dan kolom kebijakan DM saluran lama      | Hanya mengizinkan kebijakan saluran pesan langsung yang telah ditinjau.               |
| `ingress.channels.denyOpenGroups`         | Kebijakan ingress saluran, akun, dan grup                     | Menolak ingress grup terbuka untuk saluran dan akun yang dikonfigurasi.      |
| `ingress.channels.requireMentionInGroups` | Konfigurasi gerbang mention saluran, akun, grup, guild, dan bertingkat | Mengharuskan gerbang mention saat ingress grup terbuka atau dibatasi mention. |

#### Gateway

| Kolom kebijakan                            | Status yang diamati                                 | Gunakan saat                                                     |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | Atur ke `false` untuk mengharuskan pengikatan Gateway loopback.          |
| `gateway.exposure.allowTailscaleFunnel` | Postur Gateway Tailscale serve/funnel         | Atur ke `false` untuk menolak eksposur Tailscale Funnel.            |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | Atur ke `true` untuk menolak auth Gateway yang dinonaktifkan.               |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | Atur ke `true` untuk mengharuskan konfigurasi rate-limit auth yang eksplisit.    |
| `gateway.controlUi.allowInsecure`       | Toggle auth/perangkat/origin Control UI yang tidak aman | Atur ke `false` untuk menolak toggle eksposur Control UI yang tidak aman. |
| `gateway.remote.allow`                  | Mode/konfigurasi Gateway jarak jauh                     | Atur ke `false` untuk menolak mode Gateway jarak jauh.                  |
| `gateway.http.denyEndpoints`            | Endpoint API HTTP Gateway                     | Menolak id endpoint seperti `chatCompletions` atau `responses`.  |
| `gateway.http.requireUrlAllowlists`     | Input pengambilan URL HTTP Gateway                  | Atur ke `true` untuk mengharuskan allowlist URL pada input pengambilan URL. |

#### Ruang kerja agen

| Kolom kebijakan                     | Status yang diamati                                                                        | Gunakan saat                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` dan `agents.list[].sandbox.workspaceAccess` | Hanya mengizinkan nilai akses ruang kerja sandbox seperti `none` atau `ro`.                                                  |
| `agents.workspace.denyTools`     | Konfigurasi penolakan alat global dan per agen                                                 | Mengharuskan alat mutasi ruang kerja/runtime seperti `exec`, `process`, `write`, `edit`, atau `apply_patch` ditolak. |

#### Postur sandbox

| Kolom kebijakan                                          | Status yang diamati                                          | Gunakan saat                                                       |
| ----------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` dan mode per agen       | Hanya mengizinkan mode sandbox yang telah ditinjau seperti `all` atau `non-main`. |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` dan backend per agen | Hanya mengizinkan backend sandbox yang telah ditinjau seperti `docker`.         |
| `sandbox.containers.denyHostNetwork`                  | Mode jaringan sandbox/browser berbasis kontainer           | Menolak mode jaringan host.                                        |
| `sandbox.containers.denyContainerNamespaceJoin`       | Mode jaringan sandbox/browser berbasis kontainer           | Menolak bergabung ke namespace jaringan kontainer lain.              |
| `sandbox.containers.requireReadOnlyMounts`            | Mode mount sandbox/browser berbasis kontainer             | Mengharuskan mount bersifat hanya baca.                                |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | Target mount sandbox/browser berbasis kontainer          | Menolak mount socket runtime kontainer.                          |
| `sandbox.containers.denyUnconfinedProfiles`           | Postur profil keamanan kontainer                      | Menolak profil keamanan kontainer tanpa pembatasan.                   |
| `sandbox.browser.requireCdpSourceRange`               | Rentang sumber CDP browser sandbox                        | Mengharuskan eksposur CDP browser mendeklarasikan rentang sumber.        |

Kebijakan memperlakukan `sandbox.mode` yang hilang sebagai default implisit `off`, sehingga
`sandbox.requireMode` melaporkan sandbox baru atau belum dikonfigurasi sebagai berada di luar
allowlist seperti `["all"]`.

#### Penanganan Data

| Kolom kebijakan                                        | Status yang diamati                                                                       | Gunakan saat                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | Atur ke `true` untuk menolak `logging.redactSensitive: "off"`.              |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | Atur ke `true` untuk menolak penangkapan konten telemetri.                     |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | Atur ke `true` untuk mengharuskan mode pemeliharaan sesi efektif `enforce`. |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` dan `agents.*.memorySearch.experimental.sessionMemory` | Atur ke `true` untuk menolak pengindeksan transkrip sesi ke memori.       |

#### Rahasia

| Kolom kebijakan                      | Status yang diamati                                           | Gunakan saat                                                                |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | SecretRef konfigurasi dan deklarasi `secrets.providers.*` | Atur ke `true` untuk mengharuskan SecretRef menunjuk ke provider yang dideklarasikan.     |
| `secrets.denySources`             | Sumber provider rahasia dan sumber SecretRef            | Menolak sumber seperti `exec`, `file`, atau nama sumber lain yang dikonfigurasi. |
| `secrets.allowInsecureProviders`  | Flag postur provider rahasia yang tidak aman                   | Atur ke `false` untuk menolak provider yang memilih postur tidak aman.      |

#### Persetujuan exec

Kebijakan persetujuan exec mengamati artefak runtime aktif `exec-approvals.json`.
Secara default ini adalah `~/.openclaw/exec-approvals.json`; saat
`OPENCLAW_STATE_DIR` ditetapkan, Kebijakan membaca
`$OPENCLAW_STATE_DIR/exec-approvals.json`. Aturan postur aktual seperti
`execApprovals.defaults.*` atau `execApprovals.agents.*` memerlukan bukti artefak
yang dapat dibaca; artefak yang hilang atau tidak valid dilaporkan sebagai bukti
yang tidak dapat diamati, bukan menjadi kelulusan best-effort terhadap default runtime sintetis. Setelah
artefak dapat dibaca, kolom persetujuan yang dihilangkan mewarisi default runtime: `defaults.security` yang hilang
adalah `full`, dan keamanan agen yang hilang mewarisi default tersebut. Bukti mencakup
`defaults`, `agents.*`, dan `agents.*.allowlist[].pattern` ditambah `argPattern` opsional, postur
`autoAllowSkills` efektif, dan sumber entri. Bukti tidak mencakup path/token
socket, `commandText`, `lastUsedCommand`, path yang di-resolve, atau timestamp.

| Bidang kebijakan                         | Status yang diamati                                                                  | Gunakan saat                                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`              | Path `exec-approvals.json` runtime aktif                                             | Atur ke `true` untuk mewajibkan artefak persetujuan ada dan dapat diurai.               |
| `execApprovals.defaults.allowSecurity`   | `defaults.security`, dengan default `full`                                           | Izinkan hanya mode keamanan persetujuan default yang disetujui.                         |
| `execApprovals.agents.allowSecurity`     | `agents.*.security`, mewarisi default                                                | Izinkan hanya mode keamanan persetujuan efektif per agen yang disetujui.                |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` dan `agents.*.autoAllowSkills`, mewarisi default runtime | Atur ke `false` untuk mewajibkan allowlist manual ketat tanpa persetujuan CLI skill implisit. |
| `execApprovals.agents.allowlist.expected` | Pola agregat `agents.*.allowlist[]` dan entri argPattern opsional                   | Wajibkan allowlist persetujuan cocok dengan kumpulan pola yang telah ditinjau.           |

Misalnya, wajibkan artefak persetujuan, tolak default yang permisif, dan
izinkan hanya postur persetujuan exec yang telah ditinjau untuk agen terpilih:

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Security modes: "deny", "allowlist", or "full".
      // This default permits only the locked-down deny posture.
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Selected agents may use reviewed allowlist posture, but not "full".
          "allowSecurity": ["allowlist"],
          // false means skill CLIs must appear in the reviewed allowlist instead of
          // being implicitly approved by autoAllowSkills.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Simple entry: exact reviewed executable pattern with no argPattern.
              "travel-hub",
              // Constrained entry: pattern plus reviewed argument regex.
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

| Bidang kebijakan               | Status yang diamati                       | Gunakan saat                                                                              |
| ------------------------------ | ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| `auth.profiles.requireMetadata` | Metadata penyedia dan mode `auth.profiles.*` | Wajibkan kunci metadata seperti `provider` dan `mode` pada profil autentikasi config.      |
| `auth.profiles.allowModes`     | `auth.profiles.*.mode`                    | Izinkan hanya mode profil autentikasi yang didukung seperti `api_key`, `aws-sdk`, `oauth`, atau `token`. |

#### Metadata alat

| Bidang kebijakan       | Status yang diamati              | Gunakan saat                                                                                |
| ---------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | Deklarasi `TOOLS.md` yang diatur | Wajibkan alat yang diatur mendeklarasikan kunci metadata seperti `risk`, `sensitivity`, atau `owner`. |

#### Postur alat

| Bidang kebijakan               | Status yang diamati                                      | Gunakan saat                                                                                              |
| ------------------------------ | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`         | `tools.profile` dan `agents.list[].tools.profile`        | Izinkan hanya id profil alat seperti `minimal`, `messaging`, atau `coding`.                               |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` dan override `tools.fs` per agen | Atur ke `true` untuk mewajibkan postur alat filesystem khusus workspace.                                  |
| `tools.exec.allowSecurity`     | `tools.exec.security` dan keamanan exec per agen         | Izinkan hanya mode keamanan exec seperti `deny` atau `allowlist`.                                         |
| `tools.exec.requireAsk`        | `tools.exec.ask` dan mode ask exec per agen              | Wajibkan postur persetujuan seperti `always`.                                                            |
| `tools.exec.allowHosts`        | `tools.exec.host` dan routing host exec per agen         | Izinkan hanya mode routing host exec seperti `sandbox`.                                                   |
| `tools.elevated.allow`         | `tools.elevated.enabled` dan postur elevated per agen    | Atur ke `false` untuk mewajibkan mode alat elevated tetap nonaktif.                                       |
| `tools.alsoAllow.expected`     | `tools.alsoAllow` dan `tools.alsoAllow` per agen         | Wajibkan entri `alsoAllow` persis dan laporkan pemberian alat tambahan yang hilang atau tidak diharapkan. |
| `tools.denyTools`              | `tools.deny` dan `agents.list[].tools.deny`              | Wajibkan daftar penolakan alat yang dikonfigurasi menyertakan id atau grup alat seperti `group:runtime` dan `group:fs`. |

Jalankan pemeriksaan khusus kebijakan selama penulisan:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` hanya menjalankan kumpulan pemeriksaan kebijakan dan menghasilkan bukti, temuan, serta
hash atestasi. Temuan yang sama juga muncul di `openclaw doctor --lint`
saat Plugin Policy diaktifkan.

Bandingkan file kebijakan operator dengan file kebijakan baseline yang ditulis:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` membandingkan sintaks file kebijakan dengan sintaks file kebijakan. Perintah ini tidak
memeriksa status runtime OpenClaw, bukti, kredensial, atau rahasia. Perintah ini
menggunakan metadata aturan kebijakan yang sama yang mengatur overlay berscope: allowlist harus
tetap sama atau lebih sempit, denylist harus tetap sama atau lebih luas, boolean wajib
harus mempertahankan nilai wajibnya, string berurutan hanya boleh bergerak ke ujung yang lebih
restriktif dari urutan yang dikonfigurasi, dan daftar persis harus cocok.

File baseline dapat berupa kebijakan yang ditulis organisasi. Kebijakan yang diperiksa dapat
menggunakan nilai yang lebih ketat atau menambahkan aturan kebijakan ekstra. Aturan terperiksa tingkat atas juga dapat
memenuhi aturan baseline berscope saat sama atau lebih restriktif karena
kebijakan tingkat atas berlaku luas. Nama scope tidak perlu cocok; perbandingan
berscope dikunci oleh nilai selector seperti `agentIds` atau `channelIds` dan oleh
bidang kebijakan yang diperiksa.

Contoh output JSON perbandingan bersih hanya melaporkan status perbandingan file kebijakan:

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

Contoh output bersih `policy check --json` menyertakan hash stabil yang dapat
dicatat oleh operator atau supervisor:

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

Config kebijakan berada di bawah `plugins.entries.policy.config`.

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
| `enabled`                 | Aktifkan pemeriksaan kebijakan bahkan sebelum `policy.jsonc` ada. |
| `workspaceRepairs`        | Izinkan `doctor --fix` mengedit pengaturan workspace yang dikelola kebijakan. |
| `expectedHash`            | Kunci hash opsional untuk artefak kebijakan yang disetujui.      |
| `expectedAttestationHash` | Kunci hash opsional untuk pemeriksaan kebijakan bersih terakhir yang diterima. |
| `path`                    | Lokasi artefak kebijakan relatif terhadap workspace.             |

Atur `plugins.entries.policy.config.enabled` ke `false` untuk menonaktifkan pemeriksaan kebijakan
untuk sebuah workspace sambil membiarkan plugin tetap terpasang.

Persyaratan metadata alat ditulis di `policy.jsonc` dengan
`tools.requireMetadata`, misalnya `["risk", "sensitivity", "owner"]`.

## Terima status kebijakan

Contoh output JSON:

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
        "ref": "openai/gpt-5.5",
        "provider": "openai",
        "model": "gpt-5.5",
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

Hash kebijakan mengidentifikasi artefak aturan yang ditulis. Blok bukti
mencatat status OpenClaw yang diamati dan digunakan oleh pemeriksaan kebijakan.
Nilai `workspace.hash` mengidentifikasi payload bukti tersebut untuk cakupan
yang diperiksa. Hash temuan mengidentifikasi set temuan persis yang dikembalikan
oleh pemeriksaan. `checkedAt` mencatat waktu evaluasi dijalankan. Hash atestasi
mengidentifikasi klaim yang stabil: hash kebijakan, hash bukti, hash temuan, dan
apakah hasilnya bersih. Hash ini sengaja tidak menyertakan `checkedAt`, sehingga
status kebijakan yang sama menghasilkan atestasi yang sama di berbagai
pemeriksaan berulang. Bersama-sama, semua ini membentuk tuple audit untuk
pemeriksaan kebijakan ini.

Jika gateway atau supervisor berikutnya menggunakan kebijakan untuk memblokir,
menyetujui, atau memberi anotasi pada tindakan runtime, ia harus mencatat hash
atestasi dari pemeriksaan kebijakan bersih terakhir. `checkedAt` tetap ada dalam
keluaran JSON untuk log audit, tetapi bukan bagian dari hash atestasi yang
stabil.

Gunakan siklus hidup ini saat menerima status kebijakan:

1. Tulis atau tinjau `policy.jsonc`.
2. Jalankan `openclaw policy check --json`.
3. Jika hasilnya bersih, catat `attestation.policy.hash` sebagai `expectedHash`.
4. Catat `attestation.attestationHash` sebagai `expectedAttestationHash`.
5. Jalankan ulang `openclaw doctor --lint` di CI atau gerbang rilis.

Jika aturan kebijakan berubah secara sengaja, perbarui kedua hash yang diterima
dari pemeriksaan bersih. Jika pengaturan workspace berubah secara sengaja tetapi
kebijakan tetap sama, biasanya hanya `expectedAttestationHash` yang berubah.

Mengaktifkan atau memutakhirkan aturan `agents.workspace` menambahkan bukti
`agentWorkspace` ke hash workspace dan hash atestasi. Operator harus meninjau
bukti baru tersebut dan memperbarui hash atestasi yang diterima setelah
mengaktifkan aturan ini. Mengaktifkan atau memutakhirkan aturan postur alat
menambahkan bukti `toolPosture` dengan cara yang sama.

`openclaw policy watch` menjalankan pemeriksaan yang sama berulang kali dan
melaporkan ketika bukti saat ini tidak lagi cocok dengan
`expectedAttestationHash`:

```bash
openclaw policy watch --json
```

Gunakan `--once` di CI atau skrip yang hanya memerlukan satu evaluasi drift.
Tanpa `--once`, perintah melakukan polling setiap dua detik secara default;
gunakan `--interval-ms` untuk memilih interval yang berbeda.

## Temuan

Kebijakan saat ini memverifikasi:

| Id pemeriksaan                                           | Temuan                                                                            |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | Kebijakan diaktifkan tetapi `policy.jsonc` tidak ada.                             |
| `policy/policy-jsonc-invalid`                            | Kebijakan tidak dapat diurai atau berisi entri aturan yang salah format.          |
| `policy/policy-hash-mismatch`                            | Kebijakan tidak cocok dengan `expectedHash` yang dikonfigurasi.                   |
| `policy/attestation-hash-mismatch`                       | Bukti kebijakan saat ini tidak lagi cocok dengan atestasi yang diterima.          |
| `policy/policy-conformance-invalid`                      | File kebijakan dasar atau yang diperiksa memiliki sintaks perbandingan tidak valid. |
| `policy/policy-conformance-missing`                      | File kebijakan yang diperiksa tidak memiliki aturan yang diwajibkan oleh file kebijakan dasar. |
| `policy/policy-conformance-weaker`                       | File kebijakan yang diperiksa memiliki nilai yang lebih lemah daripada file kebijakan dasar. |
| `policy/channels-denied-provider`                        | Channel yang diaktifkan cocok dengan aturan penolakan channel.                    |
| `policy/mcp-denied-server`                               | Server MCP yang dikonfigurasi ditolak oleh kebijakan.                             |
| `policy/mcp-unapproved-server`                           | Server MCP yang dikonfigurasi berada di luar daftar izin.                         |
| `policy/models-denied-provider`                          | Penyedia model atau referensi model yang dikonfigurasi menggunakan penyedia yang ditolak. |
| `policy/models-unapproved-provider`                      | Penyedia model atau referensi model yang dikonfigurasi berada di luar daftar izin. |
| `policy/network-private-access-enabled`                  | Celah pelolosan SSRF jaringan privat diaktifkan ketika kebijakan menolaknya.      |
| `policy/ingress-dm-policy-unapproved`                    | Kebijakan DM channel berada di luar daftar izin kebijakan.                        |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` tidak cocok dengan cakupan isolasi DM yang diwajibkan kebijakan. |
| `policy/ingress-open-groups-denied`                      | Kebijakan grup channel adalah `open` sementara kebijakan menolak ingress grup terbuka. |
| `policy/ingress-group-mention-required`                  | Entri channel atau grup menonaktifkan gerbang mention sementara kebijakan mewajibkannya. |
| `policy/gateway-non-loopback-bind`                       | Postur bind Gateway mengizinkan eksposur non-loopback ketika kebijakan menolaknya. |
| `policy/gateway-auth-disabled`                           | Autentikasi Gateway dinonaktifkan ketika kebijakan mewajibkan auth.               |
| `policy/gateway-rate-limit-missing`                      | Postur pembatasan laju auth Gateway tidak eksplisit ketika kebijakan mewajibkannya. |
| `policy/gateway-control-ui-insecure`                     | Toggle eksposur tidak aman Gateway Control UI diaktifkan.                         |
| `policy/gateway-tailscale-funnel`                        | Eksposur Gateway Tailscale Funnel diaktifkan ketika kebijakan menolaknya.         |
| `policy/gateway-remote-enabled`                          | Mode jarak jauh Gateway aktif ketika kebijakan menolaknya.                        |
| `policy/gateway-http-endpoint-enabled`                   | Endpoint HTTP API Gateway diaktifkan sementara ditolak oleh kebijakan.            |
| `policy/gateway-http-url-fetch-unrestricted`             | Input pengambilan URL HTTP Gateway tidak memiliki daftar izin URL yang diwajibkan. |
| `policy/agents-workspace-access-denied`                  | Mode sandbox agen atau akses ruang kerja berada di luar daftar izin kebijakan.    |
| `policy/agents-tool-not-denied`                          | Agen atau konfigurasi default tidak menolak alat yang diwajibkan oleh kebijakan.  |
| `policy/tools-profile-unapproved`                        | Profil alat global atau per agen yang dikonfigurasi berada di luar daftar izin.   |
| `policy/tools-fs-workspace-only-required`                | Alat sistem file tidak dikonfigurasi dengan postur jalur khusus ruang kerja.      |
| `policy/tools-exec-security-unapproved`                  | Mode keamanan exec berada di luar daftar izin kebijakan.                          |
| `policy/tools-exec-ask-unapproved`                       | Mode tanya exec berada di luar daftar izin kebijakan.                             |
| `policy/tools-exec-host-unapproved`                      | Routing host exec berada di luar daftar izin kebijakan.                           |
| `policy/tools-elevated-enabled`                          | Mode alat elevated diaktifkan ketika kebijakan menolaknya.                        |
| `policy/tools-also-allow-missing`                        | Daftar `alsoAllow` yang dikonfigurasi tidak memiliki entri yang diwajibkan oleh kebijakan. |
| `policy/tools-also-allow-unexpected`                     | Daftar `alsoAllow` yang dikonfigurasi menyertakan entri yang tidak diharapkan oleh kebijakan. |
| `policy/tools-required-deny-missing`                     | Daftar penolakan alat global atau per agen tidak menyertakan alat ditolak yang diwajibkan. |
| `policy/sandbox-mode-unapproved`                         | Mode sandbox berada di luar daftar izin kebijakan.                                |
| `policy/sandbox-backend-unapproved`                      | Backend sandbox berada di luar daftar izin kebijakan.                             |
| `policy/sandbox-container-posture-unobservable`          | Aturan postur container diaktifkan untuk backend yang tidak dapat mengamatinya.   |
| `policy/sandbox-container-host-network-denied`           | Sandbox atau browser berbasis container menggunakan mode jaringan host.           |
| `policy/sandbox-container-namespace-join-denied`         | Sandbox atau browser berbasis container bergabung dengan namespace container lain. |
| `policy/sandbox-container-mount-mode-required`           | Mount sandbox atau browser berbasis container tidak read-only.                    |
| `policy/sandbox-container-runtime-socket-mount`          | Mount sandbox atau browser berbasis container mengekspos socket runtime container. |
| `policy/sandbox-container-unconfined-profile`            | Profil sandbox container tidak dibatasi ketika kebijakan menolaknya.              |
| `policy/sandbox-browser-cdp-source-range-missing`        | Rentang sumber CDP browser sandbox tidak ada ketika kebijakan mewajibkannya.      |
| `policy/data-handling-redaction-disabled`                | Redaksi logging sensitif dinonaktifkan ketika kebijakan mewajibkannya.            |
| `policy/data-handling-telemetry-content-capture`         | Pengambilan konten telemetri diaktifkan ketika kebijakan menolaknya.              |
| `policy/data-handling-session-retention-not-enforced`    | Pemeliharaan retensi sesi tidak ditegakkan ketika kebijakan mewajibkannya.        |
| `policy/data-handling-session-transcript-memory-enabled` | Pengindeksan memori transkrip sesi diaktifkan ketika kebijakan menolaknya.        |
| `policy/secrets-unmanaged-provider`                      | SecretRef konfigurasi mereferensikan penyedia yang tidak dideklarasikan di bawah `secrets.providers`. |
| `policy/secrets-denied-provider-source`                  | Penyedia secret konfigurasi atau SecretRef menggunakan sumber yang ditolak oleh kebijakan. |
| `policy/secrets-insecure-provider`                       | Penyedia secret memilih postur tidak aman ketika kebijakan menolaknya.            |
| `policy/auth-profile-invalid-metadata`                   | Profil auth konfigurasi tidak memiliki metadata penyedia atau mode yang valid.    |
| `policy/auth-profile-unapproved-mode`                    | Mode profil auth konfigurasi berada di luar daftar izin kebijakan.                |
| `policy/exec-approvals-missing`                          | Kebijakan mewajibkan `exec-approvals.json`, tetapi artefaknya tidak ada.          |
| `policy/exec-approvals-invalid`                          | Artefak persetujuan exec yang dikonfigurasi tidak dapat diurai.                   |
| `policy/exec-approvals-default-security-unapproved`      | Default persetujuan exec menggunakan mode keamanan di luar daftar izin kebijakan. |
| `policy/exec-approvals-agent-security-unapproved`        | Mode keamanan persetujuan exec efektif per agen berada di luar daftar izin.       |
| `policy/exec-approvals-auto-allow-skills-enabled`        | Agen persetujuan exec secara implisit mengizinkan otomatis CLI skill ketika kebijakan menolaknya. |
| `policy/exec-approvals-allowlist-missing`                | Daftar izin persetujuan tidak memiliki pola yang diwajibkan oleh kebijakan.       |
| `policy/exec-approvals-allowlist-unexpected`             | Daftar izin persetujuan menyertakan pola yang tidak diharapkan oleh kebijakan.    |
| `policy/tools-missing-risk-level`                        | Deklarasi alat yang diatur tidak memiliki metadata risiko.                        |
| `policy/tools-unknown-risk-level`                        | Deklarasi alat yang diatur menggunakan nilai risiko yang tidak dikenal.           |
| `policy/tools-missing-sensitivity-token`                 | Deklarasi alat yang diatur tidak memiliki metadata sensitivitas.                  |
| `policy/tools-missing-owner`                             | Deklarasi alat yang diatur tidak memiliki metadata pemilik.                       |
| `policy/tools-unknown-sensitivity-token`                 | Deklarasi alat yang diatur menggunakan nilai sensitivitas yang tidak dikenal.     |

Temuan kebijakan dapat menyertakan `target` dan `requirement`. `target` adalah
hal ruang kerja yang diamati yang tidak sesuai. `requirement` adalah aturan
kebijakan yang ditulis yang menjadikannya temuan. Kedua nilai saat ini adalah
alamat, biasanya jalur `oc://`, tetapi nama field menjelaskan peran kebijakannya
alih-alih format alamatnya.

Contoh temuan JSON:

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "Channel 'telegram' uses denied provider 'telegram'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/channels/telegram",
  "target": "oc://openclaw.config/channels/telegram",
  "requirement": "oc://policy.jsonc/channels/denyRules/#0",
  "fixHint": "Telegram is not approved for this workspace."
}
```

Contoh temuan alat:

```json
{
  "checkId": "policy/tools-missing-risk-level",
  "severity": "error",
  "message": "TOOLS.md tool 'deploy' has no explicit risk classification.",
  "source": "policy",
  "path": "TOOLS.md",
  "line": 12,
  "ocPath": "oc://TOOLS.md/tools/deploy",
  "target": "oc://TOOLS.md/tools/deploy",
  "requirement": "oc://policy.jsonc/tools/requireMetadata"
}
```

Contoh temuan MCP:

```json
{
  "checkId": "policy/mcp-unapproved-server",
  "severity": "error",
  "message": "MCP server 'remote' is not in the policy allowlist.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/mcp/servers/remote",
  "target": "oc://openclaw.config/mcp/servers/remote",
  "requirement": "oc://policy.jsonc/mcp/servers/allow"
}
```

Contoh temuan penyedia model:

```json
{
  "checkId": "policy/models-unapproved-provider",
  "severity": "error",
  "message": "Model ref 'anthropic/claude-sonnet-4.7' uses unapproved provider 'anthropic'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "target": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "requirement": "oc://policy.jsonc/models/providers/allow"
}
```

Contoh temuan jaringan:

```json
{
  "checkId": "policy/network-private-access-enabled",
  "severity": "error",
  "message": "Network setting 'browser-private-network' allows private-network access.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "target": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "requirement": "oc://policy.jsonc/network/privateNetwork/allow"
}
```

Contoh temuan eksposur Gateway:

```json
{
  "checkId": "policy/gateway-non-loopback-bind",
  "severity": "error",
  "message": "Gateway bind setting 'gateway-bind' permits non-loopback exposure.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/bind",
  "target": "oc://openclaw.config/gateway/bind",
  "requirement": "oc://policy.jsonc/gateway/exposure/allowNonLoopbackBind"
}
```

Contoh temuan ruang kerja agen:

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "agents.defaults sandbox workspaceAccess 'rw' is not allowed by policy.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## Perbaikan

`doctor --lint` dan `policy check` bersifat hanya-baca.

`doctor --fix` hanya mengedit pengaturan ruang kerja yang dikelola kebijakan saat
`workspaceRepairs` diaktifkan secara eksplisit. Tanpa opt-in tersebut, pemeriksaan kebijakan
melaporkan apa yang akan diperbaiki dan membiarkan pengaturan tidak berubah.

Dalam versi ini, perbaikan dapat menonaktifkan channel yang diaktifkan dalam konfigurasi OpenClaw
tetapi ditolak oleh `channels.denyRules`. Aktifkan `workspaceRepairs` hanya setelah
file kebijakan ditinjau, karena aturan penolakan yang valid dapat mematikan
channel yang sudah dikonfigurasi:

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

| Perintah         | `0`                                                            | `1`                                                                       | `2`                                |
| ---------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------- |
| `policy check`   | Tidak ada temuan pada ambang batas.                            | Satu atau beberapa temuan memenuhi ambang batas.                          | Kegagalan argumen atau runtime.    |
| `policy compare` | File kebijakan setidaknya seketat baseline.                    | File kebijakan tidak valid, hilang, atau lebih lemah dari aturan baseline. | Kegagalan argumen atau runtime.    |
| `policy watch`   | Tidak ada temuan dan hash yang diterima masih terkini.         | Temuan ada atau attestasi yang diterima sudah usang.                      | Kegagalan argumen atau runtime.    |

## Terkait

- [Mode lint Doctor](/id/cli/doctor#lint-mode)
- [CLI Path](/id/cli/path)
