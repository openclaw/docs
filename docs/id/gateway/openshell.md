---
read_when:
    - Anda menginginkan sandbox yang dikelola di cloud alih-alih Docker lokal
    - Anda sedang menyiapkan plugin OpenShell
    - Anda perlu memilih antara mode workspace mirror dan remote
summary: Gunakan OpenShell sebagai backend sandbox terkelola untuk agen OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-24T09:09:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47954cd27b4c7ef9d4268597c2846960b39b99fd03ece5dddb5055e9282366a0
    source_path: gateway/openshell.md
    workflow: 15
---

OpenShell adalah backend sandbox terkelola untuk OpenClaw. Alih-alih menjalankan container Docker
secara lokal, OpenClaw mendelegasikan lifecycle sandbox ke CLI `openshell`,
yang menyediakan environment jarak jauh dengan eksekusi perintah berbasis SSH.

Plugin OpenShell menggunakan kembali transport SSH inti dan bridge filesystem
jarak jauh yang sama dengan [backend SSH](/id/gateway/sandboxing#ssh-backend) generik. Plugin ini menambahkan
lifecycle khusus OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`)
dan mode workspace `mirror` opsional.

## Prasyarat

- CLI `openshell` terinstal dan ada di `PATH` (atau setel path kustom melalui
  `plugins.entries.openshell.config.command`)
- Akun OpenShell dengan akses sandbox
- Gateway OpenClaw berjalan di host

## Mulai cepat

1. Aktifkan plugin dan setel backend sandbox:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

2. Mulai ulang Gateway. Pada giliran agen berikutnya, OpenClaw membuat sandbox OpenShell
   dan merutekan eksekusi alat melaluinya.

3. Verifikasi:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Mode workspace

Ini adalah keputusan paling penting saat menggunakan OpenShell.

### `mirror`

Gunakan `plugins.entries.openshell.config.mode: "mirror"` saat Anda ingin **workspace
lokal tetap menjadi yang kanonis**.

Perilaku:

- Sebelum `exec`, OpenClaw menyinkronkan workspace lokal ke sandbox OpenShell.
- Setelah `exec`, OpenClaw menyinkronkan workspace jarak jauh kembali ke workspace lokal.
- Alat file tetap beroperasi melalui bridge sandbox, tetapi workspace lokal
  tetap menjadi sumber kebenaran di antara giliran.

Paling cocok untuk:

- Anda mengedit file secara lokal di luar OpenClaw dan ingin perubahan tersebut terlihat di
  sandbox secara otomatis.
- Anda ingin sandbox OpenShell berperilaku semirip mungkin dengan backend Docker.
- Anda ingin workspace host mencerminkan penulisan sandbox setelah setiap giliran exec.

Kompromi: biaya sinkronisasi tambahan sebelum dan sesudah setiap exec.

### `remote`

Gunakan `plugins.entries.openshell.config.mode: "remote"` saat Anda ingin
**workspace OpenShell menjadi yang kanonis**.

Perilaku:

- Saat sandbox pertama kali dibuat, OpenClaw melakukan seed workspace jarak jauh dari
  workspace lokal satu kali.
- Setelah itu, `exec`, `read`, `write`, `edit`, dan `apply_patch` beroperasi
  langsung terhadap workspace OpenShell jarak jauh.
- OpenClaw **tidak** menyinkronkan perubahan jarak jauh kembali ke workspace lokal.
- Pembacaan media saat prompt tetap berfungsi karena alat file dan media membaca melalui
  bridge sandbox.

Paling cocok untuk:

- Sandbox seharusnya hidup terutama di sisi jarak jauh.
- Anda menginginkan overhead sinkronisasi per giliran yang lebih rendah.
- Anda tidak ingin edit lokal host diam-diam menimpa status sandbox jarak jauh.

Penting: jika Anda mengedit file di host di luar OpenClaw setelah seed awal,
sandbox jarak jauh **tidak** melihat perubahan tersebut. Gunakan
`openclaw sandbox recreate` untuk melakukan seed ulang.

### Memilih mode

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **Workspace kanonis**    | Host lokal                 | OpenShell jarak jauh      |
| **Arah sinkronisasi**    | Dua arah (setiap exec)     | Seed satu kali            |
| **Overhead per giliran** | Lebih tinggi (unggah + unduh) | Lebih rendah (operasi jarak jauh langsung) |
| **Edit lokal terlihat?** | Ya, pada exec berikutnya   | Tidak, sampai recreate    |
| **Paling cocok untuk**   | Alur kerja pengembangan    | Agen jangka panjang, CI   |

## Referensi konfigurasi

Semua config OpenShell berada di bawah `plugins.entries.openshell.config`:

| Kunci                     | Tipe                     | Default       | Deskripsi                                            |
| ------------------------- | ------------------------ | ------------- | ---------------------------------------------------- |
| `mode`                    | `"mirror"` atau `"remote"` | `"mirror"`  | Mode sinkronisasi workspace                          |
| `command`                 | `string`                 | `"openshell"` | Path atau nama CLI `openshell`                       |
| `from`                    | `string`                 | `"openclaw"`  | Sumber sandbox untuk create pertama kali             |
| `gateway`                 | `string`                 | —             | Nama gateway OpenShell (`--gateway`)                 |
| `gatewayEndpoint`         | `string`                 | —             | URL endpoint gateway OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | ID kebijakan OpenShell untuk pembuatan sandbox       |
| `providers`               | `string[]`               | `[]`          | Nama provider yang akan dilampirkan saat sandbox dibuat |
| `gpu`                     | `boolean`                | `false`       | Minta resource GPU                                   |
| `autoProviders`           | `boolean`                | `true`        | Teruskan `--auto-providers` saat create sandbox      |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Workspace writable utama di dalam sandbox            |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Path mount workspace agen (untuk akses baca-saja)    |
| `timeoutSeconds`          | `number`                 | `120`         | Timeout untuk operasi CLI `openshell`                |

Pengaturan tingkat sandbox (`mode`, `scope`, `workspaceAccess`) dikonfigurasi di bawah
`agents.defaults.sandbox` seperti backend lainnya. Lihat
[Sandboxing](/id/gateway/sandboxing) untuk matriks lengkap.

## Contoh

### Penyiapan remote minimal

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### Mode mirror dengan GPU

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### OpenShell per-agen dengan gateway kustom

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## Manajemen lifecycle

Sandbox OpenShell dikelola melalui CLI sandbox normal:

```bash
# Daftar semua runtime sandbox (Docker + OpenShell)
openclaw sandbox list

# Periksa kebijakan efektif
openclaw sandbox explain

# Recreate (menghapus workspace jarak jauh, seed ulang pada penggunaan berikutnya)
openclaw sandbox recreate --all
```

Untuk mode `remote`, **recreate sangat penting**: ini menghapus workspace
jarak jauh kanonis untuk cakupan tersebut. Penggunaan berikutnya melakukan seed workspace jarak jauh baru dari
workspace lokal.

Untuk mode `mirror`, recreate terutama mereset environment eksekusi jarak jauh karena
workspace lokal tetap kanonis.

### Kapan harus recreate

Lakukan recreate setelah mengubah salah satu dari ini:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Hardening keamanan

OpenShell menyematkan fd root workspace dan memeriksa ulang identitas sandbox sebelum setiap
pembacaan, sehingga pertukaran symlink atau workspace yang di-mount ulang tidak dapat mengalihkan pembacaan keluar dari
workspace jarak jauh yang dimaksud.

## Keterbatasan saat ini

- Browser sandbox tidak didukung pada backend OpenShell.
- `sandbox.docker.binds` tidak berlaku untuk OpenShell.
- Pengaturan runtime khusus Docker di bawah `sandbox.docker.*` hanya berlaku untuk backend Docker.

## Cara kerjanya

1. OpenClaw memanggil `openshell sandbox create` (dengan flag `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` sesuai konfigurasi).
2. OpenClaw memanggil `openshell sandbox ssh-config <name>` untuk mendapatkan detail
   koneksi SSH untuk sandbox.
3. Core menulis config SSH ke file sementara dan membuka sesi SSH menggunakan
   bridge filesystem jarak jauh yang sama dengan backend SSH generik.
4. Dalam mode `mirror`: sinkronkan lokal ke jarak jauh sebelum exec, jalankan, sinkronkan kembali setelah exec.
5. Dalam mode `remote`: seed sekali saat create, lalu beroperasi langsung pada
   workspace jarak jauh.

## Terkait

- [Sandboxing](/id/gateway/sandboxing) -- mode, cakupan, dan perbandingan backend
- [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) -- men-debug alat yang diblokir
- [Multi-Agent Sandbox and Tools](/id/tools/multi-agent-sandbox-tools) -- override per-agen
- [Sandbox CLI](/id/cli/sandbox) -- perintah `openclaw sandbox`
