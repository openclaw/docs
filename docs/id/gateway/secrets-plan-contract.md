---
read_when:
    - Membuat atau meninjau rencana `openclaw secrets apply`
    - Men-debug error `Invalid plan target path`
    - Memahami perilaku validasi jenis target dan jalur
summary: 'Kontrak untuk rencana `secrets apply`: validasi target, pencocokan jalur, dan cakupan target `auth-profiles.json`'
title: Kontrak rencana penerapan rahasia
x-i18n:
    generated_at: "2026-07-19T05:08:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 71ee8afd958646930af4db3bbad08e033ff79da48890a989d72b361abcbda3bb
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

Halaman ini menetapkan kontrak ketat yang diberlakukan oleh `openclaw secrets apply`. Jika target tidak sesuai dengan aturan ini, penerapan gagal sebelum mengubah file apa pun.

## Persyaratan file rencana

`openclaw secrets apply --from <plan.json>` menerima file biasa hingga 16 MiB (16,777,216 byte). Batas ini berlaku untuk keseluruhan file yang diserialkan, termasuk spasi kosong. Direktori, FIFO, file perangkat, dan file yang lebih besar dari batas tersebut ditolak sebelum penguraian JSON atau validasi target.

`openclaw secrets configure --plan-out <plan.json>` memberlakukan batas yang sama pada keluaran berseri UTF-8 sebelum membuat file. Rencana yang ditulis secara manual dan generator rencana eksternal juga harus mempertahankan ukuran file berseri dalam batas ini.

## Struktur file rencana

`openclaw secrets apply --from <plan.json>` mengharapkan array `targets` yang berisi target rencana:

```json5
{
  version: 1,
  protocolVersion: 1,
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.openai.apiKey",
      pathSegments: ["models", "providers", "openai", "apiKey"],
      providerId: "openai",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
    {
      type: "auth-profiles.api_key.key",
      path: "profiles.openai:default.key",
      pathSegments: ["profiles", "openai:default", "key"],
      agentId: "main",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
  ],
}
```

`openclaw secrets configure` menghasilkan rencana dengan struktur ini. Anda juga dapat menulis atau mengeditnya secara manual.

## Upsert dan penghapusan penyedia

Rencana juga dapat menyertakan dua bidang tingkat atas opsional yang mengubah peta `secrets.providers` bersama penulisan per target:

- `providerUpserts` -- objek dengan alias penyedia sebagai kunci. Setiap nilai merupakan definisi penyedia (struktur yang sama dengan yang diterima pada `secrets.providers.<alias>` dalam `openclaw.json`, misalnya penyedia `exec` atau `file`).
- `providerDeletes` -- array alias penyedia yang akan dihapus.

`providerUpserts` dijalankan sebelum `targets`, sehingga `target.ref.provider` dapat merujuk pada alias penyedia yang diperkenalkan oleh rencana yang sama dalam `providerUpserts`. Tanpa urutan ini, rencana yang merujuk pada alias yang belum dikonfigurasi dalam `openclaw.json` akan gagal dengan `provider "<alias>" is not configured`.

```json5
{
  version: 1,
  protocolVersion: 1,
  providerUpserts: {
    onepassword_anthropic: {
      source: "exec",
      command: "/usr/bin/op",
      args: ["read", "op://Vault/Anthropic/credential"],
    },
  },
  providerDeletes: ["legacy_unused_alias"],
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.anthropic.apiKey",
      pathSegments: ["models", "providers", "anthropic", "apiKey"],
      providerId: "anthropic",
      ref: { source: "exec", provider: "onepassword_anthropic", id: "credential" },
    },
  ],
}
```

