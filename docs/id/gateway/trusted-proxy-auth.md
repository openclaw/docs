---
read_when:
    - Menjalankan OpenClaw di balik proksi berbasis identitas
    - Menyiapkan Pomerium, Caddy, atau nginx dengan OAuth di depan OpenClaw
    - Memperbaiki error WebSocket 1008 tidak terotorisasi pada konfigurasi proksi terbalik
    - Menentukan tempat untuk menetapkan HSTS dan header penguatan HTTP lainnya
sidebarTitle: Trusted proxy auth
summary: Delegasikan autentikasi Gateway ke proksi terbalik tepercaya (Pomerium, Caddy, nginx + OAuth)
title: Autentikasi proksi tepercaya
x-i18n:
    generated_at: "2026-07-20T03:54:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 849824b53e518391d1a81f8a9a17320df3f42749f37d0c49b0e8b662f82b27cb
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Fitur yang sensitif terhadap keamanan.** Mode ini mendelegasikan autentikasi sepenuhnya kepada proksi balik Anda. Kesalahan konfigurasi dapat membuat Gateway Anda dapat diakses tanpa izin. Baca halaman ini dengan saksama sebelum mengaktifkannya.
</Warning>

## Kapan digunakan

- Anda menjalankan OpenClaw di belakang **proksi sadar identitas** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth).
- Proksi Anda menangani seluruh autentikasi dan meneruskan identitas pengguna melalui header.
- Anda berada dalam lingkungan Kubernetes atau kontainer tempat proksi menjadi satu-satunya jalur menuju Gateway.
- Anda mengalami kesalahan WebSocket `1008 unauthorized` karena browser tidak dapat meneruskan token dalam payload WS.

## Kapan TIDAK digunakan

- Proksi Anda tidak mengautentikasi pengguna (hanya terminator TLS atau penyeimbang beban).
- Terdapat jalur apa pun menuju Gateway yang melewati proksi (celah firewall, akses jaringan internal).
- Anda tidak yakin apakah proksi Anda menghapus atau menimpa header yang diteruskan dengan benar.
- Anda hanya memerlukan akses pribadi untuk satu pengguna (pertimbangkan Tailscale Serve + loopback sebagai gantinya).

## Cara kerjanya

