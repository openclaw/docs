---
read_when:
    - Anda ingin OpenClaw membaca kunci API dari HashiCorp Vault
    - Anda sedang menyiapkan SecretRefs di mesin lokal atau server
    - Anda perlu mengonfigurasi kredensial penyedia model yang didukung oleh Vault
summary: Gunakan plugin Vault bawaan untuk me-resolve SecretRef dari HashiCorp Vault
title: SecretRefs Vault
x-i18n:
    generated_at: "2026-07-12T14:33:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c1fa4895414e8cf44bb4ada191a7f7aa7b4eeda58f16be04d0c77080b7af96e3
    source_path: plugins/vault.md
    workflow: 16
---

# SecretRef Vault

Plugin Vault bawaan memungkinkan OpenClaw me-resolve SecretRef `exec` dari
HashiCorp Vault saat Gateway dimulai dan dimuat ulang. OpenClaw menyimpan
referensi Vault dalam konfigurasi, mempertahankan nilai yang telah di-resolve dalam snapshot rahasia di memori,
dan tidak menulis kembali kunci API yang telah di-resolve ke `openclaw.json`.

Gunakan ini jika Anda sudah menjalankan Vault atau ingin menyimpan kunci penyedia model di luar
file konfigurasi OpenClaw. Untuk model runtime SecretRef, lihat
[Pengelolaan rahasia](/id/gateway/secrets).

## Sebelum memulai

Anda memerlukan:

- OpenClaw dengan plugin `vault` bawaan yang tersedia
- server Vault yang dapat dijangkau
- autentikasi Vault yang dapat menghasilkan token klien dengan akses baca ke jalur rahasia
  yang perlu di-resolve oleh OpenClaw
- lingkungan yang memulai Gateway harus menyertakan `VAULT_ADDR` dan salah satu dari
  `VAULT_TOKEN`, `OPENCLAW_VAULT_AUTH_METHOD=token_file` dengan `VAULT_TOKEN_FILE`,
  atau login JWT/Kubernetes yang telah dikonfigurasi

Resolver berkomunikasi dengan Vault melalui HTTP dari Node. Gateway tidak memerlukan
CLI Vault untuk me-resolve SecretRef.

Aktifkan plugin bawaan sebelum menjalankan perintah `openclaw vault`:

```bash
openclaw plugins enable vault
```

## Menyimpan kunci penyedia di Vault

OpenClaw secara default menggunakan KV v2 yang dipasang di `secret`, sesuai dengan contoh
server pengembangan Vault. Untuk Vault produksi, atur `OPENCLAW_VAULT_KV_MOUNT` ke jalur pemasangan KV
yang sebenarnya sebelum membuat ID SecretRef. Dengan pengaturan default OpenClaw, ID
SecretRef ini:

```text
providers/openrouter/apiKey
```

membaca bidang Vault berikut:

```text
secret/data/providers/openrouter -> apiKey
```

Salah satu cara untuk membuatnya dengan CLI Vault adalah:

```bash
export OPENROUTER_API_KEY=<openrouter-api-key>
vault kv put secret/providers/openrouter apiKey="$OPENROUTER_API_KEY"
```

Gunakan token klien dengan cakupan terbatas untuk OpenClaw, bukan token root. Untuk tata letak KV v2
default, kebijakan minimal bagi kunci penyedia model terlihat seperti:

```hcl
path "secret/data/providers/*" {
  capabilities = ["read"]
}
```

## Membuat Vault terlihat oleh Gateway

Untuk Gateway lokal tanpa kontainer, ekspor pengaturan Vault di shell yang sama
yang memulai OpenClaw. Metode autentikasi default membaca token klien Vault dari
`VAULT_TOKEN`:

```bash
export VAULT_ADDR=https://vault.example.com
export VAULT_TOKEN=<vault-client-token>
```

Jika Vault Agent menulis file sink token, gunakan autentikasi file token:

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=token_file
export VAULT_TOKEN_FILE=/vault/secrets/token
```

Untuk server Vault yang ditandatangani oleh CA privat, instal CA tersebut di penyimpanan
kepercayaan host dan aktifkan kepercayaan sistem Node:

```bash
export NODE_USE_SYSTEM_CA=1
```

Atau berikan bundel PEM secara langsung:

```bash
export NODE_EXTRA_CA_CERTS=/path/to/vault-ca.pem
```

Variabel-variabel ini harus tersedia saat OpenClaw dimulai. Plugin Vault meneruskannya
ke proses resolver-nya.

Untuk autentikasi JWT noninteraktif, gunakan file JWT beban kerja dan peran Vault bertipe
`jwt`:

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=jwt
export OPENCLAW_VAULT_AUTH_MOUNT=jwt
export OPENCLAW_VAULT_AUTH_ROLE=openclaw
export OPENCLAW_VAULT_JWT_FILE=/var/run/secrets/tokens/vault
```

