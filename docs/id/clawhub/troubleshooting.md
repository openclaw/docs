---
read_when:
    - Perintah CLI ClawHub atau registri OpenClaw gagal
    - Paket tidak dapat diinstal, dipublikasikan, atau diperbarui
summary: Pemecahan masalah masuk, instalasi, publikasi, pembaruan, dan API ClawHub.
x-i18n:
    generated_at: "2026-07-19T05:00:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Pemecahan Masalah

## `clawhub login` membuka browser tetapi tidak pernah selesai

CLI memulai server callback lokal berumur pendek selama proses login melalui browser.

- Pastikan browser Anda dapat menjangkau `http://127.0.0.1:<port>/callback`.
- Periksa aturan firewall lokal, VPN, dan proksi jika callback tidak pernah diterima.
- Di lingkungan headless, buat token API di UI web ClawHub dan jalankan:

```bash
clawhub login --token clh_...
```

## `whoami` atau `publish` mengembalikan `Unauthorized` (401)

- Masuk kembali dengan `clawhub login`.
- Jika Anda menggunakan jalur konfigurasi khusus, pastikan `CLAWHUB_CONFIG_PATH` mengarah ke
  file yang berisi token Anda saat ini.
- Jika Anda menggunakan token API, pastikan token tersebut belum dicabut di UI web.

## Pencarian atau penginstalan mengembalikan `Rate limit exceeded` (429)

Baca informasi percobaan ulang dalam respons:

- `Retry-After`: jumlah detik yang harus ditunggu sebelum mencoba lagi.
- `RateLimit-Limit`: batas yang diterapkan pada permintaan ini.
- `RateLimit-Remaining`: sisa kuota Anda secara tepat saat header tersedia. Pada `429`, nilainya adalah `0`.
- `RateLimit-Reset` atau `X-RateLimit-Reset`: waktu pengaturan ulang.

Jika banyak pengguna berbagi satu IP keluar, batas IP anonim dapat tercapai meskipun setiap
orang hanya mengirim beberapa permintaan. Masuk jika memungkinkan dan coba lagi setelah
waktu tunda yang dilaporkan.

## Pencarian atau penginstalan gagal di balik proksi

CLI mematuhi variabel proksi standar:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Nama yang didukung mencakup `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy`, dan
`http_proxy`.

## Skills tidak muncul dalam pencarian

- Periksa slug yang tepat atau halaman pemilik jika Anda mengetahuinya.
- Pastikan rilis bersifat publik dan tidak ditahan oleh pemindaian atau moderasi.
- Jika Anda memiliki Skills tersebut, masuk dan periksa:

```bash
clawhub inspect @openclaw/demo
```

Diagnostik yang terlihat oleh pemilik dapat menjelaskan status pemindaian, gerbang unggahan, atau moderasi.

## Publikasi gagal karena metadata wajib tidak ada

Untuk Skills, periksa frontmatter `SKILL.md`. Variabel lingkungan dan
alat yang diperlukan harus dideklarasikan agar pengguna dan pemindai dapat memahami paket.

Untuk plugin, periksa metadata kompatibilitas `package.json`. Publikasi plugin kode
memerlukan bidang kompatibilitas OpenClaw seperti `openclaw.compat.pluginApi` dan
`openclaw.build.openclawVersion`.

Pratinjau payload publikasi terlebih dahulu:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Publikasi gagal karena kesalahan pemilik atau sumber GitHub

ClawHub menggunakan identitas GitHub dan atribusi sumber untuk menghubungkan paket dengan
penerbitnya.

- Pastikan Anda masuk dengan akun GitHub yang memiliki atau dapat menerbitkan
  paket tersebut.
- Pastikan URL sumber bersifat publik atau dapat diakses oleh ClawHub.
- Untuk sumber GitHub, gunakan `owner/repo`, `owner/repo@ref`, atau URL GitHub lengkap.

## Publikasi gagal karena namespace telah diklaim atau dicadangkan

Jika publikasi gagal karena handle pemilik, namespace organisasi, cakupan paket, slug Skills,
atau nama paket telah diklaim atau dicadangkan, pastikan terlebih dahulu bahwa Anda
menerbitkan dengan pemilik yang sesuai dengan namespace tersebut. Untuk paket plugin,
nama bercakupan seperti `@example-org/example-plugin` harus diterbitkan sebagai pemilik
`example-org` yang sesuai.

Jika Anda meyakini organisasi, proyek, atau merek Anda adalah pemilik sah namespace tersebut tetapi
Anda tidak dapat mengelola pemilik ClawHub saat ini, buka
[isu Klaim Organisasi / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
dengan bukti publik yang tidak sensitif. Lihat
[Klaim Organisasi dan Namespace](/id/clawhub/namespace-claims) untuk panduan bukti dan hal yang
tidak boleh disertakan dalam isu publik.

## `sync` menyatakan tidak ada Skills yang ditemukan

`sync` mencari folder yang berisi `SKILL.md` atau `skill.md`.

Arahkan ke direktori akar yang ingin Anda pindai:

```bash
clawhub sync --root /path/to/skills
```

Lakukan pratinjau terlebih dahulu jika Anda tidak yakin apa yang akan diterbitkan:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` menolak karena perubahan lokal

File lokal tidak cocok dengan versi mana pun yang diketahui ClawHub. Pilih salah satu:

- Pertahankan perubahan lokal dan lewati pembaruan.
- Timpa dengan versi yang diterbitkan:

```bash
clawhub update @openclaw/demo --force
```

- Terbitkan salinan yang telah Anda edit sebagai slug baru atau fork.

## Penginstalan plugin gagal di OpenClaw

- Gunakan sumber ClawHub secara eksplisit:

```bash
openclaw plugins install clawhub:<package>
```

- Periksa halaman detail paket untuk status pemindaian dan metadata kompatibilitas.
- Pastikan versi OpenClaw Anda memenuhi rentang kompatibilitas yang dinyatakan
  oleh paket.
- Jika paket disembunyikan, ditahan, atau diblokir, paket mungkin tidak dapat diinstal hingga
  pemilik menyelesaikan masalah tersebut.

## Permintaan API publik gagal

- Patuhi header percobaan ulang `429` dan simpan respons daftar/pencarian publik dalam cache.
- Arahkan pengguna kembali ke daftar kanonis ClawHub.
- Jangan mencerminkan konten tersembunyi, privat, ditahan, atau diblokir moderasi di luar
  permukaan API publik.

Lihat [API HTTP](/clawhub/http-api) untuk detail endpoint.