<Steps>
  <Step title="Proksi mengautentikasi pengguna">
    Proksi balik Anda mengautentikasi pengguna (OAuth, OIDC, SAML, dan sebagainya).
  </Step>
  <Step title="Proksi menambahkan header identitas">
    Proksi menambahkan header yang berisi identitas pengguna terautentikasi (misalnya, `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway memverifikasi sumber tepercaya">
    OpenClaw memeriksa bahwa permintaan berasal dari **IP proksi tepercaya** (`gateway.trustedProxies`) dan bukan alamat loopback atau antarmuka lokal milik Gateway sendiri.
  </Step>
  <Step title="Gateway mengekstrak identitas">
    OpenClaw membaca header yang diwajibkan, lalu identitas pengguna dari header yang dikonfigurasi.
  </Step>
  <Step title="Otorisasi">
    Jika semua pemeriksaan berhasil dan pengguna lolos `allowUsers` (jika ditetapkan), permintaan diotorisasi.
  </Step>
</Steps>

## Konfigurasi

```json5
{
  gateway: {
    // Autentikasi proksi tepercaya secara default mengharapkan IP sumber proksi bukan loopback
    bind: "lan",

    // KRITIS: Tambahkan hanya IP proksi Anda di sini
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header yang berisi identitas pengguna terautentikasi (wajib)
        userHeader: "x-forwarded-user",

        // Opsional: header yang WAJIB ada (verifikasi proksi)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Opsional: batasi untuk pengguna tertentu (kosong = izinkan semua)
        allowUsers: ["nick@example.com", "admin@company.org"],

        // Opsional: izinkan proksi loopback pada host yang sama setelah persetujuan eksplisit
        allowLoopback: false,

        // Opsional: izinkan pengguna proksi terautentikasi mendaftarkan perangkat browser baru
        deviceAutoApprove: {
          enabled: false,
          scopes: ["operator.read", "operator.write", "operator.approvals"],
        },
      },
    },
  },
}
```

<Warning>
**Aturan runtime, berdasarkan urutan evaluasi**

1. IP sumber permintaan harus cocok dengan `gateway.trustedProxies` (mendukung CIDR), atau permintaan ditolak (`trusted_proxy_untrusted_source`).
2. Permintaan yang bersumber dari loopback (`127.0.0.1`, `::1`) ditolak kecuali `gateway.auth.trustedProxy.allowLoopback = true` dan alamat loopback juga tercantum dalam `trustedProxies` (`trusted_proxy_loopback_source`). Pemeriksaan ini dijalankan sebelum pemeriksaan header, sehingga sumber loopback gagal dengan cara ini meskipun header yang diwajibkan juga tidak ada.
3. Sumber non-loopback yang cocok dengan salah satu alamat antarmuka jaringan lokal milik host Gateway ditolak sebagai perlindungan terhadap pemalsuan (`trusted_proxy_local_interface_source`). Jika penemuan antarmuka itu sendiri gagal, permintaan juga ditolak (`trusted_proxy_local_interface_check_failed`).
4. `requiredHeaders` dan `userHeader` harus ada dan tidak boleh kosong.
5. `allowUsers`, jika tidak kosong, harus menyertakan pengguna yang diekstrak.

**Bukti header yang diteruskan mengesampingkan sifat lokal loopback untuk fallback lokal langsung.** Jika permintaan tiba melalui loopback tetapi membawa header `Forwarded`, `X-Forwarded-*` apa pun, atau `X-Real-IP`, bukti tersebut membuat permintaan tidak memenuhi syarat untuk fallback kata sandi lokal langsung dan pembatasan identitas perangkat, meskipun autentikasi proksi tepercaya tetap gagal karena loopback.

`allowLoopback` memercayai proses lokal pada host Gateway hingga tingkat yang sama dengan proksi balik. Aktifkan hanya jika Gateway tetap dilindungi firewall dari akses jarak jauh langsung dan proksi lokal menghapus atau menimpa header identitas yang diberikan klien.

Klien Gateway internal yang tidak melewati proksi balik harus menggunakan `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, bukan header identitas proksi tepercaya. Deployment Control UI non-loopback tetap memerlukan `gateway.controlUi.allowedOrigins` secara eksplisit.
</Warning>

### Referensi konfigurasi

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Larik alamat IP proksi (atau CIDR) yang dipercaya. Permintaan dari IP lain ditolak.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  Harus berupa `"trusted-proxy"`.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Nama header yang berisi identitas pengguna terautentikasi.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  Header tambahan yang harus ada agar permintaan dipercaya.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Daftar pengguna yang diizinkan berdasarkan identitas pengguna. Kosong berarti mengizinkan semua pengguna terautentikasi.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean" default="false">
  Dukungan berbasis persetujuan eksplisit untuk proksi balik loopback pada host yang sama.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.deviceAutoApprove.enabled" type="boolean" default="false">
  Setujui secara otomatis identitas perangkat Control UI dan WebChat baru setelah autentikasi proksi tepercaya.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.deviceAutoApprove.scopes" type="string[]" default='["operator.read", "operator.write", "operator.approvals"]'>
  Cakupan maksimum yang diberikan kepada perangkat browser yang disetujui secara otomatis. Mencantumkan `operator.admin` secara eksplisit memungkinkan setiap pengguna yang diautentikasi proksi meminta pemberian perangkat dengan akses admin penuh secara otomatis, membuat permintaan tanpa cakupan menerima akses admin penuh secara otomatis, dan memicu temuan audit keamanan KRITIS `gateway.trusted_proxy_device_auto_approve_admin` serta peringatan saat Gateway dimulai.
</ParamField>

