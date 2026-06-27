---
read_when:
    - Menjalankan OpenClaw di belakang proksi yang sadar identitas
    - Menyiapkan Pomerium, Caddy, atau nginx dengan OAuth di depan OpenClaw
    - Memperbaiki galat WebSocket 1008 unauthorized dengan penyiapan proxy terbalik
    - Menentukan tempat mengatur HSTS dan header pengerasan HTTP lainnya
sidebarTitle: Trusted proxy auth
summary: Delegasikan autentikasi Gateway ke reverse proxy tepercaya (Pomerium, Caddy, nginx + OAuth)
title: Autentikasi proksi tepercaya
x-i18n:
    generated_at: "2026-06-27T17:34:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 498a8aca666f88201302af3895b11ba43ab9c0b1bff00a262145fc9e21e80fa7
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Fitur sensitif keamanan.** Mode ini mendelegasikan autentikasi sepenuhnya ke reverse proxy Anda. Kesalahan konfigurasi dapat mengekspos Gateway Anda ke akses tidak sah. Baca halaman ini dengan saksama sebelum mengaktifkannya.
</Warning>

## Kapan digunakan

Gunakan mode autentikasi `trusted-proxy` ketika:

- Anda menjalankan OpenClaw di belakang **proxy yang sadar identitas** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth).
- Proxy Anda menangani semua autentikasi dan meneruskan identitas pengguna melalui header.
- Anda berada di lingkungan Kubernetes atau kontainer tempat proxy adalah satu-satunya jalur ke Gateway.
- Anda mengalami galat WebSocket `1008 unauthorized` karena browser tidak dapat meneruskan token dalam payload WS.

## Kapan TIDAK digunakan

- Jika proxy Anda tidak mengautentikasi pengguna (hanya terminator TLS atau load balancer).
- Jika ada jalur apa pun ke Gateway yang melewati proxy (celah firewall, akses jaringan internal).
- Jika Anda tidak yakin apakah proxy Anda menghapus/menimpa header terusan dengan benar.
- Jika Anda hanya memerlukan akses pribadi satu pengguna (pertimbangkan Tailscale Serve + loopback untuk penyiapan yang lebih sederhana).

## Cara kerjanya