File JWT harus berupa token beban kerja yang diproyeksikan, seperti token akun layanan Kubernetes
dengan audiens yang diterima oleh peran Vault.
Login peramban OIDC interaktif berguna bagi manusia, tetapi runtime Gateway memerlukan
login JWT noninteraktif atau file token.

Untuk metode autentikasi Kubernetes milik Vault, gunakan `kubernetes`. Ini ditujukan bagi
Gateway yang berjalan sebagai Pod; pemasangan default adalah `kubernetes`, dan file JWT
default adalah jalur token akun layanan standar:

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=kubernetes
export OPENCLAW_VAULT_AUTH_ROLE=openclaw
```

Atur `OPENCLAW_VAULT_AUTH_MOUNT` hanya jika Vault memasang autentikasi Kubernetes di lokasi
selain `auth/kubernetes`. Atur `OPENCLAW_VAULT_JWT_FILE` hanya jika token
akun layanan diproyeksikan ke jalur khusus.

Pengaturan opsional:

```bash
export VAULT_NAMESPACE=<namespace-name>
export OPENCLAW_VAULT_KV_MOUNT=secret
export OPENCLAW_VAULT_KV_VERSION=2
```

Periksa apa yang dapat dilihat oleh shell saat ini:

```bash
openclaw vault status
```

Jika lebih dari satu penyedia rahasia berbasis Vault dikonfigurasi, pilih salah satunya berdasarkan
alias:

```bash
openclaw vault status --provider-alias corp-vault
```

`openclaw vault status` tidak pernah mencetak `VAULT_TOKEN`; perintah ini hanya melaporkan apakah
token, file token, dan file JWT telah diatur.

<Warning>
Jika Gateway berjalan sebagai layanan, LaunchAgent, unit systemd, tugas terjadwal, atau
kontainer, lingkungan runtime tersebut harus menerima variabel Vault yang sama.
Mengatur variabel dalam shell interaktif hanya membuktikan bahwa shell tersebut memilikinya, bukan
Gateway yang sudah berjalan.
</Warning>

## Membuat dan menerapkan rencana SecretRef

Buat rencana yang memetakan kunci API penyedia model OpenRouter ke Vault:

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --openrouter-id providers/openrouter/apiKey
```

Terapkan dan verifikasi rencana:

```bash
openclaw secrets apply --from ./vault-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from ./vault-secrets-plan.json --allow-exec
openclaw secrets audit --check --allow-exec
openclaw secrets reload
```

Gunakan `--allow-exec` karena plugin Vault melakukan resolusi melalui penyedia SecretRef
exec yang dikelola OpenClaw.

Jika Gateway belum berjalan, mulai seperti biasa setelah menerapkan rencana
alih-alih menjalankan `openclaw secrets reload`.

## Mengonfigurasi lebih banyak kunci penyedia

Pintasan bawaan:

```bash
openclaw vault setup --openai-id providers/openai/apiKey
openclaw vault setup --anthropic-id providers/anthropic/apiKey
openclaw vault setup --openrouter-id providers/openrouter/apiKey
```

Beberapa kunci penyedia dalam satu rencana:

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --openai-id providers/openai/apiKey \
  --anthropic-id providers/anthropic/apiKey \
  --openrouter-id providers/openrouter/apiKey
```

Penyedia bawaan tanpa pintasan, atau penyedia model kompatibel OpenAI dan
khusus yang sudah dikonfigurasi, menggunakan `--provider-key`:

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --provider-key local-openai=providers/local-openai/apiKey \
  --provider-key groq=providers/groq/apiKey
```

Setiap `--provider-key <provider=id>` menulis SecretRef ke
`models.providers.<provider>.apiKey`. Untuk penyedia khusus, perintah ini tidak membuat
pengaturan `baseUrl`, `api`, atau `models` milik penyedia; konfigurasikan pengaturan tersebut terlebih dahulu.

Gunakan `--target <path=id>` untuk setiap jalur target SecretRef yang diketahui:

```bash
openclaw vault setup \
  --target channels.telegram.botToken=channels/telegram/botToken \
  --target models.providers.openai.headers.x-api-key=providers/openai/proxyKey \
  --target auth-profiles:main:profiles.openai.key=providers/openai/apiKey
```

