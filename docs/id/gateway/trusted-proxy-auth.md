---
read_when:
    - Menjalankan OpenClaw di belakang proksi berbasis identitas
    - Menyiapkan Pomerium, Caddy, atau nginx dengan OAuth di depan OpenClaw
    - Memperbaiki galat WebSocket 1008 tidak terotorisasi pada konfigurasi proksi balik
    - Menentukan tempat menetapkan HSTS dan header penguatan HTTP lainnya
sidebarTitle: Trusted proxy auth
summary: Delegasikan autentikasi Gateway ke proksi terbalik tepercaya (Pomerium, Caddy, nginx + OAuth)
title: Autentikasi proksi tepercaya
x-i18n:
    generated_at: "2026-07-12T14:16:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 612070e4872af23c2ac41b529c8b2fa8513bf18fccc053783f55ad00b44e1a5f
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Fitur yang sensitif terhadap keamanan.** Mode ini mendelegasikan autentikasi sepenuhnya kepada proksi terbalik Anda. Kesalahan konfigurasi dapat mengekspos Gateway Anda terhadap akses tanpa izin. Baca halaman ini dengan saksama sebelum mengaktifkannya.
</Warning>

## Kapan digunakan

- Anda menjalankan OpenClaw di belakang **proksi berbasis identitas** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + autentikasi yang diteruskan).
- Proksi Anda menangani seluruh autentikasi dan meneruskan identitas pengguna melalui header.
- Anda berada dalam lingkungan Kubernetes atau kontainer tempat proksi merupakan satu-satunya jalur menuju Gateway.
- Anda mengalami galat WebSocket `1008 unauthorized` karena peramban tidak dapat meneruskan token dalam payload WS.

## Kapan JANGAN digunakan

- Proksi Anda tidak mengautentikasi pengguna (hanya sebagai terminator TLS atau penyeimbang beban).
- Ada jalur apa pun menuju Gateway yang melewati proksi (celah firewall, akses jaringan internal).
- Anda tidak yakin apakah proksi Anda menghapus/menimpa header yang diteruskan dengan benar.
- Anda hanya memerlukan akses pribadi untuk satu pengguna (pertimbangkan Tailscale Serve + local loopback sebagai gantinya).

## Cara kerjanya

