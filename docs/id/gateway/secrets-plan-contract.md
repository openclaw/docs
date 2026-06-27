---
read_when:
    - Membuat atau meninjau rencana `openclaw secrets apply`
    - Men-debug kesalahan `Invalid plan target path`
    - Memahami jenis target dan perilaku validasi jalur
summary: 'Kontrak untuk rencana `secrets apply`: validasi target, pencocokan jalur, dan cakupan target `auth-profiles.json`'
title: Kontrak rencana penerapan rahasia
x-i18n:
    generated_at: "2026-06-27T17:33:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03f0ca9b433553a2f6d86d01b8c227a24b6f53ef7034a94bd648fbf04c81f13e
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

Halaman ini mendefinisikan kontrak ketat yang diberlakukan oleh `openclaw secrets apply`.

Jika sebuah target tidak cocok dengan aturan ini, apply gagal sebelum memutasi konfigurasi.

## Bentuk file rencana

`openclaw secrets apply --from <plan.json>` mengharapkan array `targets` berisi target rencana:

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

## Upsert dan penghapusan penyedia

Rencana juga dapat menyertakan dua field tingkat atas opsional yang memutasi peta
`secrets.providers` bersama penulisan per target:

- `providerUpserts` — objek yang dikunci berdasarkan alias penyedia. Setiap nilai adalah
  definisi penyedia (bentuk yang sama yang diterima di bawah
  `secrets.providers.<alias>` dalam `openclaw.json`, misalnya penyedia `exec` atau `file`).
- `providerDeletes` — array alias penyedia yang akan dihapus.

`providerUpserts` berjalan sebelum `targets`, sehingga `target.ref.provider` dapat
mereferensikan alias penyedia yang diperkenalkan oleh rencana yang sama dalam
`providerUpserts`. Tanpa ini, rencana yang mereferensikan alias yang belum
dikonfigurasi dalam `openclaw.json` gagal dengan `provider "<alias>" is not
configured`.

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

Penyedia exec yang diperkenalkan melalui `providerUpserts` tetap tunduk pada
aturan persetujuan exec dalam [Perilaku persetujuan penyedia exec](#exec-provider-consent-behavior):
rencana yang berisi penyedia exec memerlukan `--allow-exec` dalam mode tulis.

## Cakupan target yang didukung

Target rencana diterima untuk jalur kredensial yang didukung dalam:

- [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface)

## Perilaku jenis target

Aturan umum:

- `target.type` harus dikenali dan harus cocok dengan bentuk `target.path` yang dinormalisasi.

Alias kompatibilitas tetap diterima untuk rencana yang sudah ada:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Aturan validasi jalur

Setiap target divalidasi dengan semua aturan berikut:

- `type` harus berupa jenis target yang dikenali.
- `path` harus berupa jalur titik yang tidak kosong.
- `pathSegments` dapat dihilangkan. Jika disediakan, nilainya harus dinormalisasi menjadi jalur yang persis sama dengan `path`.
- Segmen terlarang ditolak: `__proto__`, `prototype`, `constructor`.
- Jalur yang dinormalisasi harus cocok dengan bentuk jalur terdaftar untuk jenis target.
- Jika `providerId` atau `accountId` diatur, nilainya harus cocok dengan id yang dikodekan dalam jalur.
- Target `auth-profiles.json` memerlukan `agentId`.
- Saat membuat pemetaan `auth-profiles.json` baru, sertakan `authProfileProvider`.

## Perilaku kegagalan

Jika sebuah target gagal validasi, apply keluar dengan error seperti:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Tidak ada penulisan yang dikomit untuk rencana yang tidak valid.

## Perilaku persetujuan penyedia exec

- `--dry-run` melewati pemeriksaan exec SecretRef secara default.
- Rencana yang berisi exec SecretRefs/penyedia ditolak dalam mode tulis kecuali `--allow-exec` diatur.
- Saat memvalidasi/menerapkan rencana yang berisi exec, berikan `--allow-exec` dalam perintah dry-run dan tulis.

## Catatan cakupan runtime dan audit

- Entri `auth-profiles.json` yang hanya ref (`keyRef`/`tokenRef`) disertakan dalam resolusi runtime dan cakupan audit.
- `secrets apply` menulis target `openclaw.json` yang didukung, target `auth-profiles.json` yang didukung, dan target scrub opsional.

## Pemeriksaan operator

```bash
# Validate plan without writes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Then apply for real
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# For exec-containing plans, opt in explicitly in both modes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Jika apply gagal dengan pesan jalur target yang tidak valid, buat ulang rencana dengan `openclaw secrets configure` atau perbaiki jalur target ke bentuk yang didukung di atas.

## Dokumen terkait

- [Manajemen Secrets](/id/gateway/secrets)
- [CLI `secrets`](/id/cli/secrets)
- [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface)
- [Referensi Konfigurasi](/id/gateway/configuration-reference)