Jalur target polos diterapkan ke `openclaw.json`. Gunakan
`auth-profiles:<agentId>:<path>` untuk target `auth-profiles.json` yang sudah ada.
Jalur target harus merupakan target SecretRef OpenClaw yang terdaftar. Perintah penyiapan
tidak membuat rahasia bernama secara sembarang di OpenClaw; Vault tetap menjadi
penyimpanan rahasia, dan OpenClaw hanya menyimpan SecretRef pada bidang konfigurasi yang didukung.

## Format ID SecretRef

ID SecretRef Vault menggunakan konvensi berikut:

```text
<vault-secret-path>/<field>
```

Contoh:

| ID SecretRef                   | Pembacaan Vault KV v2 default      | Bidang yang dikembalikan |
| ------------------------------ | ---------------------------------- | ------------------------ |
| `providers/openrouter/apiKey`  | `secret/data/providers/openrouter` | `apiKey`                 |
| `providers/openai/apiKey`      | `secret/data/providers/openai`     | `apiKey`                 |
| `teams/agent-prod/openrouter`  | `secret/data/teams/agent-prod`     | `openrouter`             |

Bidang Vault yang dikembalikan harus berupa string.

Untuk KV v1, atur:

```bash
export OPENCLAW_VAULT_KV_VERSION=1
```

Kemudian `providers/openrouter/apiKey` membaca:

```text
secret/providers/openrouter -> apiKey
```

## Yang disimpan OpenClaw

Menerapkan rencana penyiapan Vault akan menyimpan penyedia yang dikelola plugin:

```json
{
  "source": "exec",
  "pluginIntegration": {
    "pluginId": "vault",
    "integrationId": "vault"
  }
}
```

Bidang kredensial mengarah ke penyedia tersebut:

```json
{ "source": "exec", "provider": "vault", "id": "providers/openrouter/apiKey" }
```

Nilai yang di-resolve hanya berada dalam snapshot rahasia runtime yang aktif.

## Kontainer dan penerapan terkelola

Gateway dalam kontainer tetap menggunakan plugin dan konfigurasi SecretRef yang sama.
Kontainer harus menerima:

- `VAULT_ADDR`
- satu sumber autentikasi:
  - `VAULT_TOKEN`
  - `OPENCLAW_VAULT_AUTH_METHOD=token_file` ditambah `VAULT_TOKEN_FILE`
  - `OPENCLAW_VAULT_AUTH_METHOD=jwt` ditambah `OPENCLAW_VAULT_AUTH_MOUNT`,
    `OPENCLAW_VAULT_AUTH_ROLE`, dan `OPENCLAW_VAULT_JWT_FILE`
  - `OPENCLAW_VAULT_AUTH_METHOD=kubernetes` ditambah `OPENCLAW_VAULT_AUTH_ROLE`; secara opsional
    timpa `OPENCLAW_VAULT_AUTH_MOUNT` atau `OPENCLAW_VAULT_JWT_FILE`
- `VAULT_NAMESPACE`, `OPENCLAW_VAULT_KV_MOUNT`, dan
  `OPENCLAW_VAULT_KV_VERSION` yang bersifat opsional

Saat menggunakan Kubernetes, utamakan `OPENCLAW_VAULT_AUTH_METHOD=kubernetes`
jika Vault telah mengonfigurasi autentikasi Kubernetes untuk klaster. Gunakan
`OPENCLAW_VAULT_AUTH_METHOD=jwt` hanya jika Vault dikonfigurasi untuk memperlakukan klaster
sebagai penerbit JWT/OIDC generik. Kedua opsi tersebut lebih baik daripada token Vault
berumur panjang dalam Secret Kubernetes. Penerapan sidecar atau injektor Vault Agent dapat
menggunakan `token_file` sebagai gantinya.

Untuk penyiapan Vault multipenyewa, pertahankan perutean penyewa dalam kebijakan Vault dan
konfigurasi penerapan. OpenClaw tidak memerlukan pemasangan, peran, atau jalur tetap: setiap
lingkungan Gateway dapat mengatur `OPENCLAW_VAULT_KV_MOUNT`,
`OPENCLAW_VAULT_AUTH_ROLE`, dan ID SecretRef-nya sendiri. Jika satu Gateway bersama harus me-resolve
pengguna Vault yang berbeda secara bersamaan, gunakan penyedia exec yang dikonfigurasi secara manual
dan membungkus lingkungan autentikasi yang berbeda, atau pisahkan penyewa ke beberapa lingkungan Gateway
dengan lingkungan Vault terpisah.

## Terkait

- [Pengelolaan rahasia](/id/gateway/secrets)
- [`openclaw secrets`](/id/cli/secrets)
- [Inventaris Plugin](/id/plugins/plugin-inventory)
