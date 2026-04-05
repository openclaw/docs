---
read_when:
    - Membuat atau meninjau plan `openclaw secrets apply`
    - Men-debug error `Invalid plan target path`
    - Memahami perilaku validasi tipe target dan path
summary: 'Kontrak untuk plan `secrets apply`: validasi target, pencocokan path, dan cakupan target `auth-profiles.json`'
title: Kontrak Plan Secrets Apply
x-i18n:
    generated_at: "2026-04-05T13:54:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb89a426ca937cf4d745f641b43b330c7fbb1aa9e4359b106ecd28d7a65ca327
    source_path: gateway/secrets-plan-contract.md
    workflow: 15
---

# Kontrak plan secrets apply

Halaman ini mendefinisikan kontrak ketat yang ditegakkan oleh `openclaw secrets apply`.

Jika sebuah target tidak cocok dengan aturan ini, apply gagal sebelum memutasi konfigurasi.

## Bentuk file plan

`openclaw secrets apply --from <plan.json>` mengharapkan array `targets` dari target plan:

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

- [Permukaan Kredensial SecretRef](/reference/secretref-credential-surface)

## Perilaku tipe target

Aturan umum:

- `target.type` harus dikenali dan harus cocok dengan bentuk `target.path` yang dinormalisasi.

Alias kompatibilitas tetap diterima untuk plan yang sudah ada:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Aturan validasi path

Setiap target divalidasi dengan semua hal berikut:

- `type` harus berupa tipe target yang dikenali.
- `path` harus berupa dot path yang tidak kosong.
- `pathSegments` dapat dihilangkan. Jika diberikan, nilainya harus ternormalisasi ke path yang sama persis dengan `path`.
- Segmen terlarang ditolak: `__proto__`, `prototype`, `constructor`.
- Path yang dinormalisasi harus cocok dengan bentuk path terdaftar untuk tipe target.
- Jika `providerId` atau `accountId` disetel, nilainya harus cocok dengan id yang dienkode dalam path.
- Target `auth-profiles.json` memerlukan `agentId`.
- Saat membuat pemetaan `auth-profiles.json` baru, sertakan `authProfileProvider`.

## Perilaku saat gagal

Jika sebuah target gagal divalidasi, apply keluar dengan error seperti:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Tidak ada penulisan yang dikomit untuk plan yang tidak valid.

## Perilaku persetujuan provider exec

- `--dry-run` melewati pemeriksaan exec SecretRef secara default.
- Plan yang berisi exec SecretRef/provider ditolak dalam mode tulis kecuali `--allow-exec` disetel.
- Saat memvalidasi/menerapkan plan yang berisi exec, berikan `--allow-exec` baik pada perintah dry-run maupun perintah tulis.

## Catatan cakupan runtime dan audit

- Entri `auth-profiles.json` khusus ref (`keyRef`/`tokenRef`) disertakan dalam resolusi runtime dan cakupan audit.
- `secrets apply` menulis target `openclaw.json` yang didukung, target `auth-profiles.json` yang didukung, dan target scrub opsional.

## Pemeriksaan operator

```bash
# Validasi plan tanpa menulis
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Lalu terapkan secara nyata
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# Untuk plan yang berisi exec, lakukan opt-in secara eksplisit di kedua mode
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Jika apply gagal dengan pesan invalid target path, buat ulang plan dengan `openclaw secrets configure` atau perbaiki path target ke bentuk yang didukung di atas.

## Dokumen terkait

- [Manajemen Secrets](/gateway/secrets)
- [CLI `secrets`](/cli/secrets)
- [Permukaan Kredensial SecretRef](/reference/secretref-credential-surface)
- [Referensi Konfigurasi](/gateway/configuration-reference)