<Steps>
  <Step title="Proksi mengautentikasi pengguna">
    Proksi terbalik Anda mengautentikasi pengguna (OAuth, OIDC, SAML, dan sebagainya).
  </Step>
  <Step title="Proksi menambahkan header identitas">
    Proksi menambahkan header yang berisi identitas pengguna yang telah diautentikasi (misalnya, `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway memverifikasi sumber tepercaya">
    OpenClaw memeriksa bahwa permintaan berasal dari **IP proksi tepercaya** (`gateway.trustedProxies`) dan bukan dari local loopback milik Gateway atau alamat antarmuka lokalnya.
  </Step>
  <Step title="Gateway mengekstrak identitas">
    OpenClaw membaca header yang diwajibkan, lalu identitas pengguna dari header yang dikonfigurasi.
  </Step>
  <Step title="Memberikan otorisasi">
    Jika semua pemeriksaan berhasil dan pengguna lolos `allowUsers` (jika ditetapkan), permintaan diberi otorisasi.
  </Step>
</Steps>

## Konfigurasi

```json5
{
  gateway: {
    // Autentikasi proksi tepercaya secara default mengharapkan IP sumber proksi bukan loopback
    bind: "lan",

    // KRITIS: Hanya tambahkan IP proksi Anda di sini
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
      },
    },
  },
}
```

<Warning>
**Aturan waktu proses, sesuai urutan evaluasi**

1. IP sumber permintaan harus cocok dengan `gateway.trustedProxies` (mendukung CIDR), atau permintaan ditolak (`trusted_proxy_untrusted_source`).
2. Permintaan dari sumber loopback (`127.0.0.1`, `::1`) ditolak kecuali `gateway.auth.trustedProxy.allowLoopback = true` dan alamat loopback juga tercantum dalam `trustedProxies` (`trusted_proxy_loopback_source`). Pemeriksaan ini dijalankan sebelum pemeriksaan header, sehingga sumber loopback gagal dengan cara ini meskipun header yang diwajibkan juga tidak ada.
3. Sumber non-loopback yang cocok dengan salah satu alamat antarmuka jaringan lokal milik host Gateway ditolak sebagai perlindungan terhadap pemalsuan (`trusted_proxy_local_interface_source`). Jika penemuan antarmuka itu sendiri gagal, permintaan juga ditolak (`trusted_proxy_local_interface_check_failed`).
4. `requiredHeaders` dan `userHeader` harus ada dan tidak boleh kosong.
5. `allowUsers`, jika tidak kosong, harus mencakup pengguna yang diekstrak.

**Bukti header yang diteruskan mengesampingkan sifat lokal loopback untuk fallback lokal langsung.** Jika permintaan tiba melalui loopback tetapi membawa header `Forwarded`, `X-Forwarded-*` apa pun, atau `X-Real-IP`, bukti tersebut membuatnya tidak memenuhi syarat untuk fallback kata sandi lokal langsung dan pembatasan identitas perangkat, meskipun autentikasi proksi tepercaya tetap gagal karena berasal dari loopback.

`allowLoopback` memercayai proses lokal pada host Gateway hingga tingkat yang sama dengan proksi terbalik. Aktifkan hanya jika Gateway masih dilindungi firewall dari akses jarak jauh langsung dan proksi lokal menghapus atau menimpa header identitas yang diberikan klien.

Klien internal Gateway yang tidak melewati proksi terbalik harus menggunakan `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, bukan header identitas proksi tepercaya. Penerapan Control UI non-loopback tetap memerlukan `gateway.controlUi.allowedOrigins` secara eksplisit.
</Warning>

### Referensi konfigurasi

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Larik alamat IP proksi (atau CIDR) yang akan dipercaya. Permintaan dari IP lain ditolak.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  Harus berupa `"trusted-proxy"`.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Nama header yang berisi identitas pengguna terautentikasi.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  Header tambahan yang harus ada agar permintaan dapat dipercaya.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Daftar izin identitas pengguna. Kosong berarti mengizinkan semua pengguna terautentikasi.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean" default="false">
  Dukungan dengan persetujuan eksplisit untuk proksi terbalik loopback pada host yang sama.
</ParamField>

<Warning>
Aktifkan `allowLoopback` hanya jika proksi terbalik lokal merupakan batas kepercayaan yang dimaksudkan. Setiap proses lokal yang dapat terhubung ke Gateway dapat mencoba mengirim header identitas proksi, jadi jaga agar akses langsung ke Gateway tetap bersifat privat pada host dan wajibkan header milik proksi seperti `x-forwarded-proto`, atau header pernyataan bertanda tangan jika proksi Anda mendukungnya.
</Warning>

## Perilaku pemasangan Control UI

Saat `gateway.auth.mode = "trusted-proxy"` aktif dan permintaan lolos pemeriksaan proksi tepercaya, sesi WebSocket Control UI dapat terhubung tanpa identitas pemasangan perangkat.

Implikasi cakupan:

