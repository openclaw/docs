---
read_when:
    - Menyelesaikan ulang referensi secret saat runtime
    - Mengaudit residu plaintext dan referensi yang belum terselesaikan
    - Mengonfigurasi SecretRefs dan menerapkan perubahan scrub satu arah
summary: Referensi CLI untuk `openclaw secrets` (reload, audit, configure, apply)
title: secrets
x-i18n:
    generated_at: "2026-04-05T13:49:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: f436ba089d752edb766c0a3ce746ee6bca1097b22c9b30e3d9715cb0bb50bf47
    source_path: cli/secrets.md
    workflow: 15
---

# `openclaw secrets`

Gunakan `openclaw secrets` untuk mengelola SecretRefs dan menjaga snapshot runtime aktif tetap sehat.

Peran perintah:

- `reload`: gateway RPC (`secrets.reload`) yang menyelesaikan ulang referensi dan menukar snapshot runtime hanya jika seluruh proses berhasil (tanpa penulisan konfigurasi).
- `audit`: pemindaian baca-saja atas penyimpanan configuration/auth/generated-model dan residu lama untuk plaintext, referensi yang belum terselesaikan, dan drift precedence (referensi exec dilewati kecuali `--allow-exec` diatur).
- `configure`: perencana interaktif untuk penyiapan provider, pemetaan target, dan preflight (memerlukan TTY).
- `apply`: menjalankan rencana yang disimpan (`--dry-run` hanya untuk validasi; dry-run melewati pemeriksaan exec secara default, dan mode tulis menolak rencana yang berisi exec kecuali `--allow-exec` diatur), lalu melakukan scrub pada residu plaintext yang ditargetkan.

Loop operator yang direkomendasikan:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Jika rencana Anda mencakup `exec` SecretRefs/providers, berikan `--allow-exec` pada perintah apply dry-run dan mode tulis.

Catatan exit code untuk CI/gate:

- `audit --check` mengembalikan `1` jika ada temuan.
- referensi yang belum terselesaikan mengembalikan `2`.

Terkait:

- Panduan secrets: [Secrets Management](/gateway/secrets)
- Permukaan kredensial: [SecretRef Credential Surface](/reference/secretref-credential-surface)
- Panduan keamanan: [Security](/gateway/security)

## Reload snapshot runtime

Selesaikan ulang referensi secret dan tukar snapshot runtime secara atomik.

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Catatan:

- Menggunakan metode gateway RPC `secrets.reload`.
- Jika penyelesaian gagal, gateway mempertahankan snapshot baik-terakhir-yang-diketahui dan mengembalikan error (tanpa aktivasi parsial).
- Respons JSON mencakup `warningCount`.

