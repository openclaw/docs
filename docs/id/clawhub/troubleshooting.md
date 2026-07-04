---
read_when:
    - Perintah CLI ClawHub atau registri OpenClaw gagal
    - Paket tidak dapat diinstal, dipublikasikan, atau diperbarui
summary: Memecahkan masalah masuk, instalasi, publikasi, pembaruan, dan API ClawHub.
x-i18n:
    generated_at: "2026-07-04T18:20:06Z"
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
- Periksa aturan firewall lokal, VPN, dan proksi jika callback tidak pernah tiba.
- Di lingkungan headless, buat token API di antarmuka web ClawHub dan jalankan:

```bash
clawhub login --token clh_...
```

## `whoami` atau `publish` mengembalikan `Unauthorized` (401)

- Masuk lagi dengan `clawhub login`.
- Jika Anda menggunakan jalur config kustom, pastikan `CLAWHUB_CONFIG_PATH` mengarah ke
  file yang berisi token Anda saat ini.
- Jika Anda menggunakan token API, pastikan token tersebut belum dicabut di antarmuka web.

## Pencarian atau instalasi mengembalikan `Rate limit exceeded` (429)

Baca informasi percobaan ulang dalam respons:

- `Retry-After`: detik yang harus ditunggu sebelum mencoba lagi.
- `RateLimit-Limit`: batas yang diterapkan ke permintaan ini.
- `RateLimit-Remaining`: sisa kuota persis Anda saat header ada. Pada `429`, nilainya `0`.
- `RateLimit-Reset` atau `X-RateLimit-Reset`: waktu reset.

Jika banyak pengguna berbagi satu IP egress, batas IP anonim dapat tercapai meskipun setiap
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

## Skill tidak muncul dalam pencarian

- Periksa slug persis atau halaman owner jika Anda mengetahuinya.
- Pastikan rilis bersifat publik dan tidak ditahan oleh pemindaian atau moderasi.
- Jika Anda memiliki skill tersebut, masuk dan periksa:

```bash
clawhub inspect @openclaw/demo
```

Diagnostik yang terlihat oleh owner dapat menjelaskan status pemindaian, upload-gate, atau moderasi.

## Publish gagal karena metadata wajib tidak ada

Untuk skill, periksa frontmatter `SKILL.md`. Variabel lingkungan dan
alat yang diperlukan harus dideklarasikan agar pengguna dan pemindai dapat memahami paket.

Untuk plugin, periksa metadata kompatibilitas `package.json`. Publish code-plugin
memerlukan kolom kompatibilitas OpenClaw seperti `openclaw.compat.pluginApi` dan
`openclaw.build.openclawVersion`.

Pratinjau payload publish terlebih dahulu:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Publish gagal dengan error owner GitHub atau sumber

ClawHub menggunakan identitas GitHub dan atribusi sumber untuk menghubungkan paket dengan
penerbitnya.

- Pastikan Anda masuk dengan akun GitHub yang memiliki atau dapat menerbitkan
  paket tersebut.
- Periksa bahwa URL sumber bersifat publik atau dapat diakses oleh ClawHub.
- Untuk sumber GitHub, gunakan `owner/repo`, `owner/repo@ref`, atau URL GitHub lengkap.

## Publish gagal karena namespace sudah diklaim atau dicadangkan

Jika publish gagal karena handle owner, namespace org, cakupan paket, slug skill,
atau nama paket sudah diklaim atau dicadangkan, pertama pastikan bahwa Anda
menerbitkan dengan owner yang cocok dengan namespace tersebut. Untuk paket plugin,
nama bercakupan seperti `@example-org/example-plugin` harus diterbitkan sebagai owner
`example-org` yang sesuai.

Jika Anda yakin org, proyek, atau merek Anda adalah pemilik namespace yang sah tetapi
Anda tidak dapat mengelola owner ClawHub saat ini, buka
[isu Klaim Org / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
dengan bukti publik yang tidak sensitif. Lihat
[Klaim Org dan Namespace](/clawhub/namespace-claims) untuk panduan bukti dan hal yang
harus dijauhkan dari isu publik.

## `sync` mengatakan tidak ada skill yang ditemukan

`sync` mencari folder yang berisi `SKILL.md` atau `skill.md`.

Arahkan ke root yang ingin Anda pindai:

```bash
clawhub sync --root /path/to/skills
```

Pratinjau terlebih dahulu jika Anda tidak yakin apa yang akan dipublish:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` menolak karena ada perubahan lokal

File lokal tidak cocok dengan versi apa pun yang diketahui ClawHub. Pilih salah satu:

- Simpan edit lokal dan lewati pembaruan.
- Timpa dengan versi yang dipublish:

```bash
clawhub update @openclaw/demo --force
```

- Publish salinan yang telah Anda edit sebagai slug atau fork baru.

## Instalasi plugin gagal di OpenClaw

- Gunakan sumber ClawHub eksplisit:

```bash
openclaw plugins install clawhub:<package>
```

- Periksa halaman detail paket untuk status pemindaian dan metadata kompatibilitas.
- Pastikan versi OpenClaw Anda memenuhi rentang kompatibilitas yang dinyatakan
  paket tersebut.
- Jika paket disembunyikan, ditahan, atau diblokir, paket mungkin tidak dapat diinstal sampai
  owner menyelesaikan masalahnya.

## Permintaan API publik gagal

- Patuhi header percobaan ulang `429` dan cache respons daftar/pencarian publik.
- Arahkan pengguna kembali ke listing ClawHub kanonis.
- Jangan mencerminkan konten tersembunyi, privat, ditahan, atau diblokir moderasi di luar
  permukaan API publik.

Lihat [HTTP API](/clawhub/http-api) untuk detail endpoint.
