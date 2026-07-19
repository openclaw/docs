---
read_when:
    - Menyelesaikan ulang referensi rahasia saat runtime
    - Mengaudit residu teks biasa dan referensi yang belum terselesaikan
    - Mengonfigurasi SecretRefs dan menerapkan perubahan pembersihan satu arah
summary: Referensi CLI untuk `openclaw secrets` (muat ulang, audit, konfigurasi, terapkan)
title: Rahasia
x-i18n:
    generated_at: "2026-07-19T04:53:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 61f6f81e358ca2e6a97ac9498186b32f7a74d16052d226c398dad0030d47211e
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

Kelola SecretRef dan jaga agar snapshot runtime aktif tetap sehat.

| Perintah     | Peran                                                                                                                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | RPC Gateway (`secrets.reload`): menyelesaikan ulang ref dan memublikasikan snapshot runtime yang memperhitungkan pemilik secara atomik (tanpa penulisan konfigurasi); kegagalan pemilik yang memenuhi syarat dapat dipublikasikan sebagai peringatan cold atau stale |
| `audit`     | Pemindaian hanya-baca terhadap penyimpanan konfigurasi/autentikasi/model yang dihasilkan dan residu lama untuk teks biasa, ref yang tidak terselesaikan, dan penyimpangan presedensi (ref exec dilewati kecuali `--allow-exec`)                      |
| `configure` | Perencana interaktif untuk penyiapan penyedia, pemetaan target, dan prapemeriksaan (memerlukan TTY)                                                                                                       |
| `apply`     | Menjalankan rencana tersimpan (`--dry-run` hanya memvalidasi dan secara default melewati pemeriksaan exec; mode tulis menolak rencana yang berisi exec kecuali `--allow-exec`), lalu membersihkan residu teks biasa yang ditargetkan |

Siklus operator yang disarankan:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Jika rencana Anda menyertakan SecretRef/penyedia `exec`, berikan `--allow-exec` pada perintah `apply` simulasi maupun tulis.

Kode keluar untuk CI/gate:

- `audit --check` mengembalikan `1` ketika ada temuan.
- Ref yang tidak terselesaikan mengembalikan `2` (terlepas dari `--check`).

Terkait: [Pengelolaan Secret](/id/gateway/secrets) · [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface) · [Keamanan](/id/gateway/security)

## Muat ulang snapshot runtime

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Menggunakan metode RPC Gateway `secrets.reload`. Pemilik yang sehat dimuat ulang secara independen. Pemilik gagal yang memenuhi syarat menjadi stale hanya ketika identitas ref, definisi penyedia, dan kontrak lengkap pemilik yang bukan rahasia tetap tidak berubah; kegagalan baru atau yang berubah menjadi cold. Aktivasi terdegradasi ini berhasil dan melaporkan `warningCount`. Kegagalan ketat atau yang tidak terpetakan mengembalikan galat dan mempertahankan snapshot yang sebelumnya aktif.

Opsi: `--url <url>`, `--token <token>`, `--timeout <ms>`, `--json`.

## Audit

Memindai status OpenClaw untuk:

- penyimpanan rahasia dalam teks biasa
- ref yang tidak terselesaikan
- penyimpangan presedensi (kredensial `auth-profiles.json` membayangi ref `openclaw.json`)
- residu `agents/*/agent/models.json` yang dihasilkan (nilai `apiKey` penyedia dan header penyedia sensitif)
- residu lama (entri penyimpanan autentikasi lama, pengingat OAuth)

Pemindaian `.env` mencakup direktori status efektif dan direktori yang berisi konfigurasi aktif. Ketika kedua jalur merujuk ke berkas yang sama, berkas tersebut dipindai sekali.