Penyedia exec yang diperkenalkan melalui `providerUpserts` tetap tunduk pada aturan persetujuan exec dalam [Perilaku persetujuan penyedia exec](#exec-provider-consent-behavior): rencana yang berisi penyedia exec memerlukan `--allow-exec` dalam mode tulis.

## Cakupan target yang didukung

Target rencana diterima untuk jalur kredensial yang didukung dalam [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface).

## Perilaku jenis target

`target.type` harus merupakan jenis target yang dikenali, dan `target.path` yang dinormalisasi harus sesuai dengan struktur jalur yang terdaftar untuk jenis tersebut.

Beberapa jenis target menerima alias kompatibilitas sebagai `target.type` untuk rencana yang sudah ada, selain nama jenis kanonisnya:

| Jenis kanonis                        | Alias yang diterima                             |
| ------------------------------------ | ----------------------------------------------- |
| `models.providers.apiKey`            | `models.providers.*.apiKey`                     |
| `skills.entries.apiKey`              | `skills.entries.*.apiKey`                       |
| `channels.googlechat.serviceAccount` | `channels.googlechat.accounts.*.serviceAccount` |

## Aturan validasi jalur

Setiap target divalidasi dengan semua ketentuan berikut:

- `type` harus merupakan jenis target yang dikenali.
- `path` harus berupa jalur bertitik yang tidak kosong.
- `pathSegments` boleh dihilangkan. Jika disediakan, hasil normalisasinya harus sama persis dengan jalur `path`.
- Segmen terlarang ditolak: `__proto__`, `prototype`, `constructor`.
- Jalur yang dinormalisasi harus sesuai dengan struktur jalur yang terdaftar untuk jenis target tersebut.
- Jika `providerId` atau `accountId` ditetapkan, nilainya harus sesuai dengan ID yang dikodekan dalam jalur.
- Target `auth-profiles.json` memerlukan `agentId`.
- Saat membuat pemetaan `auth-profiles.json` baru, sertakan `authProfileProvider`.

## Perilaku kegagalan

Jika target gagal divalidasi, penerapan berhenti dengan galat seperti:

```text
Jalur target rencana tidak valid untuk models.providers.apiKey: models.providers.openai.baseUrl
```

Tidak ada penulisan yang diterapkan untuk rencana yang tidak valid: resolusi target dan validasi jalur dijalankan sebelum file apa pun disentuh. Secara terpisah, setelah rencana yang valid mulai menulis, penerapan terlebih dahulu membuat snapshot setiap file yang disentuh dan memulihkan snapshot tersebut jika penulisan berikutnya dalam proses yang sama gagal, sehingga penulisan sebagian tidak pernah membuat konfigurasi, profil autentikasi, atau status env tidak sinkron.

## Perilaku persetujuan penyedia exec

- `--dry-run` melewati pemeriksaan SecretRef exec secara default.
- Rencana yang berisi SecretRef/penyedia exec ditolak dalam mode tulis kecuali `--allow-exec` ditetapkan.
- Saat memvalidasi/menerapkan rencana yang berisi exec, teruskan `--allow-exec` pada perintah uji coba maupun tulis.

## Catatan cakupan runtime dan audit

- Entri `auth-profiles.json` yang hanya berisi referensi (`keyRef`/`tokenRef`) disertakan dalam resolusi kredensial runtime dan cakupan audit.
- `secrets apply` menulis target `openclaw.json` yang didukung, target `auth-profiles.json` yang didukung, dan tiga proses pembersihan opsional yang masing-masing aktif secara default: `scrubEnv` (menghapus nilai teks biasa yang telah dimigrasikan dari file `.env` dalam direktori status efektif dan konfigurasi aktif), `scrubAuthProfilesForProviderTargets` (membersihkan residu teks biasa/referensi yang tidak digunakan dalam `auth-profiles.json` untuk penyedia yang baru saja dimigrasikan oleh rencana), dan `scrubLegacyAuthJson` (menghapus entri `api_key` yang telah dimigrasikan dari penyimpanan `auth.json` lama). Tetapkan salah satu dari `options.scrubEnv`, `options.scrubAuthProfilesForProviderTargets`, `options.scrubLegacyAuthJson` ke `false` dalam rencana untuk melewati proses tersebut.

## Pemeriksaan operator

```bash
# Validasi rencana tanpa penulisan
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Kemudian terapkan secara nyata
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# Untuk rencana yang berisi exec, ikut serta secara eksplisit dalam kedua mode
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Jika penerapan gagal dengan pesan jalur target tidak valid, buat ulang rencana dengan `openclaw secrets configure` atau perbaiki jalur target agar sesuai dengan struktur yang didukung di atas.

## Dokumentasi terkait

- [Pengelolaan Rahasia](/id/gateway/secrets)
- [CLI `secrets`](/id/cli/secrets)
- [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface)
- [Referensi Konfigurasi](/id/gateway/configuration-reference)