Opsi:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--json`

## Audit

Pindai status OpenClaw untuk:

- penyimpanan secret plaintext
- referensi yang belum terselesaikan
- drift precedence (kredensial `auth-profiles.json` yang membayangi referensi `openclaw.json`)
- residu `agents/*/agent/models.json` yang dihasilkan (nilai `apiKey` provider dan header provider sensitif)
- residu lama (entri penyimpanan auth lama, pengingat OAuth)

Catatan residu header:

- Deteksi header provider sensitif didasarkan pada heuristik nama (nama dan fragmen header auth/kredensial yang umum seperti `authorization`, `x-api-key`, `token`, `secret`, `password`, dan `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Perilaku keluar:

- `--check` keluar dengan kode non-zero jika ada temuan.
- referensi yang belum terselesaikan keluar dengan kode non-zero prioritas lebih tinggi.

Sorotan bentuk laporan:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- kode temuan:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## Configure (helper interaktif)

Bangun perubahan provider dan SecretRef secara interaktif, jalankan preflight, dan secara opsional terapkan:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Alur:

- Penyiapan provider terlebih dahulu (`add/edit/remove` untuk alias `secrets.providers`).
- Pemetaan kredensial berikutnya (pilih field dan tetapkan referensi `{source, provider, id}`).
- Preflight dan apply opsional terakhir.

Flag:

- `--providers-only`: konfigurasikan hanya `secrets.providers`, lewati pemetaan kredensial.
- `--skip-provider-setup`: lewati penyiapan provider dan petakan kredensial ke provider yang ada.
- `--agent <id>`: cakup penemuan target `auth-profiles.json` dan penulisan ke satu penyimpanan agen.
- `--allow-exec`: izinkan pemeriksaan exec SecretRef selama preflight/apply (dapat mengeksekusi perintah provider).

Catatan:

- Memerlukan TTY interaktif.
- Anda tidak dapat menggabungkan `--providers-only` dengan `--skip-provider-setup`.
- `configure` menargetkan field yang mengandung secret di `openclaw.json` serta `auth-profiles.json` untuk cakupan agen yang dipilih.
- `configure` mendukung pembuatan pemetaan `auth-profiles.json` baru langsung di alur picker.
- Permukaan yang didukung secara kanonis: [SecretRef Credential Surface](/reference/secretref-credential-surface).
- Perintah ini melakukan penyelesaian preflight sebelum apply.
- Jika preflight/apply mencakup referensi exec, tetap atur `--allow-exec` untuk kedua langkah.
- Rencana yang dihasilkan secara default menggunakan opsi scrub (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson` semuanya diaktifkan).
- Jalur apply bersifat satu arah untuk nilai plaintext yang telah di-scrub.
- Tanpa `--apply`, CLI tetap menampilkan prompt `Apply this plan now?` setelah preflight.
- Dengan `--apply` (dan tanpa `--yes`), CLI menampilkan prompt konfirmasi tambahan yang tidak dapat dibatalkan.
- `--json` mencetak rencana + laporan preflight, tetapi perintah ini tetap memerlukan TTY interaktif.

Catatan keamanan provider exec:

- Instalasi Homebrew sering mengekspos binary bertautan simbolik di bawah `/opt/homebrew/bin/*`.
- Atur `allowSymlinkCommand: true` hanya bila diperlukan untuk path package manager tepercaya, dan pasangkan dengan `trustedDirs` (misalnya `["/opt/homebrew"]`).
- Di Windows, jika verifikasi ACL tidak tersedia untuk path provider, OpenClaw gagal secara tertutup. Hanya untuk path tepercaya, atur `allowInsecurePath: true` pada provider tersebut untuk melewati pemeriksaan keamanan path.

## Terapkan rencana yang disimpan

Terapkan atau lakukan preflight pada rencana yang dibuat sebelumnya:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

Perilaku exec:

- `--dry-run` memvalidasi preflight tanpa menulis file.
- pemeriksaan exec SecretRef dilewati secara default dalam dry-run.
- mode tulis menolak rencana yang mengandung exec SecretRefs/providers kecuali `--allow-exec` diatur.
- Gunakan `--allow-exec` untuk memilih ikut serta dalam pemeriksaan/eksekusi provider exec di kedua mode.

Detail kontrak rencana (path target yang diizinkan, aturan validasi, dan semantik kegagalan):

- [Secrets Apply Plan Contract](/gateway/secrets-plan-contract)

Yang dapat diperbarui oleh `apply`:

- `openclaw.json` (target SecretRef + upsert/delete provider)
- `auth-profiles.json` (scrub target provider)
- residu `auth.json` lama
- `~/.openclaw/.env` untuk kunci secret yang dikenal yang nilainya telah dimigrasikan

## Mengapa tidak ada backup rollback

`secrets apply` sengaja tidak menulis backup rollback yang berisi nilai plaintext lama.

Keamanan berasal dari preflight yang ketat + apply yang nyaris atomik dengan pemulihan dalam memori upaya-terbaik saat terjadi kegagalan.

## Contoh

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Jika `audit --check` masih melaporkan temuan plaintext, perbarui path target yang tersisa yang dilaporkan lalu jalankan ulang audit.
