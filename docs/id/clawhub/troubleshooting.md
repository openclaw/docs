---
read_when:
    - Perintah CLI ClawHub atau registri OpenClaw gagal
    - Paket tidak dapat diinstal, dipublikasikan, atau diperbarui
summary: Pemecahan masalah terkait masuk, instalasi, publikasi, sinkronisasi, pembaruan, dan API ClawHub.
x-i18n:
    generated_at: "2026-05-13T05:33:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Pemecahan Masalah

## `clawhub login` membuka peramban tetapi tidak pernah selesai

CLI memulai server callback lokal berumur pendek selama login lewat peramban.

- Pastikan peramban Anda dapat menjangkau `http://127.0.0.1:<port>/callback`.
- Periksa firewall lokal, VPN, dan aturan proksi jika callback tidak pernah tiba.
- Di lingkungan tanpa antarmuka grafis, buat token API di UI web ClawHub dan jalankan:

```bash
clawhub login --token clh_...
```

## `whoami` atau `publish` mengembalikan `Unauthorized` (401)

- Masuk lagi dengan `clawhub login`.
- Jika Anda menggunakan jalur konfigurasi khusus, pastikan `CLAWHUB_CONFIG_PATH` mengarah ke
  file yang berisi token Anda saat ini.
- Jika Anda menggunakan token API, pastikan token tersebut belum dicabut di UI web.

## Pencarian atau instalasi mengembalikan `Rate limit exceeded` (429)

Baca informasi percobaan ulang dalam respons:

- `Retry-After`: detik yang harus ditunggu sebelum mencoba lagi.
- `RateLimit-Remaining` dan `RateLimit-Limit`: kuota Anda saat ini.
- `RateLimit-Reset` atau `X-RateLimit-Reset`: waktu reset.

Jika banyak pengguna berbagi satu IP keluar, batas IP anonim dapat tercapai meskipun setiap
orang hanya mengirim beberapa permintaan. Masuk jika memungkinkan dan coba lagi setelah
penundaan yang dilaporkan.

## Pencarian atau instalasi gagal di balik proksi

CLI mematuhi variabel proksi standar:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Nama yang didukung mencakup `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy`, dan
`http_proxy`.

## Sebuah skill tidak muncul dalam pencarian

- Periksa slug atau halaman pemilik yang tepat jika Anda mengetahuinya.
- Pastikan rilis bersifat publik dan tidak tertahan oleh pemindaian atau moderasi.
- Jika Anda memiliki skill tersebut, masuk dan periksa:

```bash
clawhub inspect <skill-slug>
```

Diagnostik yang terlihat oleh pemilik dapat menjelaskan status pemindaian, upload-gate, atau moderasi.

## Publikasi gagal karena metadata wajib tidak ada

Untuk Skills, periksa frontmatter `SKILL.md`. Variabel lingkungan dan
alat yang wajib harus dideklarasikan agar pengguna dan pemindai dapat memahami paket.

Untuk Plugin, periksa metadata kompatibilitas `package.json`. Publikasi Plugin kode
memerlukan kolom kompatibilitas OpenClaw seperti `openclaw.compat.pluginApi` dan
`openclaw.build.openclawVersion`.

Pratinjau payload publikasi terlebih dahulu:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Publikasi gagal dengan kesalahan pemilik GitHub atau sumber

ClawHub menggunakan identitas GitHub dan atribusi sumber untuk menghubungkan paket ke
penerbitnya.

- Pastikan Anda masuk dengan akun GitHub yang memiliki atau dapat menerbitkan
  paket tersebut.
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

File lokal tidak cocok dengan versi mana pun yang diketahui ClawHub. Pilih salah satu:

- Pertahankan edit lokal dan lewati pembaruan.
- Timpa dengan versi yang dipublikasikan:

```bash
clawhub update <slug> --force
```

- Publikasikan salinan yang telah Anda edit sebagai slug atau fork baru.

## Instalasi Plugin gagal di OpenClaw

- Gunakan sumber ClawHub eksplisit:

```bash
openclaw plugins install clawhub:<package>
```

- Periksa halaman detail paket untuk status pemindaian dan metadata kompatibilitas.
- Pastikan versi OpenClaw Anda memenuhi rentang kompatibilitas yang diiklankan
  paket tersebut.
- Jika paket disembunyikan, ditahan, atau diblokir, paket mungkin tidak dapat diinstal hingga
  pemilik menyelesaikan masalahnya.

## Permintaan API publik gagal

- Patuhi header percobaan ulang `429` dan cache respons daftar/pencarian publik.
- Tautkan pengguna kembali ke daftar ClawHub kanonis.
- Jangan mencerminkan konten tersembunyi, privat, ditahan, atau diblokir moderasi di luar
  permukaan API publik.

Lihat [API HTTP](/id/clawhub/http-api) untuk detail endpoint.
