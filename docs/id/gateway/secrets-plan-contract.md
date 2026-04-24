---
read_when:
    - Membuat atau meninjau rencana `openclaw secrets apply`
    - Men-debug error `Invalid plan target path`
    - Memahami perilaku validasi jenis target dan path
summary: 'Kontrak untuk rencana `secrets apply`: validasi target, pencocokan path, dan cakupan target `auth-profiles.json`'
title: Kontrak rencana penerapan Secrets
x-i18n:
    generated_at: "2026-04-24T09:09:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80214353a1368b249784aa084c714e043c2d515706357d4ba1f111a3c68d1a84
    source_path: gateway/secrets-plan-contract.md
    workflow: 15
---

Halaman ini mendefinisikan kontrak ketat yang ditegakkan oleh `openclaw secrets apply`.

Jika sebuah target tidak cocok dengan aturan ini, apply gagal sebelum memutasi konfigurasi.

## Bentuk file plan

`openclaw secrets apply --from <plan.json>` mengharapkan array `targets` berisi target plan:

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

## Cakupan target yang didukung

Target plan diterima untuk path kredensial yang didukung di:

- [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface)

## Perilaku jenis target

Aturan umum:

- `target.type` harus dikenali dan harus cocok dengan bentuk `target.path` yang dinormalisasi.

Alias kompatibilitas tetap diterima untuk plan yang sudah ada:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Aturan validasi path

Setiap target divalidasi dengan semua hal berikut:

- `type` harus berupa jenis target yang dikenali.
- `path` harus berupa dot path yang tidak kosong.
- `pathSegments` boleh dihilangkan. Jika diberikan, nilainya harus dinormalisasi ke path yang persis sama dengan `path`.
- Segmen terlarang ditolak: `__proto__`, `prototype`, `constructor`.
- Path yang dinormalisasi harus cocok dengan bentuk path terdaftar untuk jenis target tersebut.
- Jika `providerId` atau `accountId` diatur, nilainya harus cocok dengan id yang dienkode di path.
- Target `auth-profiles.json` memerlukan `agentId`.
- Saat membuat pemetaan `auth-profiles.json` baru, sertakan `authProfileProvider`.

## Perilaku kegagalan

Jika sebuah target gagal validasi, apply keluar dengan error seperti:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Tidak ada penulisan yang dikomit untuk plan yang tidak valid.

## Perilaku persetujuan provider exec

- `--dry-run` melewati pemeriksaan SecretRef exec secara default.
- Plan yang berisi SecretRef/provider exec ditolak dalam mode tulis kecuali `--allow-exec` diatur.
- Saat memvalidasi/menerapkan plan yang berisi exec, berikan `--allow-exec` pada perintah dry-run maupun perintah tulis.

## Catatan cakupan runtime dan audit

- Entri `auth-profiles.json` ref-only (`keyRef`/`tokenRef`) disertakan dalam resolusi runtime dan cakupan audit.
- `secrets apply` menulis target `openclaw.json` yang didukung, target `auth-profiles.json` yang didukung, dan target scrub opsional.

## Pemeriksaan operator

```bash
# Validasi plan tanpa penulisan
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Lalu terapkan sungguhan
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# Untuk plan yang berisi exec, pilih masuk secara eksplisit di kedua mode
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Jika apply gagal dengan pesan invalid target path, buat ulang plan dengan `openclaw secrets configure` atau perbaiki path target ke bentuk yang didukung di atas.

## Dokumen terkait

- [Manajemen Secrets](/id/gateway/secrets)
- [CLI `secrets`](/id/cli/secrets)
- [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface)
- [Referensi Konfigurasi](/id/gateway/configuration-reference)
