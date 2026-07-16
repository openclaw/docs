---
doc-schema-version: 1
read_when:
    - Anda meng-host OpenClaw untuk beberapa pengguna atau organisasi
    - Anda perlu memilih batas isolasi untuk beban kerja tenant
summary: Host beberapa domain kepercayaan tenant sebagai satu sel OpenClaw Gateway terisolasi per tenant
title: Hosting multitenan
x-i18n:
    generated_at: "2026-07-16T18:09:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 383d32331b45d40db6fb4ff8242dd9a3cf8898a3ccab19f0372cd06bbd83fc05
    source_path: gateway/multi-tenant-hosting.md
    workflow: 16
---

# Hosting multi-tenant

Model keamanan default OpenClaw adalah satu batas operator tepercaya per Gateway, bukan isolasi multi-tenant yang tahan terhadap pihak berbahaya di dalam satu Gateway bersama. Karena itu, hosting pengguna atau organisasi yang tidak berbagi batas kepercayaan berarti menjalankan instans OpenClaw lengkap yang terpisah untuk setiap tenant.

`openclaw fleet` menyebut setiap instans terisolasi sebagai **sel**. Sel adalah Gateway lengkap dalam container yang diperkeras, dengan state, kredensial, ruang kerja, akun channel, token, dan port host khusus loopback miliknya sendiri.

Fleet bersifat **eksperimental**: perintah, flag, dan profil containernya dapat berubah antar-rilis tanpa masa penghentian dukungan.

Fleet diuji pada host Linux dan macOS. Host Windows saat ini belum diuji.

## Mengapa setiap tenant memerlukan sel

Operator terautentikasi di dalam satu Gateway memiliki peran bidang kontrol tepercaya. ID sesi menentukan perutean; ID tersebut tidak mengotorisasi satu tenant terhadap tenant lainnya. Sandboxing agen dapat mengurangi dampak konten yang tidak tepercaya dan eksekusi alat, tetapi tidak mengubah satu Gateway bersama menjadi batas otorisasi tenant.

Gunakan satu sel per tenant agar setiap domain kepercayaan memiliki proses Gateway, container, struktur state persisten, dan kredensial Gateway yang terpisah. Hal ini mengikuti [model keamanan Gateway](/id/gateway/security): jangan menempatkan bersama pengguna yang tidak saling percaya dalam satu proses OpenClaw atau satu pengguna OS.

## Arsitektur

CLI Fleet adalah supervisor siklus hidup di sisi host. CLI ini mencatat sel dalam basis data state OpenClaw dan meminta runtime Docker atau Podman lokal untuk membuat, memeriksa, memulai, menghentikan, mengganti, dan menghapus container sel tersebut. Endpoint runtime jarak jauh tidak didukung karena jalur bind dan URL loopback Fleet merupakan milik host lokal. Fleet tidak mem-proxy pesan tenant dan tidak menambahkan jalur data bersama pada tingkat aplikasi di antara sel.

Setiap sel menjalankan image resmi `ghcr.io/openclaw/openclaw` pada jaringan bridge yang ditentukan pengguna miliknya sendiri. Bridge terpisah mencegah lalu lintas langsung antar-sel melalui IP container sekaligus mempertahankan akses NAT keluar untuk penyedia dan channel. Egress keluar tidak dibatasi secara default. Sel Podman dapat menggunakan `--network internal` untuk memblokir egress sekaligus mempertahankan port Gateway loopback yang dipublikasikan. Jaringan internal Docker merusak port yang dipublikasikan tersebut, sehingga Fleet menolak kombinasi itu; terapkan kebijakan egress Docker dengan aturan firewall host seperti chain `DOCKER-USER`. Gateway sel mendengarkan pada port `18789` di dalam container, sedangkan runtime memublikasikannya hanya ke `127.0.0.1:<allocated-port>` pada host. Operator dapat menempatkan reverse proxy yang disetujui, tunnel SSH, atau tailnet di depan endpoint loopback tersebut ketika akses jarak jauh diperlukan.

