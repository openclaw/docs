---
read_when:
    - Anda menginginkan sandbox yang dikelola di cloud alih-alih Docker lokal
    - Anda sedang menyiapkan plugin OpenShell
    - Anda perlu memilih antara mode ruang kerja cermin dan jarak jauh
summary: Gunakan OpenShell sebagai backend sandbox terkelola untuk agen OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-07-12T14:15:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf5c33912bd0db759a01cf58ea26712a8ada68c0804bf16f69f1f7cdd496828c
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell adalah backend sandbox terkelola: alih-alih menjalankan kontainer Docker
secara lokal, OpenClaw mendelegasikan siklus hidup sandbox ke CLI `openshell`, yang
menyediakan lingkungan jarak jauh dan menjalankan perintah melalui SSH.

Plugin ini menggunakan kembali transportasi SSH dan jembatan sistem berkas jarak jauh
yang sama dengan [backend SSH](/id/gateway/sandboxing#ssh-backend) generik, serta menambahkan
siklus hidup OpenShell (`sandbox create/get/delete/ssh-config`) dan mode sinkronisasi
ruang kerja `mirror` opsional.

## Prasyarat

- Plugin OpenShell terinstal (`openclaw plugins install @openclaw/openshell-sandbox`)
- CLI `openshell` tersedia di `PATH` (atau jalur khusus melalui
  `plugins.entries.openshell.config.command`)
- Akun OpenShell dengan akses sandbox
- Gateway OpenClaw berjalan di host

## Mulai cepat

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

Mulai ulang Gateway. Pada giliran agen berikutnya, OpenClaw membuat sandbox OpenShell
dan merutekan eksekusi alat melaluinya. Verifikasi dengan:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Mode ruang kerja

Ini adalah keputusan OpenShell yang paling penting.

### mirror (bawaan)

`plugins.entries.openshell.config.mode: "mirror"` mempertahankan **ruang kerja lokal
sebagai sumber kanonis**:

- Sebelum `exec`, OpenClaw menyinkronkan ruang kerja lokal ke dalam sandbox.
- Setelah `exec`, OpenClaw menyinkronkan kembali ruang kerja jarak jauh ke lokal.
- Alat berkas melewati jembatan sandbox, tetapi ruang kerja lokal tetap menjadi sumber kebenaran
  di antara giliran.

Paling cocok untuk alur kerja pengembangan: perubahan lokal di luar OpenClaw akan muncul
pada exec berikutnya, dan perilaku sandbox mendekati backend Docker.

Konsekuensi: biaya unggah + unduh pada setiap giliran exec.

### remote

`mode: "remote"` menjadikan **ruang kerja OpenShell sebagai sumber kanonis**:

- Saat sandbox pertama kali dibuat, OpenClaw mengisi ruang kerja jarak jauh dari ruang kerja lokal
  satu kali.
- Setelah itu, `exec`, `read`, `write`, `edit`, dan `apply_patch` beroperasi
  langsung pada ruang kerja jarak jauh. OpenClaw **tidak** menyinkronkan perubahan jarak jauh
  kembali ke lokal.
- Pembacaan media saat penyusunan prompt tetap berfungsi (alat berkas/media membaca melalui
  jembatan sandbox).

Paling cocok untuk agen yang berjalan lama dan CI: overhead per giliran lebih rendah, dan
perubahan lokal pada host tidak dapat menimpa keadaan jarak jauh secara diam-diam.

<Warning>
Perubahan berkas pada host di luar OpenClaw setelah pengisian awal tidak terlihat oleh sandbox jarak jauh. Jalankan `openclaw sandbox recreate` untuk mengisi ulang.
</Warning>

### Memilih mode

|                          | `mirror`                         | `remote`                        |
| ------------------------ | -------------------------------- | ------------------------------- |
| **Ruang kerja kanonis**  | Host lokal                       | OpenShell jarak jauh            |
| **Arah sinkronisasi**    | Dua arah (setiap exec)           | Pengisian satu kali             |
| **Overhead per giliran** | Lebih tinggi (unggah + unduh)    | Lebih rendah (operasi langsung) |
| **Perubahan lokal terlihat?** | Ya, pada exec berikutnya    | Tidak, hingga dibuat ulang      |
| **Paling cocok untuk**   | Alur kerja pengembangan          | Agen yang berjalan lama, CI     |

## Referensi konfigurasi

Semua konfigurasi OpenShell berada di bawah `plugins.entries.openshell.config`:

| Kunci                     | Tipe                     | Bawaan        | Deskripsi                                                                              |
| ------------------------- | ------------------------ | ------------- | -------------------------------------------------------------------------------------- |
| `mode`                    | `"mirror"` atau `"remote"` | `"mirror"`  | Mode sinkronisasi ruang kerja                                                          |
| `command`                 | `string`                 | `"openshell"` | Jalur atau nama CLI `openshell`                                                        |
| `from`                    | `string`                 | `"openclaw"`  | Sumber sandbox untuk pembuatan pertama kali                                            |
| `gateway`                 | `string`                 | tidak diatur  | Nama Gateway OpenShell (`--gateway` tingkat teratas)                                   |
| `gatewayEndpoint`         | `string`                 | tidak diatur  | Titik akhir Gateway OpenShell (`--gateway-endpoint` tingkat teratas)                   |
| `policy`                  | `string`                 | tidak diatur  | ID kebijakan OpenShell untuk pembuatan sandbox                                         |
| `providers`               | `string[]`               | `[]`          | Nama penyedia yang disertakan saat pembuatan sandbox (dihapus duplikatnya, satu flag `--provider` per entri) |
| `gpu`                     | `boolean`                | `false`       | Meminta sumber daya GPU (`--gpu`)                                                      |
| `autoProviders`           | `boolean`                | `true`        | Meneruskan `--auto-providers` (atau `--no-auto-providers` jika false) selama pembuatan |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Ruang kerja utama yang dapat ditulis di dalam sandbox                                  |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Jalur pemasangan ruang kerja agen (hanya-baca jika akses ruang kerja bukan `rw`)       |
| `timeoutSeconds`          | `number`                 | `120`         | Batas waktu untuk operasi CLI `openshell`                                              |

`remoteWorkspaceDir` dan `remoteAgentWorkspaceDir` harus berupa jalur absolut dan
tetap berada di bawah akar terkelola `/sandbox` atau `/agent`; jalur absolut lainnya
ditolak.

Pengaturan tingkat sandbox (`mode`, `scope`, `workspaceAccess`) berada di bawah
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

### OpenShell per agen dengan Gateway khusus

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

## Pengelolaan siklus hidup

```bash
# Cantumkan semua runtime sandbox (Docker + OpenShell)
openclaw sandbox list

# Periksa kebijakan yang berlaku
openclaw sandbox explain

# Buat ulang (menghapus ruang kerja jarak jauh, diisi ulang saat penggunaan berikutnya)
openclaw sandbox recreate --all
```

Untuk mode `remote`, pembuatan ulang sangat penting: tindakan ini menghapus ruang kerja
jarak jauh kanonis untuk cakupan tersebut, dan penggunaan berikutnya akan mengisi ruang kerja
baru dari ruang kerja lokal. Untuk mode `mirror`, pembuatan ulang terutama mengatur ulang
lingkungan eksekusi jarak jauh karena ruang kerja lokal tetap kanonis.

Buat ulang setelah mengubah salah satu dari:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

## Penguatan keamanan

Jembatan sistem berkas mode mirror menyematkan akar ruang kerja lokal dan memeriksa ulang
jalur kanonis (melalui realpath) sebelum setiap operasi baca, tulis, mkdir, hapus, dan
ganti nama, serta menolak symlink di tengah jalur. Pertukaran symlink atau ruang kerja
yang dipasang ulang tidak dapat mengalihkan akses berkas ke luar pohon yang dicerminkan.

## Batasan saat ini

- Browser sandbox tidak didukung pada backend OpenShell.
- `sandbox.docker.binds` tidak berlaku untuk OpenShell; pembuatan sandbox gagal
  jika bind dikonfigurasi.
- Opsi runtime khusus Docker di bawah `sandbox.docker.*` (selain `env`)
  hanya berlaku untuk backend Docker.

## Cara kerjanya

1. OpenClaw menjalankan `sandbox get` untuk nama sandbox (dengan
   `--gateway`/`--gateway-endpoint` yang dikonfigurasi); jika gagal, OpenClaw membuatnya dengan
   `sandbox create`, meneruskan `--name`, `--from`, `--policy` jika diatur, `--gpu`
   jika diaktifkan, `--auto-providers`/`--no-auto-providers`, dan satu flag
   `--provider` untuk setiap penyedia yang dikonfigurasi.
2. OpenClaw menjalankan `sandbox ssh-config` untuk nama sandbox guna mengambil
   detail koneksi SSH.
3. Inti menulis konfigurasi SSH ke berkas sementara dan membuka sesi SSH melalui
   jembatan sistem berkas jarak jauh yang sama dengan backend SSH generik.
4. Dalam mode `mirror`: sinkronkan lokal ke jarak jauh sebelum exec, jalankan, lalu sinkronkan kembali setelahnya.
5. Dalam mode `remote`: isi satu kali saat pembuatan, lalu operasikan langsung pada ruang kerja
   jarak jauh.

## Terkait

- [Sandboxing](/id/gateway/sandboxing) - mode, cakupan, dan perbandingan backend
- [Sandbox vs Kebijakan Alat vs Ditingkatkan](/id/gateway/sandbox-vs-tool-policy-vs-elevated) - men-debug alat yang diblokir
- [Sandbox dan Alat Multi-Agen](/id/tools/multi-agent-sandbox-tools) - penggantian khusus per agen
- [CLI Sandbox](/id/cli/sandbox) - perintah `openclaw sandbox`