<Warning>
Aktifkan `allowLoopback` hanya jika proksi balik lokal merupakan batas kepercayaan yang dimaksudkan. Setiap proses lokal yang dapat terhubung ke Gateway dapat mencoba mengirim header identitas proksi, jadi jaga agar akses langsung ke Gateway tetap bersifat privat bagi host dan wajibkan header milik proksi seperti `x-forwarded-proto`, atau header pernyataan bertanda tangan jika proksi Anda mendukungnya.
</Warning>

## Persetujuan perangkat otomatis

Autentikasi proksi tepercaya dapat secara opsional menggunakan identitas proksi sebagai batas persetujuan untuk perangkat browser baru:

```json5
{
  gateway: {
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
        allowUsers: ["operator@example.com"],
        deviceAutoApprove: {
          enabled: true,
          scopes: ["operator.read", "operator.write", "operator.approvals"],
        },
      },
    },
  },
}
```

Nilai default-nya adalah `enabled: false`. Saat diaktifkan, semua aturan berikut berlaku:

1. WebSocket harus telah diautentikasi melalui metode `trusted-proxy` dengan identitas pengguna yang tidak kosong dan lolos `allowUsers` ketika daftar pengguna yang diizinkan dikonfigurasi. Koneksi token, kata sandi, Tailscale, dan tanpa autentikasi tidak pernah menggunakan kebijakan ini.
2. Hanya perangkat browser Control UI atau WebChat baru yang dapat disetujui secara otomatis. Setiap permintaan untuk perangkat yang sudah ada, termasuk peningkatan cakupan, tetap menunggu persetujuan manual dengan `openclaw devices approve <requestId>`.
3. Perangkat disetujui dengan peran `operator`. Jika permintaan koneksi menyertakan cakupan, pemberiannya merupakan irisan tepat antara cakupan yang diminta dan `deviceAutoApprove.scopes`. Jika permintaan tidak menyertakan cakupan, daftar yang dikonfigurasi diberikan; jika daftar tersebut tidak dicantumkan, nilai default-nya adalah `operator.read`, `operator.write`, dan `operator.approvals`. Pemberian yang dihasilkan kemudian dibatasi lebih lanjut oleh header proksi [`x-openclaw-scopes`](#control-ui-pairing-behavior) milik koneksi jika ada, sehingga proksi yang mempersempit cakupan pengguna juga membatasi pemberian perangkat **persisten**, bukan hanya sesi — header yang ada tetapi kosong menghasilkan tanpa cakupan. Batas ini berlaku meskipun klien tidak menyertakan daftar cakupannya sendiri.
4. `operator.admin` hanya diizinkan melalui pencantuman eksplisit dalam `deviceAutoApprove.scopes`. Jika dicantumkan, setiap pengguna yang diautentikasi proksi dapat meminta dan secara otomatis menerima akses admin penuh pada perangkat browser baru; permintaan tanpa cakupan menerima akses admin penuh secara otomatis. `openclaw security audit` melaporkan temuan KRITIS `gateway.trusted_proxy_device_auto_approve_admin`, dan Gateway mencatat peringatan satu kali saat dimulai. Utamakan persetujuan admin manual dengan `openclaw devices approve` atau `openclaw devices rotate` hingga peran per identitas tersedia.

<Warning>
Mengaktifkan opsi ini mendelegasikan pendaftaran perangkat browser baru sepenuhnya kepada identitas proksi balik. Akun proksi yang disusupi dapat mendaftarkan perangkat persisten dengan setiap cakupan yang dikonfigurasi. Mencantumkan `operator.admin` menjadikan perangkat tersebut administrator penuh tanpa persetujuan manual. Pastikan Gateway hanya dapat dijangkau melalui proksi, wajibkan autentikasi proksi yang kuat, timpa header identitas, dan gunakan daftar `allowUsers` yang terbatas.
</Warning>

## Perilaku pemasangan Control UI

Saat `gateway.auth.mode = "trusted-proxy"` aktif dan permintaan lolos pemeriksaan proksi tepercaya, sesi WebSocket Control UI dapat terhubung tanpa identitas pemasangan perangkat.

Implikasi cakupan:

- Sesi WebSocket Control UI tanpa perangkat dapat terhubung, tetapi secara default tidak menerima cakupan operator. OpenClaw mengosongkan daftar cakupan yang diminta menjadi `[]` agar sesi yang tidak terikat pada perangkat/token terpasang yang disetujui tidak dapat mendeklarasikan izinnya sendiri.
- Jika metode gagal dengan `missing scope` setelah koneksi WebSocket berhasil, gunakan HTTPS agar browser dapat menghasilkan identitas perangkat dan menyelesaikan pemasangan. Lihat [HTTP Control UI yang tidak aman](/id/web/control-ui#insecure-http).
- Hanya untuk keadaan darurat: `gateway.controlUi.dangerouslyDisableDeviceAuth=true` mempertahankan cakupan yang diminta bahkan tanpa identitas perangkat. Ini merupakan penurunan keamanan yang parah; segera kembalikan pengaturan. Lihat [HTTP Control UI yang tidak aman](/id/web/control-ui#insecure-http).

Pembatasan cakupan oleh proksi balik: jika proksi Anda mengirim `x-openclaw-scopes` pada permintaan peningkatan WebSocket Control UI, OpenClaw membatasi cakupan sesi menjadi irisan antara cakupan yang diminta dan cakupan yang dideklarasikan. Header ini tidak memberikan cakupan; header ini hanya mempersempit cakupan yang dapat dimiliki sesi. Saat `deviceAutoApprove.enabled` bernilai true, batas yang sama juga berlaku pada pemberian perangkat persisten yang ditulis oleh [persetujuan perangkat otomatis](#automatic-device-approval), sehingga perangkat yang disetujui secara otomatis tidak pernah memiliki lebih banyak cakupan daripada yang dideklarasikan proksi.

Implikasi:

- Pemasangan tidak lagi menjadi gerbang utama untuk akses Control UI tanpa perangkat. Saat `deviceAutoApprove.enabled` bernilai true, identitas proksi juga menjadi gerbang persetujuan untuk pendaftaran perangkat browser baru.
- Kebijakan autentikasi proksi Anda dan `allowUsers` menjadi kontrol akses yang efektif.
- Pastikan ingress Gateway hanya terbuka untuk IP proksi tepercaya (`gateway.trustedProxies` + firewall).

Klien WebSocket kustom bukanlah sesi Control UI. `gateway.controlUi.dangerouslyDisableDeviceAuth` tidak memberikan cakupan kepada klien `client.mode: "backend"` arbitrer atau klien berbentuk CLI. Otomatisasi kustom sebaiknya menggunakan identitas/pemasangan perangkat, jalur helper backend lokal langsung yang dicadangkan `client.id: "gateway-client"`, atau [Plugin RPC HTTP admin](/id/plugins/admin-http-rpc) jika antarmuka permintaan/respons HTTP lebih sesuai.

## Header cakupan operator

Autentikasi trusted-proxy adalah mode HTTP **yang membawa identitas**, sehingga pemanggil dapat secara opsional mendeklarasikan cakupan operator dengan `x-openclaw-scopes` pada permintaan API HTTP.

Catatan: Cakupan WebSocket ditentukan oleh handshake protokol Gateway dan pengikatan identitas perangkat. Pada permintaan upgrade WebSocket Control UI, `x-openclaw-scopes` hanya membatasi cakupan sesi yang dinegosiasikan, bukan memberikan cakupan. Lihat [perilaku pemasangan Control UI](#control-ui-pairing-behavior).

Contoh:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Perilaku:

- Ketika header tersedia, OpenClaw mengikuti kumpulan cakupan yang dideklarasikan.
- Ketika header tersedia tetapi kosong, permintaan mendeklarasikan **tidak ada** cakupan operator.
- Ketika header tidak tersedia, API HTTP normal yang membawa identitas kembali menggunakan kumpulan cakupan operator default standar (`operator.admin`, `operator.read`, `operator.write`, `operator.approvals`, `operator.pairing`, `operator.talk.secrets`).
- **Rute HTTP plugin** dengan autentikasi Gateway memiliki default yang lebih sempit: ketika `x-openclaw-scopes` tidak tersedia, cakupan runtime-nya kembali hanya menggunakan `operator.write`.
- Permintaan HTTP yang berasal dari browser tetap harus lolos `gateway.controlUi.allowedOrigins` (atau mode fallback header Host yang disengaja), bahkan setelah autentikasi trusted-proxy berhasil.

Aturan praktis: kirim `x-openclaw-scopes` secara eksplisit ketika Anda ingin permintaan trusted-proxy lebih sempit daripada default, atau ketika rute plugin dengan autentikasi Gateway memerlukan sesuatu yang lebih kuat daripada cakupan tulis.

## Terminasi TLS dan HSTS

Gunakan satu titik terminasi TLS dan terapkan HSTS di sana.

<Tabs>
  <Tab title="Terminasi TLS proxy (direkomendasikan)">
    Ketika reverse proxy Anda menangani HTTPS untuk `https://control.example.com`, tetapkan `Strict-Transport-Security` pada proxy untuk domain tersebut.

    - Cocok untuk penerapan yang menghadap internet.
    - Menempatkan kebijakan sertifikat + penguatan HTTP di satu tempat.
    - OpenClaw dapat tetap menggunakan HTTP loopback di belakang proxy.

    Contoh nilai header:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Terminasi TLS Gateway">
    Jika OpenClaw sendiri menyajikan HTTPS secara langsung (tanpa proxy yang melakukan terminasi TLS), tetapkan:

    ```json5
    {
      gateway: {
        tls: { enabled: true },
        http: {
          securityHeaders: {
            strictTransportSecurity: "max-age=31536000; includeSubDomains",
          },
        },
      },
    }
    ```

    `strictTransportSecurity` menerima nilai header berupa string, atau `false` untuk menonaktifkannya secara eksplisit.

  </Tab>
</Tabs>

### Panduan peluncuran

- Mulailah dengan usia maksimum yang singkat terlebih dahulu (misalnya `max-age=300`) saat memvalidasi lalu lintas.
- Tingkatkan ke nilai berjangka panjang (misalnya `max-age=31536000`) hanya setelah tingkat keyakinan tinggi.
- Tambahkan `includeSubDomains` hanya jika setiap subdomain siap menggunakan HTTPS.
- Gunakan preload hanya jika Anda sengaja memenuhi persyaratan preload untuk seluruh kumpulan domain Anda.
- Pengembangan lokal khusus loopback tidak memperoleh manfaat dari HSTS.

## Contoh penyiapan proxy

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium meneruskan identitas dalam `x-pomerium-claim-email` (atau header klaim lainnya) dan JWT dalam `x-pomerium-jwt-assertion`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // IP Pomerium
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-pomerium-claim-email",
            requiredHeaders: ["x-pomerium-jwt-assertion"],
          },
        },
      },
    }
    ```

    Cuplikan konfigurasi Pomerium:

    ```yaml
    routes:
      - from: https://openclaw.example.com
        to: http://openclaw-gateway:18789
        policy:
          - allow:
              or:
                - email:
                    is: nick@example.com
        pass_identity_headers: true
    ```

  </Accordion>
  <Accordion title="Caddy dengan OAuth">
    Caddy dengan plugin `caddy-security` dapat mengautentikasi pengguna dan meneruskan header identitas.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // IP proxy Caddy/sidecar
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```

    Cuplikan Caddyfile:

    ```caddy
    openclaw.example.com {
        authenticate with oauth2_provider
        authorize with policy1

        reverse_proxy openclaw:18789 {
            header_up X-Forwarded-User {http.auth.user.email}
        }
    }
    ```

  </Accordion>
  <Accordion title="nginx + oauth2-proxy">
    oauth2-proxy mengautentikasi pengguna dan meneruskan identitas dalam `x-auth-request-email`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // IP nginx/oauth2-proxy
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-auth-request-email",
          },
        },
      },
    }
    ```

    Cuplikan konfigurasi nginx:

    ```nginx
    location / {
        auth_request /oauth2/auth;
        auth_request_set $user $upstream_http_x_auth_request_email;

        proxy_pass http://openclaw:18789;
        proxy_set_header X-Auth-Request-Email $user;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    ```

  </Accordion>
  <Accordion title="Traefik dengan autentikasi penerusan">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // IP kontainer Traefik
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Konfigurasi token campuran

Saat memulai, Gateway menolak autentikasi trusted-proxy jika token bersama juga dikonfigurasi (`gateway.auth.token` atau `OPENCLAW_GATEWAY_TOKEN`). Keduanya saling eksklusif karena token bersama akan memungkinkan pemanggil pada host yang sama mengautentikasi melalui jalur yang sepenuhnya berbeda dari identitas terverifikasi proxy yang hendak diberlakukan oleh mode ini.

Jika proses mulai gagal dengan kesalahan seperti `gateway auth mode is trusted-proxy, but a shared token is also configured`:

- Hapus token bersama saat menggunakan mode trusted-proxy, atau
- Ubah `gateway.auth.mode` menjadi `"token"` jika Anda bermaksud menggunakan autentikasi berbasis token.

Header identitas trusted-proxy loopback tetap gagal secara tertutup: pemanggil pada host yang sama tidak diautentikasi secara diam-diam sebagai pengguna proxy. Pemanggil internal OpenClaw yang melewati proxy dapat mengautentikasi dengan `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` sebagai gantinya. Fallback token tetap sengaja tidak didukung dalam mode trusted-proxy.

## Daftar periksa keamanan

Sebelum mengaktifkan autentikasi trusted-proxy, verifikasi:

- [ ] **Proxy adalah satu-satunya jalur**: Port Gateway dilindungi firewall dari semua pihak kecuali proxy Anda.
- [ ] **trustedProxies minimal**: Hanya IP proxy Anda yang sebenarnya, bukan seluruh subnet.
- [ ] **Sumber proxy loopback disengaja**: Autentikasi trusted-proxy gagal secara tertutup untuk permintaan bersumber dari loopback kecuali `gateway.auth.trustedProxy.allowLoopback` diaktifkan secara eksplisit untuk proxy pada host yang sama.
- [ ] **Proxy menghapus header**: Proxy Anda menimpa (bukan menambahkan) header `x-forwarded-*` dari klien.
- [ ] **Terminasi TLS**: Proxy Anda menangani TLS; pengguna terhubung melalui HTTPS.
- [ ] **allowedOrigins bersifat eksplisit**: Control UI non-loopback menggunakan `gateway.controlUi.allowedOrigins` yang eksplisit.
- [ ] **allowUsers ditetapkan** (direkomendasikan): Batasi ke pengguna yang dikenal alih-alih mengizinkan siapa pun yang terautentikasi.
- [ ] **Tidak ada konfigurasi token campuran**: Jangan tetapkan `gateway.auth.token` dan `gateway.auth.mode: "trusted-proxy"` sekaligus.
- [ ] **Fallback kata sandi lokal bersifat privat**: Jika Anda mengonfigurasi `gateway.auth.password` untuk pemanggil internal langsung, lindungi port Gateway dengan firewall agar klien jarak jauh non-proxy tidak dapat mengaksesnya secara langsung.
- [ ] **Persetujuan perangkat otomatis disengaja**: Jika `deviceAutoApprove.enabled` bernilai true, perlakukan keamanan akun reverse-proxy sebagai batas pendaftaran perangkat serta pertahankan daftar cakupan yang diberikan agar tidak bersifat admin dan tetap minimal.

## Audit keamanan

`openclaw security audit` menandai autentikasi trusted-proxy dengan temuan berkeparahan **kritis**. Ini disengaja; temuan tersebut merupakan pengingat bahwa Anda mendelegasikan keamanan ke penyiapan proxy Anda.

Audit memeriksa:

- Peringatan/pengingat kritis `gateway.trusted_proxy_auth` dasar.
- Konfigurasi `trustedProxies` tidak tersedia.
- Konfigurasi `userHeader` tidak tersedia.
- `allowUsers` kosong (mengizinkan setiap pengguna yang terautentikasi).
- `allowLoopback` diaktifkan untuk sumber proxy pada host yang sama.
- Persetujuan perangkat browser otomatis diaktifkan (mendelegasikan pemasangan perangkat baru kepada identitas proxy).

Temuan terpisah yang tidak khusus untuk trusted-proxy juga berlaku setiap kali Control UI diekspos: `gateway.controlUi.allowedOrigins` wildcard atau tidak tersedia, serta fallback asal header Host.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    Permintaan tidak berasal dari IP dalam `gateway.trustedProxies`. Periksa:

    - Apakah IP proxy sudah benar? (IP kontainer Docker dapat berubah.)
    - Apakah ada load balancer di depan proxy Anda?
    - Gunakan `docker inspect` atau `kubectl get pods -o wide` untuk menemukan IP yang sebenarnya.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw menolak permintaan trusted-proxy yang bersumber dari loopback.

    Periksa:

    - Apakah proxy terhubung dari `127.0.0.1` / `::1`?
    - Apakah Anda mencoba menggunakan autentikasi trusted-proxy dengan reverse proxy loopback pada host yang sama?

    Perbaikan:

    - Utamakan autentikasi token/kata sandi untuk klien internal pada host yang sama yang tidak melewati proxy, atau
    - Rutekan melalui alamat proxy tepercaya non-loopback dan pertahankan IP tersebut dalam `gateway.trustedProxies`, atau
    - Untuk reverse proxy pada host yang sama yang disengaja, tetapkan `gateway.auth.trustedProxy.allowLoopback = true`, pertahankan alamat loopback dalam `gateway.trustedProxies`, dan pastikan proxy menghapus atau menimpa header identitas.

  </Accordion>
  <Accordion title="trusted_proxy_local_interface_source / trusted_proxy_local_interface_check_failed">
    IP sumber permintaan cocok dengan salah satu alamat antarmuka jaringan non-loopback milik host Gateway sendiri (bukan proxy), sebagai perlindungan terhadap lalu lintas palsu dari host yang sama pada tailnet atau jaringan bridge Docker. `..._check_failed` berarti penemuan antarmuka itu sendiri mengalami kesalahan, sehingga OpenClaw gagal secara tertutup.

    Periksa:

    - Apakah suatu proses pada host Gateway itu sendiri mengirimkan header identitas secara langsung dan melewati proxy?
    - Apakah proxy berjalan dalam namespace jaringan yang sama dengan Gateway, dengan IP yang juga muncul sebagai antarmuka lokal?

    Perbaikan: rutekan lalu lintas proxy melalui alamat yang tidak juga terikat secara lokal oleh host Gateway, atau gunakan `allowLoopback` hanya untuk penyiapan proxy pada host yang sama yang sebenarnya.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    Header pengguna kosong atau tidak tersedia. Periksa:

    - Apakah proxy Anda dikonfigurasi untuk meneruskan header identitas?
    - Apakah nama header sudah benar? (tidak peka huruf besar-kecil, tetapi ejaannya harus tepat)
    - Apakah pengguna benar-benar terautentikasi pada proxy?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Header yang diwajibkan tidak tersedia. Periksa:

    - Konfigurasi proxy Anda untuk header tertentu tersebut.
    - Apakah header dihapus di suatu tempat dalam rantai.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    Pengguna telah diautentikasi tetapi tidak tercantum dalam `allowUsers`. Tambahkan pengguna tersebut atau hapus daftar izin.
  </Accordion>
  <Accordion title="trusted_proxy_no_proxies_configured / trusted_proxy_config_missing">
    `gateway.auth.mode` adalah `"trusted-proxy"`, tetapi `gateway.trustedProxies` kosong, atau `gateway.auth.trustedProxy` tidak ada. Setiap permintaan ditolak hingga keduanya ditetapkan.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Autentikasi proksi tepercaya berhasil, tetapi header `Origin` browser tidak lolos pemeriksaan asal Control UI.

    Periksa:

    - `gateway.controlUi.allowedOrigins` menyertakan asal browser yang tepat.
    - Anda tidak mengandalkan asal wildcard kecuali memang sengaja menginginkan perilaku izinkan-semua.
    - Jika sengaja menggunakan mode fallback header Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` ditetapkan secara disengaja.

  </Accordion>
  <Accordion title="Koneksi berhasil tetapi metode melaporkan cakupan tidak ada">
    WebSocket terhubung, tetapi `chat.history`, `sessions.list`, atau
    `models.list` gagal dengan `missing scope: operator.read`.

    Penyebab umum:

    - Sesi Control UI tanpa perangkat: autentikasi proksi tepercaya dapat mengizinkan koneksi WebSocket tanpa identitas perangkat, tetapi OpenClaw menghapus cakupan pada sesi tanpa perangkat sesuai rancangan.
    - Klien backend khusus: `gateway.controlUi.dangerouslyDisableDeviceAuth` dicakup untuk Control UI dan tidak memberikan cakupan kepada klien WebSocket backend arbitrer atau yang menyerupai CLI.
    - `x-openclaw-scopes` terlalu sempit: jika proksi menyisipkan header ini pada permintaan peningkatan WebSocket Control UI, cakupan sesi dibatasi pada kumpulan tersebut. Nilai header kosong tidak menghasilkan cakupan apa pun.

    Perbaikan:

    - Untuk Control UI, gunakan HTTPS agar browser dapat menghasilkan identitas perangkat dan menyelesaikan pemasangan.
    - Untuk otomatisasi khusus, gunakan identitas perangkat/pemasangan, jalur bantuan backend `gateway-client` lokal-langsung yang dicadangkan, atau [RPC HTTP admin](/id/plugins/admin-http-rpc).
    - Gunakan `gateway.controlUi.dangerouslyDisableDeviceAuth: true` hanya sebagai jalur darurat sementara untuk Control UI.

  </Accordion>
  <Accordion title="WebSocket masih gagal">
    Pastikan proksi Anda:

    - Mendukung peningkatan WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - Meneruskan header identitas pada permintaan peningkatan WebSocket (bukan hanya HTTP).
    - Tidak memiliki jalur autentikasi terpisah untuk koneksi WebSocket.

  </Accordion>
</AccordionGroup>

## Migrasi dari autentikasi token

<Steps>
  <Step title="Konfigurasikan proksi">
    Konfigurasikan proksi untuk mengautentikasi pengguna dan meneruskan header.
  </Step>
  <Step title="Uji proksi secara terpisah">
    Uji penyiapan proksi secara terpisah (curl dengan header).
  </Step>
  <Step title="Perbarui konfigurasi OpenClaw">
    Perbarui konfigurasi OpenClaw dengan autentikasi proksi tepercaya.
  </Step>
  <Step title="Mulai ulang Gateway">
    Mulai ulang Gateway.
  </Step>
  <Step title="Uji WebSocket">
    Uji koneksi WebSocket dari Control UI.
  </Step>
  <Step title="Audit">
    Jalankan `openclaw security audit` dan tinjau temuan.
  </Step>
</Steps>

## Terkait

- [Konfigurasi](/id/gateway/configuration) — referensi konfigurasi
- [Cakupan operator](/id/gateway/operator-scopes) — peran, cakupan, dan pemeriksaan persetujuan
- [Akses jarak jauh](/id/gateway/remote) — pola akses jarak jauh lainnya
- [Keamanan](/id/gateway/security) — panduan keamanan lengkap
- [Tailscale](/id/gateway/tailscale) — alternatif yang lebih sederhana untuk akses khusus tailnet