State Gateway persisten berasal dari `<state-dir>/fleet/cells/<tenant>/` dan dipasang pada `/home/node/.openclaw`. Kunci enkripsi profil autentikasi berasal dari jalur host `<state-dir>/fleet/auth-profile-secrets/<tenant>/` yang terpisah dan dipasang pada `/home/node/.config/openclaw`, sesuai dengan [tata letak persistensi Docker](/id/install/docker#storage-and-persistence) resmi. Kunci tersebut tidak berada di bawah mount state biasa. Akun channel per tenant berakhir di dalam sel yang memilikinya; Fleet tidak menyediakan akun channel bersama atau router pesan masuk.

Image resmi secara default menggunakan pengguna non-root `node` dengan UID 1000. Fleet menggunakan pemetaan pengguna yang kompatibel dengan host agar bind mount privat tetap dapat ditulis: Podman menggunakan `keep-id`, Docker rootful menggunakan identitas non-root yang menjalankan perintah, dan Docker rootless memetakan root container ke pengguna daemon tanpa hak istimewa. Docker dan Podman menerapkan pelabelan ulang privat `:Z` ketika SELinux host aktif. Profil container menghindari fitur host dengan hak istimewa dan mendukung penggunaan rootless, tetapi operasi rootless merupakan pilihan dan prasyarat runtime host, bukan sesuatu yang diaktifkan Fleet secara otomatis.

## Batas kepercayaan

Multi-tenancy melindungi tenant dari satu sama lain. Operator Fleet dan host dipercaya oleh setiap tenant. Ketahanan terhadap host yang disusupi bukan merupakan sasaran.

Artinya, administrator host dapat memeriksa konfigurasi dan lingkungan container, membaca data sel yang dipasang, mengganti image, atau masuk ke dalam container. Token Gateway dan nilai yang diteruskan dengan `--env` dapat dilihat administrator melalui pemeriksaan Docker atau Podman. Gunakan kontrol host, kebijakan akses administratif, pemantauan, cadangan, dan pengelola rahasia yang disetujui sebagaimana mestinya.

Baseline mencegah paparan jaringan wildcard yang tidak disengaja dan menghapus primitif eskalasi container yang umum, tetapi tidak membuat host yang tidak tepercaya menjadi aman.

## Tingkatan isolasi

Pilih batas yang sesuai dengan tenant yang Anda hosting:

1. **Baseline container yang diperkeras.** Fleet menghapus semua kapabilitas Linux, mengaktifkan `no-new-privileges`, menerapkan batas PID, memori, CPU, serta batas disk lapisan yang dapat ditulis secara opsional, menggunakan mount persisten dan jaringan per sel yang terpisah, serta hanya memublikasikan ke loopback host. Jaringan bridge membiarkan egress tidak dibatasi; gunakan `--network internal` Podman atau kebijakan firewall host Docker ketika sel tidak boleh memulai koneksi keluar. Ini adalah profil default untuk tenant yang memercayai operator dan host.
2. **Isolasi container atau VM yang lebih kuat.** Untuk beban kerja berisiko lebih tinggi, konfigurasikan Docker atau Podman agar menggunakan runtime isolasi OCI yang lebih kuat seperti gVisor atau Kata Containers, atau tempatkan sel dalam microVM. Ini merupakan konfigurasi runtime atau infrastruktur; opsi `--runtime docker|podman` Fleet memilih CLI container, bukan backend isolasi OCI. Lihat [runtime container alternatif](https://docs.docker.com/engine/daemon/alternative-runtimes/) Docker dan [panduan runtime VM Docker](/id/install/docker-vm-runtime).
3. **Mesin terpisah untuk tenant yang berbahaya.** Jangan menempatkan bersama tenant yang berbahaya dalam satu proses OpenClaw atau pengguna OS. Jika tenant tidak memercayai operator host yang sama atau memerlukan batas administratif yang lebih kuat, gunakan VM atau host fisik terpisah dengan administrasi runtime yang terpisah.

Tidak ada tingkatan dalam hierarki ini yang mengubah model kepercayaan aplikasi OpenClaw: satu Gateway tetap merupakan satu domain operator tepercaya.

## Mulai cepat

Buat sel. Perintah ini mencetak token Gateway yang dihasilkan satu kali, jadi segera simpan:

```bash
openclaw fleet create acme
```

Buka URL `http://127.0.0.1:<port>` yang dilaporkan pada host Fleet, autentikasikan dengan token tenant tersebut, lalu konfigurasikan kredensial penyedia dan akun channel di dalam sel.

Periksa state container dan keaktifan Gateway:

```bash
openclaw fleet status acme
```

Lakukan peningkatan dengan mempertahankan port host, data yang dipasang, profil sumber daya, lingkungan yang diberikan pengguna, dan token Gateway:

```bash
openclaw fleet upgrade acme
```

Hapus container dan baris registri sambil mempertahankan data tenant:

```bash
openclaw fleet rm acme --force
```

Untuk turut menghapus data tenant persisten, tambahkan `--purge-data`. Pembersihan memerlukan `--force`, tidak dapat dibatalkan, dan melakukan pemeriksaan pembatasan jalur yang telah diresolusi sebelum menghapus apa pun:

```bash
openclaw fleet rm acme --purge-data --force
```

Lihat [referensi CLI `openclaw fleet`](/cli/fleet) untuk setiap perintah dan opsi.

## Cakupan saat ini

Fleet tidak menyediakan bagian berikut:

- Akun channel bersama atau router ingress bersama
- Proses host per tenant yang diperkecil sebagai pengganti instans OpenClaw lengkap
- Host sel jarak jauh yang dikelola oleh satu supervisor
- Portal layanan mandiri tenant, bidang penagihan, atau UI administrasi yang didelegasikan

Kapabilitas ini memerlukan kontrak identitas, perutean, otorisasi, dan domain kegagalan yang eksplisit. Jangan mencoba menirunya dengan berbagi satu Gateway atau kredensialnya antar-tenant. Fleet adalah supervisor siklus hidup untuk satu host; fleet multimesin yang diatur oleh identitas memerlukan lapisan bidang kontrol terpisah.

## Terkait

- [`openclaw fleet`](/cli/fleet)
- [Keamanan Gateway](/id/gateway/security)
- [Beberapa Gateway](/id/gateway/multiple-gateways)
- [Docker](/id/install/docker)
- [Podman](/id/install/podman)
