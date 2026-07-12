---
read_when:
    - Menyelesaikan ulang referensi rahasia saat runtime
    - Mengaudit sisa teks biasa dan referensi yang belum terselesaikan
    - Mengonfigurasi SecretRefs dan menerapkan perubahan pembersihan satu arah
summary: Referensi CLI untuk `openclaw secrets` (muat ulang, audit, konfigurasi, terapkan)
title: Rahasia
x-i18n:
    generated_at: "2026-07-12T14:02:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1ac0d0f6e29ae52d9dd03e3333665062ccd961ed22a2b06ca7fa7fde128e177
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

Kelola SecretRef dan pertahankan kondisi snapshot runtime aktif agar tetap sehat.

| Perintah    | Peran                                                                                                                                                                                                 |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | RPC Gateway (`secrets.reload`): menyelesaikan ulang referensi dan mengganti snapshot runtime hanya jika seluruh proses berhasil (tanpa penulisan konfigurasi)                                         |
| `audit`     | Pemindaian hanya-baca pada penyimpanan konfigurasi/autentikasi/model yang dihasilkan dan residu lama untuk teks biasa, referensi yang tidak terselesaikan, dan penyimpangan presedensi (referensi exec dilewati kecuali menggunakan `--allow-exec`) |
| `configure` | Perencana interaktif untuk penyiapan penyedia, pemetaan target, dan pemeriksaan awal (memerlukan TTY)                                                                                                  |
| `apply`     | Menjalankan rencana tersimpan (`--dry-run` hanya memvalidasi dan secara default melewati pemeriksaan exec; mode tulis menolak rencana yang memuat exec kecuali menggunakan `--allow-exec`), lalu membersihkan residu teks biasa yang ditargetkan |

Siklus operator yang disarankan:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Jika rencana Anda menyertakan SecretRef/penyedia `exec`, teruskan `--allow-exec` pada perintah `apply` uji coba dan tulis.

Kode keluar untuk CI/gate:

- `audit --check` mengembalikan `1` jika ada temuan.
- Referensi yang tidak terselesaikan mengembalikan `2` (terlepas dari `--check`).

Terkait: [Pengelolaan Rahasia](/id/gateway/secrets) · [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface) · [Keamanan](/id/gateway/security)

## Muat ulang snapshot runtime

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Menggunakan metode RPC gateway `secrets.reload`. Jika penyelesaian gagal, gateway mempertahankan snapshot terakhir yang diketahui baik dan mengembalikan galat (tanpa aktivasi sebagian). Respons JSON menyertakan `warningCount`.

Opsi: `--url <url>`, `--token <token>`, `--timeout <ms>`, `--json`.

## Audit

Memindai status OpenClaw untuk:

- penyimpanan rahasia dalam teks biasa
- referensi yang tidak terselesaikan
- penyimpangan presedensi (kredensial `auth-profiles.json` membayangi referensi `openclaw.json`)
- residu `agents/*/agent/models.json` yang dihasilkan (nilai `apiKey` penyedia dan header penyedia sensitif)
- residu lama (entri penyimpanan autentikasi lama, pengingat OAuth)

