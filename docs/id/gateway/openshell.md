---
read_when:
    - Anda menginginkan sandbox yang dikelola cloud alih-alih Docker lokal
    - Anda sedang menyiapkan plugin OpenShell
    - Anda perlu memilih antara mode ruang kerja cermin dan jarak jauh
summary: Gunakan OpenShell sebagai backend sandbox terkelola untuk agen OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-06-27T17:32:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278f7550a3178c30a1b42f80495c55bb9827f7785ce9c4d1ee4a57adb3a5e4b
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell adalah backend sandbox terkelola untuk OpenClaw. Alih-alih menjalankan
kontainer Docker secara lokal, OpenClaw mendelegasikan siklus hidup sandbox ke CLI `openshell`,
yang menyediakan lingkungan jarak jauh dengan eksekusi perintah berbasis SSH.

Plugin OpenShell menggunakan kembali transport SSH inti yang sama dan jembatan sistem berkas
jarak jauh yang sama seperti [backend SSH](/id/gateway/sandboxing#ssh-backend) generik. Plugin ini menambahkan
siklus hidup khusus OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`)
dan mode ruang kerja `mirror` opsional.

## Prasyarat

- Plugin OpenShell terinstal (`openclaw plugins install @openclaw/openshell-sandbox`)
- CLI `openshell` terinstal dan tersedia di `PATH` (atau tetapkan jalur kustom melalui
  `plugins.entries.openshell.config.command`)
- Akun OpenShell dengan akses sandbox
- OpenClaw Gateway berjalan di host

## Mulai cepat

1. Instal dan aktifkan Plugin, lalu tetapkan backend sandbox:

```bash
openclaw plugins install @openclaw/openshell-sandbox
```

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

2. Mulai ulang Gateway. Pada giliran agen berikutnya, OpenClaw membuat sandbox
   OpenShell dan merutekan eksekusi alat melaluinya.

3. Verifikasi:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Mode ruang kerja

Ini adalah keputusan terpenting saat menggunakan OpenShell.

### `mirror`

Gunakan `plugins.entries.openshell.config.mode: "mirror"` saat Anda ingin **ruang kerja lokal
tetap menjadi kanonis**.

Perilaku:

- Sebelum `exec`, OpenClaw menyinkronkan ruang kerja lokal ke sandbox OpenShell.
- Setelah `exec`, OpenClaw menyinkronkan ruang kerja jarak jauh kembali ke ruang kerja lokal.
- Alat berkas tetap beroperasi melalui jembatan sandbox, tetapi ruang kerja lokal
  tetap menjadi sumber kebenaran di antara giliran.

Paling cocok untuk:

- Anda mengedit berkas secara lokal di luar OpenClaw dan ingin perubahan tersebut terlihat di
  sandbox secara otomatis.
- Anda ingin sandbox OpenShell berperilaku semirip mungkin dengan backend Docker.
- Anda ingin ruang kerja host mencerminkan penulisan sandbox setelah setiap giliran exec.

Tradeoff: biaya sinkronisasi tambahan sebelum dan setelah setiap exec.

### `remote`

Gunakan `plugins.entries.openshell.config.mode: "remote"` saat Anda ingin
**ruang kerja OpenShell menjadi kanonis**.

Perilaku:

- Saat sandbox pertama kali dibuat, OpenClaw mengisi ruang kerja jarak jauh dari
  ruang kerja lokal satu kali.
- Setelah itu, `exec`, `read`, `write`, `edit`, dan `apply_patch` beroperasi
  langsung terhadap ruang kerja OpenShell jarak jauh.
- OpenClaw **tidak** menyinkronkan perubahan jarak jauh kembali ke ruang kerja lokal.
- Pembacaan media pada waktu prompt tetap berfungsi karena alat berkas dan media membaca melalui
  jembatan sandbox.

Paling cocok untuk:

- Sandbox seharusnya terutama berada di sisi jarak jauh.
- Anda ingin overhead sinkronisasi per giliran yang lebih rendah.
- Anda tidak ingin pengeditan lokal host diam-diam menimpa status sandbox jarak jauh.

<Warning>
Jika Anda mengedit berkas di host di luar OpenClaw setelah pengisian awal, sandbox jarak jauh **tidak** melihat perubahan tersebut. Gunakan `openclaw sandbox recreate` untuk mengisi ulang.
</Warning>

### Memilih mode

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **Ruang kerja kanonis**  | Host lokal                 | OpenShell jarak jauh      |
| **Arah sinkronisasi**    | Dua arah (setiap exec)     | Pengisian satu kali       |
| **Overhead per giliran** | Lebih tinggi (unggah + unduh) | Lebih rendah (operasi jarak jauh langsung) |
| **Pengeditan lokal terlihat?** | Ya, pada exec berikutnya | Tidak, hingga dibuat ulang |
| **Paling cocok untuk**   | Alur kerja pengembangan    | Agen berjalan lama, CI    |

## Referensi konfigurasi

Semua konfigurasi OpenShell berada di bawah `plugins.entries.openshell.config`:

| Kunci                     | Tipe                     | Default       | Deskripsi                                             |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` or `"remote"` | `"mirror"`    | Mode sinkronisasi ruang kerja                         |
| `command`                 | `string`                 | `"openshell"` | Jalur atau nama CLI `openshell`                       |
| `from`                    | `string`                 | `"openclaw"`  | Sumber sandbox untuk pembuatan pertama kali           |
| `gateway`                 | `string`                 | —             | Nama Gateway OpenShell (`--gateway`)                  |
| `gatewayEndpoint`         | `string`                 | —             | URL endpoint Gateway OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | ID kebijakan OpenShell untuk pembuatan sandbox        |
| `providers`               | `string[]`               | `[]`          | Nama penyedia yang dilampirkan saat sandbox dibuat    |
| `gpu`                     | `boolean`                | `false`       | Meminta sumber daya GPU                               |
| `autoProviders`           | `boolean`                | `true`        | Meneruskan `--auto-providers` selama pembuatan sandbox |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Ruang kerja utama yang dapat ditulis di dalam sandbox |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Jalur mount ruang kerja agen (untuk akses hanya baca) |
| `timeoutSeconds`          | `number`                 | `120`         | Timeout untuk operasi CLI `openshell`                 |

Pengaturan tingkat sandbox (`mode`, `scope`, `workspaceAccess`) dikonfigurasi di bawah
`agents.defaults.sandbox` seperti backend lain. Lihat
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

### OpenShell per agen dengan Gateway kustom

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

## Manajemen siklus hidup

Sandbox OpenShell dikelola melalui CLI sandbox normal:

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

Untuk mode `remote`, **pembuatan ulang sangat penting**: ini menghapus ruang kerja jarak jauh
kanonis untuk cakupan tersebut. Penggunaan berikutnya mengisi ruang kerja jarak jauh baru dari
ruang kerja lokal.

Untuk mode `mirror`, pembuatan ulang terutama mereset lingkungan eksekusi jarak jauh karena
ruang kerja lokal tetap kanonis.

### Kapan membuat ulang

Buat ulang setelah mengubah salah satu dari berikut:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Penguatan keamanan

OpenShell mengunci fd root ruang kerja dan memeriksa ulang identitas sandbox sebelum setiap
pembacaan, sehingga penggantian symlink atau ruang kerja yang di-mount ulang tidak dapat mengalihkan pembacaan keluar dari
ruang kerja jarak jauh yang dimaksud.

## Batasan saat ini

- Browser sandbox tidak didukung pada backend OpenShell.
- `sandbox.docker.binds` tidak berlaku untuk OpenShell.
- Knob runtime khusus Docker di bawah `sandbox.docker.*` hanya berlaku untuk backend Docker.

## Cara kerjanya

1. OpenClaw memanggil `openshell sandbox create` (dengan flag `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` sesuai konfigurasi).
2. OpenClaw memanggil `openshell sandbox ssh-config <name>` untuk mendapatkan detail
   koneksi SSH untuk sandbox.
3. Core menulis konfigurasi SSH ke berkas sementara dan membuka sesi SSH menggunakan
   jembatan sistem berkas jarak jauh yang sama seperti backend SSH generik.
4. Dalam mode `mirror`: sinkronkan lokal ke jarak jauh sebelum exec, jalankan, sinkronkan kembali setelah exec.
5. Dalam mode `remote`: isi sekali saat create, lalu beroperasi langsung pada ruang kerja
   jarak jauh.

## Terkait

- [Sandboxing](/id/gateway/sandboxing) -- mode, cakupan, dan perbandingan backend
- [Sandbox vs Kebijakan Alat vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) -- men-debug alat yang diblokir
- [Sandbox dan Alat Multi-Agen](/id/tools/multi-agent-sandbox-tools) -- override per agen
- [CLI Sandbox](/id/cli/sandbox) -- perintah `openclaw sandbox`
