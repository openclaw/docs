---
read_when:
    - Perintah CLI ClawHub atau registri OpenClaw gagal
    - Paket tidak dapat diinstal, dipublikasikan, atau diperbarui
summary: Memecahkan masalah masuk, instalasi, publikasi, sinkronisasi, pembaruan, dan API ClawHub.
x-i18n:
    generated_at: "2026-05-12T23:30:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Pemecahan Masalah

## `clawhub login` membuka browser tetapi tidak pernah selesai

CLI memulai server callback lokal berumur pendek selama login browser.

- Pastikan browser Anda dapat menjangkau `http://127.0.0.1:<port>/callback`.
- Periksa firewall lokal, VPN, dan aturan proxy jika callback tidak pernah tiba.
- Di lingkungan tanpa antarmuka grafis, buat token API di antarmuka web ClawHub dan jalankan:

```bash
clawhub login --token clh_...
```

## `whoami` atau `publish` mengembalikan `Unauthorized` (401)

- Masuk lagi dengan `clawhub login`.
- Jika Anda menggunakan jalur konfigurasi khusus, pastikan `CLAWHUB_CONFIG_PATH` mengarah ke
  berkas yang berisi token Anda saat ini.
- Jika Anda menggunakan token API, pastikan token tersebut tidak dicabut di antarmuka web.

## Pencarian atau instalasi mengembalikan `Rate limit exceeded` (429)

Baca informasi percobaan ulang dalam respons:

- `Retry-After`: detik yang harus ditunggu sebelum mencoba ulang.
- `RateLimit-Remaining` dan `RateLimit-Limit`: kuota Anda saat ini.
- `RateLimit-Reset` atau `X-RateLimit-Reset`: waktu reset.

Jika banyak pengguna berbagi satu IP keluar, batas IP anonim dapat tercapai meskipun setiap
orang hanya mengirim beberapa permintaan. Masuk jika memungkinkan dan coba lagi setelah
penundaan yang dilaporkan.

## Pencarian atau instalasi gagal di balik proxy

CLI mengikuti variabel proxy standar:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Nama yang didukung mencakup `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy`, dan
`http_proxy`.

## Sebuah keterampilan tidak muncul dalam pencarian

- Periksa slug yang tepat atau halaman pemilik jika Anda mengetahuinya.
- Pastikan rilis bersifat publik dan tidak ditahan oleh pemindaian atau moderasi.
- Jika Anda memiliki keterampilan tersebut, masuk dan periksa:

```bash
clawhub inspect <skill-slug>
```

Diagnostik yang terlihat oleh pemilik dapat menjelaskan status pemindaian, gerbang unggah, atau moderasi.

## Publikasi gagal karena metadata wajib tidak ada

Untuk keterampilan, periksa frontmatter `SKILL.md`. Variabel lingkungan dan
alat yang diperlukan harus dideklarasikan agar pengguna dan pemindai dapat memahami paket.

Untuk plugin, periksa metadata kompatibilitas `package.json`. Publikasi plugin kode
memerlukan bidang kompatibilitas OpenClaw seperti `openclaw.compat.pluginApi` dan
`openclaw.build.openclawVersion`.

Pratinjau payload publikasi terlebih dahulu:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Publikasi gagal dengan kesalahan pemilik GitHub atau sumber

ClawHub menggunakan identitas GitHub dan atribusi sumber untuk menghubungkan paket ke
penerbitnya.

- Pastikan Anda masuk dengan akun GitHub yang memiliki atau dapat memublikasikan
  paket.
- Periksa bahwa URL sumber bersifat publik atau dapat diakses oleh ClawHub.
- Untuk sumber GitHub, gunakan `owner/repo`, `owner/repo@ref`, atau URL GitHub lengkap.

## `sync` mengatakan tidak ada Skills yang ditemukan

`sync` mencari folder yang berisi `SKILL.md` atau `skill.md`.

Arahkan ke root yang ingin Anda pindai:

```bash
clawhub sync --root /path/to/skills
```

Pratinjau terlebih dahulu jika Anda tidak yakin apa yang akan dipublikasikan:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` menolak karena ada perubahan lokal

Berkas lokal tidak cocok dengan versi apa pun yang diketahui ClawHub. Pilih salah satu:

- Pertahankan edit lokal dan lewati pembaruan.
- Timpa dengan versi yang dipublikasikan:

```bash
clawhub update <slug> --force
```

- Publikasikan salinan yang sudah Anda edit sebagai slug atau fork baru.

## Instalasi plugin gagal di OpenClaw

- Gunakan sumber ClawHub eksplisit:

```bash
openclaw plugins install clawhub:<package>
```

- Periksa halaman detail paket untuk status pemindaian dan metadata kompatibilitas.
- Pastikan versi OpenClaw Anda memenuhi rentang kompatibilitas yang dinyatakan
  paket.
- Jika paket disembunyikan, ditahan, atau diblokir, paket mungkin tidak dapat diinstal sampai
  pemilik menyelesaikan masalah tersebut.

## Permintaan API publik gagal

- Patuhi header percobaan ulang `429` dan cache respons daftar/pencarian publik.
- Arahkan pengguna kembali ke daftar ClawHub kanonis.
- Jangan mencerminkan konten tersembunyi, privat, ditahan, atau diblokir moderasi di luar
  permukaan API publik.

Lihat [API HTTP](/id/clawhub/http-api) untuk detail endpoint.