Deteksi header penyedia sensitif didasarkan pada heuristik nama: deteksi ini menandai header yang namanya cocok dengan fragmen autentikasi/kredensial umum (`authorization`, `x-api-key`, `token`, `secret`, `password`, `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Bentuk laporan:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- kode temuan: `PLAINTEXT_FOUND`, `REF_UNRESOLVED`, `REF_SHADOWED`, `LEGACY_RESIDUE`

## Konfigurasi (pembantu interaktif)

Susun perubahan penyedia dan SecretRef secara interaktif, jalankan prapemeriksaan, dan terapkan secara opsional:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Alur: penyiapan penyedia terlebih dahulu (tambahkan/edit/hapus alias `secrets.providers`), kemudian pemetaan kredensial (pilih kolom, tetapkan ref `{source, provider, id}`), lalu prapemeriksaan dan penerapan opsional.

Flag:

- `--providers-only`: konfigurasikan hanya `secrets.providers`, lewati pemetaan kredensial
- `--skip-provider-setup`: lewati penyiapan penyedia, petakan kredensial ke penyedia yang ada
- `--agent <id>`: batasi penemuan target dan penulisan `auth-profiles.json` ke satu penyimpanan agen
- `--allow-exec`: izinkan pemeriksaan SecretRef exec selama prapemeriksaan/penerapan (dapat menjalankan perintah penyedia)

`--providers-only` dan `--skip-provider-setup` tidak dapat digabungkan.

Catatan:

- Memerlukan TTY interaktif.
- Menargetkan kolom yang memuat rahasia di `openclaw.json` ditambah `auth-profiles.json` untuk cakupan agen yang dipilih; permukaan kanonis yang didukung: [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface).
- Mendukung pembuatan pemetaan `auth-profiles.json` baru secara langsung dalam alur pemilih.
- Menjalankan resolusi prapemeriksaan sebelum penerapan.
- Rencana yang dihasilkan secara default mengaktifkan opsi pembersihan (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`). Penerapan bersifat satu arah untuk nilai teks biasa yang telah dibersihkan.
- `--plan-out` menolak membuat rencana yang bentuk serialisasi UTF-8-nya melebihi 16 MiB (16,777,216 byte), sesuai dengan batas masukan `apply --from`.
- Tanpa `--apply`, CLI tetap meminta `Apply this plan now?` setelah prapemeriksaan.
- Dengan `--apply` (dan tanpa `--yes`), CLI meminta konfirmasi tambahan untuk migrasi yang tidak dapat dibatalkan.
- `--json` mencetak rencana + laporan prapemeriksaan, tetapi tetap memerlukan TTY interaktif.

### Keamanan penyedia exec

Instalasi Homebrew sering mengekspos biner yang ditautkan secara simbolis di bawah `/opt/homebrew/bin/*`. Tetapkan `allowSymlinkCommand: true` hanya ketika diperlukan untuk jalur pengelola paket tepercaya, dipasangkan dengan `trustedDirs` (misalnya `["/opt/homebrew"]`). Di Windows, jika verifikasi ACL tidak tersedia untuk jalur penyedia, OpenClaw gagal dalam keadaan tertutup; hanya untuk jalur tepercaya, tetapkan `allowInsecurePath: true` pada penyedia tersebut untuk melewati pemeriksaan keamanan jalur.

## Terapkan rencana tersimpan

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run` memvalidasi prapemeriksaan tanpa menulis berkas; pemeriksaan SecretRef exec dilewati secara default dalam simulasi. Mode tulis menolak rencana yang berisi SecretRef/penyedia exec kecuali `--allow-exec`. Gunakan `--allow-exec` untuk mengizinkan pemeriksaan/eksekusi penyedia exec dalam salah satu mode.

`--from` harus menunjuk ke berkas biasa yang ukurannya tidak lebih dari 16 MiB (16,777,216 byte). Batas byte berlaku untuk berkas terserialisasi lengkap, termasuk spasi kosong.

Hal yang dapat diperbarui oleh `apply`:

- `openclaw.json` (target SecretRef + penambahan/pembaruan atau penghapusan penyedia)
- `auth-profiles.json` (pembersihan target penyedia)
- residu `auth.json` lama
- berkas `.env` di direktori status efektif dan konfigurasi aktif, untuk kunci rahasia yang diketahui dan nilainya telah dimigrasikan

Detail kontrak rencana (jalur target yang diizinkan, aturan validasi, semantik kegagalan): [Kontrak Rencana Penerapan Secret](/id/gateway/secrets-plan-contract).

### Alasan tidak ada cadangan rollback

`secrets apply` sengaja tidak menulis cadangan rollback yang berisi nilai teks biasa lama. Keamanan berasal dari prapemeriksaan ketat serta penerapan yang mendekati atomik, dengan pemulihan dalam memori secara upaya terbaik jika terjadi kegagalan.

## Contoh

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Jika `audit --check` masih melaporkan temuan teks biasa, perbarui jalur target tersisa yang dilaporkan dan jalankan ulang audit.

## Terkait

- [Referensi CLI](/id/cli)
- [Pengelolaan secret](/id/gateway/secrets)
- [SecretRef Vault](/id/plugins/vault)