<Steps>
  <Step title="Proxy mengautentikasi pengguna">
    Reverse proxy Anda mengautentikasi pengguna (OAuth, OIDC, SAML, dll.).
  </Step>
  <Step title="Proxy menambahkan header identitas">
    Proxy menambahkan header dengan identitas pengguna yang telah diautentikasi (misalnya, `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway memverifikasi sumber tepercaya">
    OpenClaw memeriksa bahwa permintaan berasal dari **IP proxy tepercaya** (dikonfigurasi di `gateway.trustedProxies`).
  </Step>
  <Step title="Gateway mengekstrak identitas">
    OpenClaw mengekstrak identitas pengguna dari header yang dikonfigurasi.
  </Step>
  <Step title="Otorisasi">
    Jika semuanya valid, permintaan diotorisasi.
  </Step>
</Steps>

## Perilaku pemasangan Control UI

Ketika `gateway.auth.mode = "trusted-proxy"` aktif dan permintaan lolos pemeriksaan trusted-proxy, sesi WebSocket Control UI dapat terhubung tanpa identitas pemasangan perangkat.

Implikasi cakupan:

- Sesi WebSocket Control UI tanpa perangkat dapat terhubung tetapi secara default tidak menerima cakupan operator. OpenClaw mengosongkan daftar cakupan yang diminta menjadi `[]` sehingga sesi yang tidak terikat ke perangkat/token terpasang yang disetujui tidak dapat mendeklarasikan izin sendiri.
- Jika metode gagal dengan `missing scope` setelah koneksi WebSocket berhasil, gunakan HTTPS agar browser dapat menghasilkan identitas perangkat dan menyelesaikan pemasangan. Lihat [HTTP tidak aman Control UI](/id/web/control-ui#insecure-http).
- Hanya untuk break-glass: `gateway.controlUi.dangerouslyDisableDeviceAuth=true` mempertahankan cakupan yang diminta bahkan tanpa identitas perangkat. Ini adalah penurunan keamanan yang parah; kembalikan segera. Lihat [HTTP tidak aman Control UI](/id/web/control-ui#insecure-http).

Pembatasan cakupan reverse proxy:

- Jika proxy Anda mengirim `x-openclaw-scopes` pada permintaan upgrade WebSocket Control UI, OpenClaw membatasi cakupan sesi ke irisan antara cakupan yang diminta dan cakupan yang dinyatakan. Header ini tidak memberikan cakupan; header ini hanya mempersempit apa yang dapat dimiliki sesi.

Implikasi:

- Pemasangan tidak lagi menjadi gerbang utama untuk akses Control UI dalam mode ini.
- Kebijakan autentikasi reverse proxy Anda dan `allowUsers` menjadi kontrol akses efektif.
- Kunci ingress gateway hanya ke IP proxy tepercaya (`gateway.trustedProxies` + firewall).

Klien WebSocket kustom bukan sesi Control UI. `gateway.controlUi.dangerouslyDisableDeviceAuth` tidak memberikan cakupan ke klien arbitrer `client.mode: "backend"` atau klien berbentuk CLI. Otomasi kustom harus menggunakan identitas/pemasangan perangkat, jalur helper backend direct-local tercadangkan `client.id: "gateway-client"`, atau [plugin RPC HTTP admin](/id/plugins/admin-http-rpc) ketika permukaan permintaan/respons HTTP lebih sesuai.

## Konfigurasi

```json5
{
  gateway: {
    // Trusted-proxy auth expects requests from a non-loopback trusted proxy source by default
    bind: "lan",

    // CRITICAL: Only add your proxy's IP(s) here
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header containing authenticated user identity (required)
        userHeader: "x-forwarded-user",

        // Optional: headers that MUST be present (proxy verification)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Optional: restrict to specific users (empty = allow all)
        allowUsers: ["nick@example.com", "admin@company.org"],

        // Optional: allow a same-host loopback proxy after explicit opt-in
        allowLoopback: false,
      },
    },
  },
}
```

<Warning>
**Aturan runtime penting**

- Autentikasi trusted-proxy menolak permintaan dari sumber loopback (`127.0.0.1`, `::1`, CIDR loopback) secara default.
- Reverse proxy loopback pada host yang sama **tidak** memenuhi autentikasi trusted-proxy kecuali Anda secara eksplisit menetapkan `gateway.auth.trustedProxy.allowLoopback = true` dan menyertakan alamat loopback dalam `gateway.trustedProxies`.
- `allowLoopback` memercayai proses lokal pada host Gateway dengan tingkat yang sama seperti reverse proxy. Aktifkan hanya ketika Gateway masih dibatasi firewall dari akses jarak jauh langsung dan proxy lokal menghapus atau menimpa header identitas yang diberikan klien.
- Klien Gateway internal yang tidak melewati reverse proxy harus menggunakan `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, bukan header identitas trusted-proxy.
- Deployment Control UI non-loopback tetap memerlukan `gateway.controlUi.allowedOrigins` yang eksplisit.
- **Bukti header terusan mengesampingkan lokalitas loopback untuk fallback langsung lokal.** Jika permintaan tiba melalui loopback tetapi membawa bukti header `Forwarded`, `X-Forwarded-*` apa pun, atau `X-Real-IP`, bukti tersebut mendiskualifikasi fallback kata sandi local-direct dan gating identitas perangkat. Dengan `allowLoopback: true`, autentikasi trusted-proxy masih dapat menerima permintaan sebagai permintaan proxy host yang sama, sementara `requiredHeaders` dan `allowUsers` tetap berlaku.

</Warning>

### Referensi konfigurasi

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Array alamat IP proxy yang dipercaya. Permintaan dari IP lain ditolak.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  Harus berupa `"trusted-proxy"`.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Nama header yang berisi identitas pengguna yang telah diautentikasi.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  Header tambahan yang harus ada agar permintaan dipercaya.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Daftar izin identitas pengguna. Kosong berarti mengizinkan semua pengguna yang telah diautentikasi.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean">
  Dukungan opt-in untuk reverse proxy loopback pada host yang sama. Defaultnya `false`.
</ParamField>

<Warning>
Aktifkan `allowLoopback` hanya ketika reverse proxy lokal adalah batas kepercayaan yang dimaksud. Proses lokal apa pun yang dapat terhubung ke Gateway dapat mencoba mengirim header identitas proxy, jadi jaga agar akses langsung Gateway tetap privat untuk host dan wajibkan header milik proxy seperti `x-forwarded-proto` atau header asersi bertanda tangan jika proxy Anda mendukungnya.
</Warning>