- Sesi WebSocket Control UI tanpa perangkat dapat terhubung, tetapi secara default tidak menerima cakupan operator. OpenClaw mengosongkan daftar cakupan yang diminta menjadi `[]` agar sesi yang tidak terikat pada perangkat/token terpasang yang telah disetujui tidak dapat mendeklarasikan izinnya sendiri.
- Jika metode gagal dengan `missing scope` setelah koneksi WebSocket berhasil, gunakan HTTPS agar peramban dapat membuat identitas perangkat dan menyelesaikan pemasangan. Lihat [HTTP Control UI yang tidak aman](/id/web/control-ui#insecure-http).
- Hanya untuk kondisi darurat: `gateway.controlUi.dangerouslyDisableDeviceAuth=true` mempertahankan cakupan yang diminta bahkan tanpa identitas perangkat. Ini merupakan penurunan keamanan yang parah; segera kembalikan pengaturan tersebut. Lihat [HTTP Control UI yang tidak aman](/id/web/control-ui#insecure-http).

Pembatasan cakupan oleh proksi terbalik: jika proksi Anda mengirim `x-openclaw-scopes` pada permintaan peningkatan WebSocket Control UI, OpenClaw membatasi cakupan sesi menjadi irisan antara cakupan yang diminta dan cakupan yang dideklarasikan. Header ini tidak memberikan cakupan; header ini hanya mempersempit cakupan yang dapat dimiliki sesi.

Implikasi:

- Pemasangan tidak lagi menjadi pembatas utama untuk akses Control UI dalam mode ini.
- Kebijakan autentikasi proksi terbalik dan `allowUsers` Anda menjadi kontrol akses yang efektif.
- Pastikan lalu lintas masuk Gateway dikunci hanya untuk IP proksi tepercaya (`gateway.trustedProxies` + firewall).

Klien WebSocket khusus bukanlah sesi Control UI. `gateway.controlUi.dangerouslyDisableDeviceAuth` tidak memberikan cakupan kepada klien arbitrer berbentuk `client.mode: "backend"` atau CLI. Otomatisasi khusus harus menggunakan identitas/pemasangan perangkat, jalur pembantu backend lokal langsung yang dicadangkan dengan `client.id: "gateway-client"`, atau [Plugin RPC HTTP admin](/id/plugins/admin-http-rpc) jika antarmuka permintaan/respons HTTP lebih sesuai.

## Header cakupan operator

Autentikasi proksi tepercaya adalah mode HTTP yang **membawa identitas**, sehingga pemanggil dapat secara opsional mendeklarasikan cakupan operator dengan `x-openclaw-scopes` pada permintaan API HTTP.

Catatan: Cakupan WebSocket ditentukan oleh jabat tangan protokol Gateway dan pengikatan identitas perangkat. Pada permintaan peningkatan WebSocket Control UI, `x-openclaw-scopes` hanya membatasi cakupan sesi yang dinegosiasikan, bukan memberikannya. Lihat [Perilaku pemasangan Control UI](#control-ui-pairing-behavior).

Contoh:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Perilaku:

- Saat header ada, OpenClaw mematuhi kumpulan cakupan yang dideklarasikan.
- Saat header ada tetapi kosong, permintaan mendeklarasikan **tidak ada** cakupan operator.
- Saat header tidak ada, API HTTP normal yang membawa identitas kembali menggunakan kumpulan cakupan operator standar bawaan (`operator.admin`, `operator.read`, `operator.write`, `operator.approvals`, `operator.pairing`, `operator.talk.secrets`).
- **Rute HTTP Plugin** dengan autentikasi Gateway secara default memiliki cakupan yang lebih sempit: saat `x-openclaw-scopes` tidak ada, cakupan waktu prosesnya kembali hanya ke `operator.write`.
- Permintaan HTTP yang berasal dari peramban tetap harus lolos `gateway.controlUi.allowedOrigins` (atau mode fallback header Host yang disengaja), bahkan setelah autentikasi proksi tepercaya berhasil.

Aturan praktis: kirim `x-openclaw-scopes` secara eksplisit jika Anda ingin permintaan proksi tepercaya lebih sempit daripada nilai bawaan, atau saat rute Plugin dengan autentikasi Gateway memerlukan cakupan yang lebih kuat daripada cakupan tulis.

## Terminasi TLS dan HSTS

Gunakan satu titik terminasi TLS dan terapkan HSTS di sana.

<Tabs>
  <Tab title="Terminasi TLS pada proksi (direkomendasikan)">
    Saat proksi terbalik menangani HTTPS untuk `https://control.example.com`, tetapkan `Strict-Transport-Security` pada proksi untuk domain tersebut.

    - Cocok untuk penerapan yang terhubung ke internet.
    - Menyatukan kebijakan sertifikat + penguatan HTTP di satu tempat.
    - OpenClaw dapat tetap menggunakan HTTP loopback di belakang proksi.

    Contoh nilai header:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Terminasi TLS pada Gateway">
    Jika OpenClaw sendiri menyajikan HTTPS secara langsung (tanpa proksi yang melakukan terminasi TLS), tetapkan:

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

- Mulailah dengan usia maksimum yang singkat terlebih dahulu (misalnya `max-age=300`) sambil memvalidasi lalu lintas.
- Tingkatkan ke nilai berumur panjang (misalnya `max-age=31536000`) hanya setelah tingkat keyakinan tinggi.
- Tambahkan `includeSubDomains` hanya jika setiap subdomain siap menggunakan HTTPS.
- Gunakan pramuat hanya jika Anda sengaja memenuhi persyaratan pramuat untuk seluruh kumpulan domain Anda.
- Pengembangan lokal khusus loopback tidak memperoleh manfaat dari HSTS.

## Contoh penyiapan proksi

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
    Caddy dengan Plugin `caddy-security` dapat mengautentikasi pengguna dan meneruskan header identitas.

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
  <Accordion title="Traefik with forward auth">
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

Saat dimulai, Gateway menolak autentikasi trusted-proxy jika token bersama juga dikonfigurasi (`gateway.auth.token` atau `OPENCLAW_GATEWAY_TOKEN`). Keduanya saling eksklusif karena token bersama akan memungkinkan pemanggil pada host yang sama melakukan autentikasi melalui jalur yang sepenuhnya berbeda dari identitas terverifikasi proxy yang seharusnya diberlakukan oleh mode ini.

Jika proses awal gagal dengan galat seperti `gateway auth mode is trusted-proxy, but a shared token is also configured`:

- Hapus token bersama saat menggunakan mode trusted-proxy, atau
- Ubah `gateway.auth.mode` menjadi `"token"` jika Anda bermaksud menggunakan autentikasi berbasis token.

Header identitas trusted-proxy loopback tetap gagal secara tertutup: pemanggil pada host yang sama tidak diautentikasi secara diam-diam sebagai pengguna proxy. Pemanggil internal OpenClaw yang melewati proxy dapat melakukan autentikasi menggunakan `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. Fallback token tetap sengaja tidak didukung dalam mode trusted-proxy.

## Daftar periksa keamanan

Sebelum mengaktifkan autentikasi trusted-proxy, verifikasi:

- [ ] **Proxy adalah satu-satunya jalur**: Porta Gateway dibatasi oleh firewall dari semua pihak kecuali proxy Anda.
- [ ] **trustedProxies dibuat seminimal mungkin**: Hanya alamat IP proxy Anda yang sebenarnya, bukan seluruh subnet.
- [ ] **Sumber proxy loopback digunakan secara sengaja**: Autentikasi trusted-proxy gagal secara tertutup untuk permintaan yang bersumber dari loopback kecuali `gateway.auth.trustedProxy.allowLoopback` diaktifkan secara eksplisit untuk proxy pada host yang sama.
- [ ] **Proxy menghapus header**: Proxy Anda menimpa (bukan menambahkan) header `x-forwarded-*` dari klien.
- [ ] **Terminasi TLS**: Proxy Anda menangani TLS; pengguna terhubung melalui HTTPS.
- [ ] **allowedOrigins ditentukan secara eksplisit**: UI Kontrol non-loopback menggunakan `gateway.controlUi.allowedOrigins` yang ditentukan secara eksplisit.
- [ ] **allowUsers ditetapkan** (disarankan): Batasi akses ke pengguna yang dikenal, bukan mengizinkan siapa pun yang terautentikasi.
- [ ] **Tidak ada konfigurasi token campuran**: Jangan menetapkan `gateway.auth.token` dan `gateway.auth.mode: "trusted-proxy"` secara bersamaan.
- [ ] **Fallback kata sandi lokal bersifat privat**: Jika Anda mengonfigurasi `gateway.auth.password` untuk pemanggil langsung internal, lindungi porta Gateway dengan firewall agar klien jarak jauh non-proxy tidak dapat mengaksesnya secara langsung.

## Audit keamanan

`openclaw security audit` menandai autentikasi trusted-proxy dengan temuan berkeparahan **kritis**. Hal ini disengaja; ini merupakan pengingat bahwa Anda mendelegasikan keamanan kepada penyiapan proxy Anda.

Audit memeriksa hal-hal berikut:

- Peringatan/pengingat kritis dasar `gateway.trusted_proxy_auth`.
- Konfigurasi `trustedProxies` yang tidak ada.
- Konfigurasi `userHeader` yang tidak ada.
- `allowUsers` kosong (mengizinkan semua pengguna yang terautentikasi).
- `allowLoopback` diaktifkan untuk sumber proxy pada host yang sama.

Temuan terpisah yang tidak khusus untuk trusted-proxy juga berlaku setiap kali UI Kontrol diekspos: `gateway.controlUi.allowedOrigins` yang menggunakan wildcard atau tidak ada, serta fallback asal berdasarkan header Host.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    Permintaan tidak berasal dari alamat IP dalam `gateway.trustedProxies`. Periksa:

    - Apakah alamat IP proxy sudah benar? (Alamat IP kontainer Docker dapat berubah.)
    - Apakah terdapat penyeimbang beban di depan proxy Anda?
    - Gunakan `docker inspect` atau `kubectl get pods -o wide` untuk menemukan alamat IP yang sebenarnya.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw menolak permintaan trusted-proxy yang bersumber dari loopback.

    Periksa:

    - Apakah proxy terhubung dari `127.0.0.1` / `::1`?
    - Apakah Anda mencoba menggunakan autentikasi trusted-proxy dengan reverse proxy loopback pada host yang sama?

    Perbaikan:

    - Utamakan autentikasi token/kata sandi untuk klien internal pada host yang sama yang tidak melalui proxy, atau
    - Rutekan melalui alamat proxy tepercaya non-loopback dan pertahankan alamat IP tersebut dalam `gateway.trustedProxies`, atau
    - Untuk reverse proxy yang sengaja dijalankan pada host yang sama, tetapkan `gateway.auth.trustedProxy.allowLoopback = true`, pertahankan alamat loopback dalam `gateway.trustedProxies`, dan pastikan proxy menghapus atau menimpa header identitas.

  </Accordion>
  <Accordion title="trusted_proxy_local_interface_source / trusted_proxy_local_interface_check_failed">
    Alamat IP sumber permintaan cocok dengan salah satu alamat antarmuka jaringan non-loopback milik host Gateway sendiri (bukan proxy), sebagai perlindungan terhadap lalu lintas host yang sama yang dipalsukan pada tailnet atau jaringan bridge Docker. `..._check_failed` berarti penemuan antarmuka itu sendiri mengalami galat, sehingga OpenClaw gagal secara tertutup.

    Periksa:

    - Apakah suatu proses pada host Gateway mengirimkan header identitas secara langsung dan melewati proxy?
    - Apakah proxy berjalan dalam namespace jaringan yang sama dengan Gateway, menggunakan alamat IP yang juga muncul sebagai antarmuka lokal?

    Perbaikan: rutekan lalu lintas proxy melalui alamat yang tidak turut terikat secara lokal oleh host Gateway, atau gunakan `allowLoopback` hanya untuk penyiapan proxy pada host yang sama yang sebenarnya.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    Header pengguna kosong atau tidak ada. Periksa:

    - Apakah proxy Anda dikonfigurasi untuk meneruskan header identitas?
    - Apakah nama header sudah benar? (tidak peka huruf besar-kecil, tetapi ejaannya harus tepat)
    - Apakah pengguna benar-benar telah diautentikasi pada proxy?

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
    `gateway.auth.mode` bernilai `"trusted-proxy"`, tetapi `gateway.trustedProxies` kosong, atau `gateway.auth.trustedProxy` itu sendiri tidak ada. Setiap permintaan ditolak hingga keduanya ditetapkan.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Autentikasi trusted-proxy berhasil, tetapi header `Origin` browser tidak lolos pemeriksaan asal UI Kontrol.

    Periksa:

    - `gateway.controlUi.allowedOrigins` mencakup asal browser yang persis sama.
    - Anda tidak mengandalkan asal wildcard kecuali memang sengaja menginginkan perilaku izinkan semua.
    - Jika Anda sengaja menggunakan mode fallback berdasarkan header Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` ditetapkan secara sengaja.

  </Accordion>
  <Accordion title="Connection succeeds but methods report missing scope">
    WebSocket berhasil terhubung, tetapi `chat.history`, `sessions.list`, atau
    `models.list` gagal dengan `missing scope: operator.read`.

    Penyebab umum:

    - Sesi UI Kontrol tanpa perangkat: autentikasi trusted-proxy dapat menerima koneksi WebSocket tanpa identitas perangkat, tetapi OpenClaw sengaja menghapus cakupan pada sesi tanpa perangkat.
    - Klien backend khusus: `gateway.controlUi.dangerouslyDisableDeviceAuth` hanya berlaku untuk UI Kontrol dan tidak memberikan cakupan kepada klien backend arbitrer atau klien WebSocket berbentuk CLI.
    - `x-openclaw-scopes` terlalu sempit: jika proxy Anda menyisipkan header ini pada permintaan peningkatan WebSocket UI Kontrol, cakupan sesi dibatasi pada kumpulan tersebut. Nilai header kosong menghasilkan tanpa cakupan.

    Perbaikan:

    - Untuk UI Kontrol, gunakan HTTPS agar browser dapat menghasilkan identitas perangkat dan menyelesaikan pemasangan.
    - Untuk otomatisasi khusus, gunakan identitas/pemasangan perangkat, jalur bantuan backend langsung-lokal `gateway-client` yang dicadangkan, atau [RPC HTTP admin](/id/plugins/admin-http-rpc).
    - Gunakan `gateway.controlUi.dangerouslyDisableDeviceAuth: true` hanya sebagai jalur darurat sementara untuk UI Kontrol.

  </Accordion>
  <Accordion title="WebSocket still failing">
    Pastikan proxy Anda:

    - Mendukung peningkatan WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - Meneruskan header identitas pada permintaan peningkatan WebSocket (bukan hanya HTTP).
    - Tidak memiliki jalur autentikasi terpisah untuk koneksi WebSocket.

  </Accordion>
</AccordionGroup>

## Migrasi dari autentikasi token

<Steps>
  <Step title="Configure the proxy">
    Konfigurasikan proxy Anda untuk mengautentikasi pengguna dan meneruskan header.
  </Step>
  <Step title="Test the proxy independently">
    Uji penyiapan proxy secara independen (curl dengan header).
  </Step>
  <Step title="Update OpenClaw config">
    Perbarui konfigurasi OpenClaw dengan autentikasi trusted-proxy.
  </Step>
  <Step title="Restart the Gateway">
    Mulai ulang Gateway.
  </Step>
  <Step title="Test WebSocket">
    Uji koneksi WebSocket dari UI Kontrol.
  </Step>
  <Step title="Audit">
    Jalankan `openclaw security audit` dan tinjau temuannya.
  </Step>
</Steps>

## Terkait

- [Konfigurasi](/id/gateway/configuration) — referensi konfigurasi
- [Cakupan operator](/id/gateway/operator-scopes) — peran, cakupan, dan pemeriksaan persetujuan
- [Akses jarak jauh](/id/gateway/remote) — pola akses jarak jauh lainnya
- [Keamanan](/id/gateway/security) — panduan keamanan lengkap
- [Tailscale](/id/gateway/tailscale) — alternatif yang lebih sederhana untuk akses khusus tailnet
