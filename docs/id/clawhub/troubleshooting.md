---
read_when:
    - Perintah CLI ClawHub atau registri OpenClaw gagal
    - Paket tidak dapat diinstal, dipublikasikan, atau diperbarui
summary: Memecahkan masalah masuk, instalasi, publikasi, pembaruan, dan API ClawHub.
x-i18n:
    generated_at: "2026-06-28T07:42:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Pemecahan Masalah

## `clawhub login` membuka browser tetapi tidak pernah selesai

CLI memulai server callback lokal berumur pendek selama login browser.

- Pastikan browser Anda dapat menjangkau `http://127.0.0.1:<port>/callback`.
- Periksa firewall lokal, VPN, dan aturan proxy jika callback tidak pernah tiba.
- Di lingkungan headless, buat token API di UI web ClawHub dan jalankan:

```bash
clawhub login --token clh_...
```

## `whoami` atau `publish` mengembalikan `Unauthorized` (401)

- Masuk lagi dengan `clawhub login`.
- Jika Anda menggunakan jalur konfigurasi khusus, pastikan `CLAWHUB_CONFIG_PATH` mengarah ke
  file yang berisi token Anda saat ini.
- Jika Anda menggunakan token API, pastikan token tersebut tidak dicabut di UI web.

## Pencarian atau instalasi mengembalikan `Rate limit exceeded` (429)

Baca informasi percobaan ulang dalam respons:

- `Retry-After`: detik yang harus ditunggu sebelum mencoba lagi.
- `RateLimit-Limit`: batas yang diterapkan pada permintaan ini.
- `RateLimit-Remaining`: sisa kuota persis Anda ketika header ada. Pada `429`, nilainya `0`.
- `RateLimit-Reset` atau `X-RateLimit-Reset`: waktu reset.

Jika banyak pengguna berbagi satu IP egress, batas IP anonim dapat tercapai meskipun setiap
orang hanya mengirim beberapa permintaan. Masuk jika memungkinkan dan coba lagi setelah
penundaan yang dilaporkan.

## Pencarian atau instalasi gagal di balik proxy

CLI mematuhi variabel proxy standar:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Nama yang didukung mencakup `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy`, dan
`http_proxy`.

## Sebuah skill tidak muncul dalam pencarian

- Periksa slug persisnya atau halaman pemilik jika Anda mengetahuinya.
- Pastikan rilis bersifat publik dan tidak ditahan oleh pemindaian atau moderasi.
- Jika Anda memiliki skill tersebut, masuk dan periksa:

```bash
clawhub inspect @openclaw/demo
```

Diagnostik yang terlihat oleh pemilik dapat menjelaskan status pemindaian, gerbang unggahan, atau moderasi.

## Publikasi gagal karena metadata wajib hilang

Untuk Skills, periksa frontmatter `SKILL.md`. Variabel lingkungan dan
alat wajib harus dinyatakan agar pengguna dan pemindai dapat memahami paket.

Untuk plugins, periksa metadata kompatibilitas `package.json`. Publikasi code-plugin
memerlukan kolom kompatibilitas OpenClaw seperti `openclaw.compat.pluginApi` dan
`openclaw.build.openclawVersion`.

Pratinjau payload publikasi terlebih dahulu:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Publikasi gagal dengan kesalahan pemilik GitHub atau sumber

ClawHub menggunakan identitas GitHub dan atribusi sumber untuk menghubungkan paket dengan
penerbitnya.

- Pastikan Anda masuk dengan akun GitHub yang memiliki atau dapat menerbitkan
  paket tersebut.
- Periksa bahwa URL sumber bersifat publik atau dapat diakses oleh ClawHub.
- Untuk sumber GitHub, gunakan `owner/repo`, `owner/repo@ref`, atau URL GitHub lengkap.

## Publikasi gagal karena namespace diklaim atau dicadangkan

Jika publikasi gagal karena handle pemilik, namespace org, cakupan paket, slug skill,
atau nama paket sudah diklaim atau dicadangkan, pertama pastikan bahwa Anda
menerbitkan dengan pemilik yang cocok dengan namespace. Untuk paket plugin,
nama berscope seperti `@example-org/example-plugin` harus diterbitkan sebagai
pemilik `example-org` yang cocok.

Jika Anda yakin org, proyek, atau merek Anda adalah pemilik namespace yang sah tetapi
Anda tidak dapat mengelola pemilik ClawHub saat ini, buka
[masalah Klaim Org / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
dengan bukti publik yang tidak sensitif. Lihat
[Klaim Org dan Namespace](/id/clawhub/namespace-claims) untuk panduan bukti dan apa yang
harus dijauhkan dari masalah publik.

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
clawhub update @openclaw/demo --force
```

- Publikasikan salinan yang Anda edit sebagai slug atau fork baru.

## Instalasi plugin gagal di OpenClaw

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

- Hormati header percobaan ulang `429` dan cache respons daftar/pencarian publik.
- Tautkan pengguna kembali ke daftar ClawHub kanonis.
- Jangan mencerminkan konten tersembunyi, privat, ditahan, atau diblokir moderasi di luar
  permukaan API publik.

Lihat [API HTTP](/id/clawhub/http-api) untuk detail endpoint.