Deteksi header penyedia sensitif didasarkan pada heuristik nama: deteksi ini menandai header yang namanya cocok dengan fragmen autentikasi/kredensial umum (`authorization`, `x-api-key`, `token`, `secret`, `password`, `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Struktur laporan:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- kode temuan: `PLAINTEXT_FOUND`, `REF_UNRESOLVED`, `REF_SHADOWED`, `LEGACY_RESIDUE`

## Konfigurasi (pembantu interaktif)

Buat perubahan penyedia dan SecretRef secara interaktif, jalankan pemeriksaan awal, dan terapkan secara opsional:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Alur: penyiapan penyedia terlebih dahulu (tambah/edit/hapus alias `secrets.providers`), lalu pemetaan kredensial (pilih bidang, tetapkan referensi `{source, provider, id}`), kemudian pemeriksaan awal dan penerapan opsional.

Flag:

- `--providers-only`: hanya konfigurasikan `secrets.providers`, lewati pemetaan kredensial
- `--skip-provider-setup`: lewati penyiapan penyedia, petakan kredensial ke penyedia yang ada
- `--agent <id>`: batasi penemuan target dan penulisan `auth-profiles.json` ke satu penyimpanan agen
- `--allow-exec`: izinkan pemeriksaan exec SecretRef selama pemeriksaan awal/penerapan (dapat menjalankan perintah penyedia)

`--providers-only` dan `--skip-provider-setup` tidak dapat digabungkan.

Catatan:

- Memerlukan TTY interaktif.
- Menargetkan bidang yang memuat rahasia dalam `openclaw.json` serta `auth-profiles.json` untuk cakupan agen yang dipilih; permukaan kanonis yang didukung: [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface).
- Mendukung pembuatan pemetaan `auth-profiles.json` baru secara langsung dalam alur pemilih.
- Menjalankan penyelesaian pemeriksaan awal sebelum penerapan.
- Rencana yang dihasilkan secara default mengaktifkan opsi pembersihan (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`). Penerapan bersifat satu arah untuk nilai teks biasa yang telah dibersihkan.
- Tanpa `--apply`, CLI tetap menampilkan prompt `Terapkan rencana ini sekarang?` setelah pemeriksaan awal.
- Dengan `--apply` (dan tanpa `--yes`), CLI menampilkan prompt konfirmasi tambahan untuk migrasi yang tidak dapat dibatalkan.
- `--json` mencetak rencana + laporan pemeriksaan awal, tetapi tetap memerlukan TTY interaktif.

### Keamanan penyedia exec

Instalasi Homebrew sering menyediakan biner yang ditautkan secara simbolis di bawah `/opt/homebrew/bin/*`. Tetapkan `allowSymlinkCommand: true` hanya jika diperlukan untuk jalur pengelola paket tepercaya, dipasangkan dengan `trustedDirs` (misalnya `["/opt/homebrew"]`). Di Windows, jika verifikasi ACL tidak tersedia untuk jalur penyedia, OpenClaw akan menutup akses secara aman; khusus untuk jalur tepercaya, tetapkan `allowInsecurePath: true` pada penyedia tersebut untuk melewati pemeriksaan keamanan jalur.

## Terapkan rencana tersimpan

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run` memvalidasi pemeriksaan awal tanpa menulis berkas; pemeriksaan exec SecretRef secara default dilewati dalam uji coba. Mode tulis menolak rencana yang memuat SecretRef/penyedia exec kecuali menggunakan `--allow-exec`. Gunakan `--allow-exec` untuk mengizinkan pemeriksaan/eksekusi penyedia exec dalam salah satu mode.

Yang mungkin diperbarui oleh `apply`:

- `openclaw.json` (target SecretRef + penambahan/pembaruan/penghapusan penyedia)
- `auth-profiles.json` (pembersihan target penyedia)
- residu `auth.json` lama
- kunci rahasia yang dikenal dalam `~/.openclaw/.env` yang nilainya telah dimigrasikan

Detail kontrak rencana (jalur target yang diizinkan, aturan validasi, semantik kegagalan): [Kontrak Rencana Penerapan Rahasia](/id/gateway/secrets-plan-contract).

### Mengapa tidak ada cadangan pemulihan

`secrets apply` sengaja tidak menulis cadangan pemulihan yang berisi nilai teks biasa lama. Keamanan berasal dari pemeriksaan awal yang ketat serta penerapan yang hampir atomik, dengan pemulihan dalam memori berdasarkan upaya terbaik jika terjadi kegagalan.

## Contoh

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Jika `audit --check` masih melaporkan temuan teks biasa, perbarui jalur target lain yang dilaporkan lalu jalankan kembali audit.

## Terkait

- [Referensi CLI](/id/cli)
- [Pengelolaan rahasia](/id/gateway/secrets)
- [SecretRef Vault](/plugins/vault)