## Terminasi TLS dan HSTS

Gunakan satu titik terminasi TLS dan terapkan HSTS di sana.

<Tabs>
  <Tab title="Terminasi TLS proxy (direkomendasikan)">
    Ketika reverse proxy Anda menangani HTTPS untuk `https://control.example.com`, tetapkan `Strict-Transport-Security` di proxy untuk domain tersebut.

    - Cocok untuk deployment yang menghadap internet.
    - Menjaga kebijakan sertifikat + pengerasan HTTP di satu tempat.
    - OpenClaw dapat tetap berada pada HTTP loopback di belakang proxy.

    Contoh nilai header:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Terminasi TLS Gateway">
    Jika OpenClaw sendiri melayani HTTPS secara langsung (tanpa proxy yang melakukan terminasi TLS), tetapkan:

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

    `strictTransportSecurity` menerima nilai header string, atau `false` untuk menonaktifkan secara eksplisit.

  </Tab>
</Tabs>

### Panduan rollout

- Mulai dengan usia maksimum singkat terlebih dahulu (misalnya `max-age=300`) saat memvalidasi lalu lintas.
- Tingkatkan ke nilai berumur panjang (misalnya `max-age=31536000`) hanya setelah keyakinan tinggi.
- Tambahkan `includeSubDomains` hanya jika setiap subdomain siap HTTPS.
- Gunakan preload hanya jika Anda sengaja memenuhi persyaratan preload untuk seluruh kumpulan domain Anda.
- Pengembangan lokal khusus loopback tidak mendapat manfaat dari HSTS.

## Contoh penyiapan proxy

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium meneruskan identitas dalam `x-pomerium-claim-email` (atau header klaim lain) dan JWT dalam `x-pomerium-jwt-assertion`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Pomerium's IP
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
        trustedProxies: ["10.0.0.1"], // Caddy/sidecar proxy IP
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

    ```
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
        trustedProxies: ["10.0.0.1"], // nginx/oauth2-proxy IP
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
  <Accordion title="Traefik dengan forward auth">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // Traefik container IP
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

OpenClaw menolak konfigurasi ambigu ketika `gateway.auth.token` (atau `OPENCLAW_GATEWAY_TOKEN`) dan mode `trusted-proxy` sama-sama aktif pada saat yang sama. Konfigurasi token campuran dapat menyebabkan permintaan loopback diam-diam diautentikasi melalui jalur autentikasi yang salah.

Jika Anda melihat galat `mixed_trusted_proxy_token` saat startup:

- Hapus token bersama saat menggunakan mode trusted-proxy, atau
- Alihkan `gateway.auth.mode` ke `"token"` jika Anda bermaksud menggunakan autentikasi berbasis token.

Header identitas trusted-proxy loopback tetap gagal tertutup: pemanggil dari host yang sama tidak diautentikasi secara diam-diam sebagai pengguna proxy. Pemanggil internal OpenClaw yang melewati proxy dapat menggunakan `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` sebagai gantinya. Fallback token tetap sengaja tidak didukung dalam mode trusted-proxy.

## Header cakupan operator

Autentikasi trusted-proxy adalah mode HTTP yang **membawa identitas**, sehingga pemanggil dapat secara opsional mendeklarasikan cakupan operator dengan `x-openclaw-scopes` pada permintaan HTTP API.

Catatan: Cakupan WebSocket ditentukan oleh handshake protokol Gateway dan pengikatan identitas perangkat. Pada permintaan upgrade WebSocket Control UI, `x-openclaw-scopes` hanya merupakan batas atas untuk cakupan sesi yang dinegosiasikan, bukan pemberian izin. Untuk perilaku cakupan WebSocket dengan trusted-proxy, lihat [perilaku pairing Control UI](#control-ui-pairing-behavior).

Contoh:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Perilaku:

- Ketika header ada, OpenClaw menghormati set cakupan yang dideklarasikan.
- Ketika header ada tetapi kosong, permintaan mendeklarasikan **tanpa** cakupan operator.
- Ketika header tidak ada, HTTP API normal yang membawa identitas menggunakan fallback ke set cakupan default operator standar.
- **Rute HTTP plugin** dengan autentikasi Gateway lebih sempit secara default: ketika `x-openclaw-scopes` tidak ada, cakupan runtime-nya menggunakan fallback ke `operator.write`.
- Permintaan HTTP dari asal browser tetap harus lolos `gateway.controlUi.allowedOrigins` (atau mode fallback Host-header yang disengaja) bahkan setelah autentikasi trusted-proxy berhasil.
- Untuk sesi WebSocket Control UI, `x-openclaw-scopes` adalah batas cakupan saat ada pada permintaan upgrade. Nilai kosong menghasilkan tanpa cakupan.

Aturan praktis: kirim `x-openclaw-scopes` secara eksplisit ketika Anda ingin permintaan trusted-proxy lebih sempit daripada default, atau ketika rute plugin dengan autentikasi gateway memerlukan sesuatu yang lebih kuat daripada cakupan tulis.

## Daftar periksa keamanan

Sebelum mengaktifkan autentikasi trusted-proxy, verifikasi:

- [ ] **Proxy adalah satu-satunya jalur**: Port Gateway dibatasi firewall dari semuanya kecuali proxy Anda.
- [ ] **trustedProxies minimal**: Hanya IP proxy Anda yang sebenarnya, bukan seluruh subnet.
- [ ] **Sumber proxy loopback disengaja**: autentikasi trusted-proxy gagal tertutup untuk permintaan bersumber loopback kecuali `gateway.auth.trustedProxy.allowLoopback` diaktifkan secara eksplisit untuk proxy pada host yang sama.
- [ ] **Proxy menghapus header**: Proxy Anda menimpa (bukan menambahkan) header `x-forwarded-*` dari klien.
- [ ] **Terminasi TLS**: Proxy Anda menangani TLS; pengguna terhubung melalui HTTPS.
- [ ] **allowedOrigins eksplisit**: Control UI non-loopback menggunakan `gateway.controlUi.allowedOrigins` eksplisit.
- [ ] **allowUsers disetel** (direkomendasikan): Batasi ke pengguna yang dikenal, alih-alih mengizinkan siapa pun yang terautentikasi.
- [ ] **Tidak ada konfigurasi token campuran**: Jangan setel `gateway.auth.token` dan `gateway.auth.mode: "trusted-proxy"` sekaligus.
- [ ] **Fallback kata sandi lokal bersifat privat**: Jika Anda mengonfigurasi `gateway.auth.password` untuk pemanggil langsung internal, pastikan port Gateway dibatasi firewall agar klien jarak jauh non-proxy tidak dapat mengaksesnya secara langsung.

## Audit keamanan

`openclaw security audit` akan menandai autentikasi trusted-proxy dengan temuan tingkat keparahan **kritis**. Ini disengaja — ini adalah pengingat bahwa Anda mendelegasikan keamanan ke penyiapan proxy Anda.

Audit memeriksa:

- Peringatan/pengingat kritis dasar `gateway.trusted_proxy_auth`
- Konfigurasi `trustedProxies` yang hilang
- Konfigurasi `userHeader` yang hilang
- `allowUsers` kosong (mengizinkan pengguna terautentikasi mana pun)
- `allowLoopback` diaktifkan untuk sumber proxy pada host yang sama
- Kebijakan asal browser wildcard atau hilang pada permukaan Control UI yang terekspos

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    Permintaan tidak berasal dari IP dalam `gateway.trustedProxies`. Periksa:

    - Apakah IP proxy benar? (IP kontainer Docker dapat berubah.)
    - Apakah ada load balancer di depan proxy Anda?
    - Gunakan `docker inspect` atau `kubectl get pods -o wide` untuk menemukan IP sebenarnya.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw menolak permintaan trusted-proxy bersumber loopback.

    Periksa:

    - Apakah proxy terhubung dari `127.0.0.1` / `::1`?
    - Apakah Anda mencoba menggunakan autentikasi trusted-proxy dengan reverse proxy loopback pada host yang sama?

    Perbaikan:

    - Utamakan autentikasi token/kata sandi untuk klien internal pada host yang sama yang tidak melalui proxy, atau
    - Rutekan melalui alamat proxy tepercaya non-loopback dan simpan IP tersebut dalam `gateway.trustedProxies`, atau
    - Untuk reverse proxy pada host yang sama yang disengaja, setel `gateway.auth.trustedProxy.allowLoopback = true`, simpan alamat loopback dalam `gateway.trustedProxies`, dan pastikan proxy menghapus atau menimpa header identitas.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    Header pengguna kosong atau hilang. Periksa:

    - Apakah proxy Anda dikonfigurasi untuk meneruskan header identitas?
    - Apakah nama header benar? (tidak peka huruf besar/kecil, tetapi ejaan tetap penting)
    - Apakah pengguna benar-benar terautentikasi di proxy?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Header wajib tidak ada. Periksa:

    - Konfigurasi proxy Anda untuk header spesifik tersebut.
    - Apakah header dihapus di suatu tempat dalam rantai.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    Pengguna terautentikasi tetapi tidak ada dalam `allowUsers`. Tambahkan pengguna tersebut atau hapus allowlist.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Autentikasi trusted-proxy berhasil, tetapi header `Origin` browser tidak lolos pemeriksaan asal Control UI.

    Periksa:

    - `gateway.controlUi.allowedOrigins` mencakup asal browser yang tepat.
    - Anda tidak mengandalkan asal wildcard kecuali Anda memang sengaja menginginkan perilaku izinkan-semua.
    - Jika Anda sengaja menggunakan mode fallback Host-header, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` disetel secara sengaja.

  </Accordion>
  <Accordion title="Connection succeeds but methods report missing scope">
    WebSocket terhubung, tetapi `chat.history`, `sessions.list`, atau
    `models.list` gagal dengan `missing scope: operator.read`.

    Penyebab umum:

    - Sesi Control UI tanpa perangkat: autentikasi trusted-proxy dapat mengizinkan koneksi WebSocket tanpa identitas perangkat, tetapi OpenClaw menghapus cakupan pada sesi tanpa perangkat sesuai desain.
    - Klien backend kustom: `gateway.controlUi.dangerouslyDisableDeviceAuth` memiliki cakupan Control UI dan tidak memberikan cakupan ke klien WebSocket backend arbitrer atau berbentuk CLI.
    - `x-openclaw-scopes` terlalu sempit: jika proxy Anda menyuntikkan header ini pada permintaan upgrade WebSocket Control UI, cakupan sesi dibatasi ke set tersebut. Nilai header kosong menghasilkan tanpa cakupan.

    Perbaikan:

    - Untuk Control UI, gunakan HTTPS agar browser dapat menghasilkan identitas perangkat dan menyelesaikan pairing.
    - Untuk automasi kustom, gunakan identitas/pairing perangkat, jalur pembantu backend `gateway-client` direct-local yang dicadangkan, atau [admin HTTP RPC](/id/plugins/admin-http-rpc).
    - Gunakan `gateway.controlUi.dangerouslyDisableDeviceAuth: true` hanya sebagai jalur darurat sementara untuk Control UI.

  </Accordion>
  <Accordion title="WebSocket still failing">
    Pastikan proxy Anda:

    - Mendukung upgrade WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - Meneruskan header identitas pada permintaan upgrade WebSocket (bukan hanya HTTP).
    - Tidak memiliki jalur autentikasi terpisah untuk koneksi WebSocket.

  </Accordion>
</AccordionGroup>

## Migrasi dari autentikasi token

Jika Anda berpindah dari autentikasi token ke trusted-proxy:

<Steps>
  <Step title="Configure the proxy">
    Konfigurasikan proxy Anda untuk mengautentikasi pengguna dan meneruskan header.
  </Step>
  <Step title="Test the proxy independently">
    Uji penyiapan proxy secara terpisah (`curl` dengan header).
  </Step>
  <Step title="Update OpenClaw config">
    Perbarui konfigurasi OpenClaw dengan autentikasi trusted-proxy.
  </Step>
  <Step title="Restart the Gateway">
    Mulai ulang Gateway.
  </Step>
  <Step title="Test WebSocket">
    Uji koneksi WebSocket dari Control UI.
  </Step>
  <Step title="Audit">
    Jalankan `openclaw security audit` dan tinjau temuannya.
  </Step>
</Steps>

## Terkait

- [Konfigurasi](/id/gateway/configuration) — referensi konfigurasi
- [Akses jarak jauh](/id/gateway/remote) — pola akses jarak jauh lainnya
- [Keamanan](/id/gateway/security) — panduan keamanan lengkap
- [Tailscale](/id/gateway/tailscale) — alternatif yang lebih sederhana untuk akses khusus tailnet
