---
read_when:
    - Menjalankan OpenClaw di belakang proxy yang sadar identitas
    - Menyiapkan Pomerium, Caddy, atau nginx dengan OAuth di depan OpenClaw
    - Memperbaiki error WebSocket 1008 unauthorized pada penyiapan reverse proxy
    - Menentukan tempat mengatur HSTS dan header hardening HTTP lainnya
sidebarTitle: Trusted proxy auth
summary: Delegasikan autentikasi gateway ke reverse proxy tepercaya (Pomerium, Caddy, nginx + OAuth)
title: Auth trusted-proxy
x-i18n:
    generated_at: "2026-04-26T11:31:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64e0f4dee942aedec548135f0408e7773e7b498f8262af13a4d0eff262cae646
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

<Warning>
**Fitur sensitif keamanan.** Mode ini mendelegasikan autentikasi sepenuhnya ke reverse proxy Anda. Salah konfigurasi dapat mengekspos Gateway Anda ke akses tanpa otorisasi. Baca halaman ini dengan cermat sebelum mengaktifkannya.
</Warning>

## Kapan digunakan

Gunakan mode auth `trusted-proxy` ketika:

- Anda menjalankan OpenClaw di belakang **proxy yang sadar identitas** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth).
- Proxy Anda menangani seluruh autentikasi dan meneruskan identitas pengguna melalui header.
- Anda berada di environment Kubernetes atau container tempat proxy adalah satu-satunya jalur ke Gateway.
- Anda mengalami error WebSocket `1008 unauthorized` karena browser tidak dapat meneruskan token dalam payload WS.

## Kapan TIDAK digunakan

- Jika proxy Anda tidak mengautentikasi pengguna (hanya terminator TLS atau load balancer).
- Jika ada jalur apa pun ke Gateway yang melewati proxy (lubang firewall, akses jaringan internal).
- Jika Anda tidak yakin apakah proxy Anda dengan benar menghapus/menimpa forwarded header.
- Jika Anda hanya memerlukan akses pribadi pengguna tunggal (pertimbangkan Tailscale Serve + loopback untuk penyiapan yang lebih sederhana).

## Cara kerjanya

<Steps>
  <Step title="Proxy mengautentikasi pengguna">
    Reverse proxy Anda mengautentikasi pengguna (OAuth, OIDC, SAML, dll.).
  </Step>
  <Step title="Proxy menambahkan header identitas">
    Proxy menambahkan header dengan identitas pengguna yang telah diautentikasi (misalnya, `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway memverifikasi source tepercaya">
    OpenClaw memeriksa bahwa permintaan berasal dari **IP proxy tepercaya** (dikonfigurasi di `gateway.trustedProxies`).
  </Step>
  <Step title="Gateway mengekstrak identitas">
    OpenClaw mengekstrak identitas pengguna dari header yang dikonfigurasi.
  </Step>
  <Step title="Otorisasi">
    Jika semuanya lolos pemeriksaan, permintaan diotorisasi.
  </Step>
</Steps>

## Perilaku pairing Control UI

Saat `gateway.auth.mode = "trusted-proxy"` aktif dan permintaan lolos pemeriksaan trusted-proxy, sesi WebSocket Control UI dapat terhubung tanpa identitas device pairing.

Implikasi:

- Pairing tidak lagi menjadi gerbang utama untuk akses Control UI dalam mode ini.
- Kebijakan auth reverse proxy Anda dan `allowUsers` menjadi kontrol akses yang efektif.
- Pastikan ingress gateway tetap dikunci hanya ke IP proxy tepercaya (`gateway.trustedProxies` + firewall).

## Konfigurasi

```json5
{
  gateway: {
    // Auth trusted-proxy mengharapkan permintaan dari source proxy tepercaya non-loopback
    bind: "lan",

    // KRITIS: Hanya tambahkan IP proxy Anda di sini
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header yang berisi identitas pengguna yang sudah diautentikasi (wajib)
        userHeader: "x-forwarded-user",

        // Opsional: header yang HARUS ada (verifikasi proxy)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Opsional: batasi ke pengguna tertentu (kosong = izinkan semua)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

<Warning>
**Aturan runtime penting**

- Auth trusted-proxy menolak permintaan dari source loopback (`127.0.0.1`, `::1`, CIDR loopback).
- Reverse proxy loopback pada host yang sama **tidak** memenuhi auth trusted-proxy.
- Untuk penyiapan proxy loopback pada host yang sama, gunakan auth token/password sebagai gantinya, atau rutekan melalui alamat trusted-proxy non-loopback yang dapat diverifikasi oleh OpenClaw.
- Deployment Control UI non-loopback tetap memerlukan `gateway.controlUi.allowedOrigins` eksplisit.
- **Bukti forwarded-header menimpa lokalitas loopback.** Jika permintaan tiba melalui loopback tetapi membawa header `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` yang menunjuk ke asal non-lokal, bukti tersebut menggugurkan klaim lokalitas loopback. Permintaan diperlakukan sebagai remote untuk pairing, auth trusted-proxy, dan gerbang identitas perangkat Control UI. Ini mencegah proxy loopback pada host yang sama “mencuci” identitas forwarded-header menjadi auth trusted-proxy.
</Warning>

### Referensi konfigurasi

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Array alamat IP proxy yang dipercaya. Permintaan dari IP lain akan ditolak.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  Harus bernilai `"trusted-proxy"`.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Nama header yang berisi identitas pengguna yang telah diautentikasi.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  Header tambahan yang harus ada agar permintaan dipercaya.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Allowlist identitas pengguna. Kosong berarti mengizinkan semua pengguna yang telah diautentikasi.
</ParamField>

## Terminasi TLS dan HSTS

Gunakan satu titik terminasi TLS dan terapkan HSTS di sana.

<Tabs>
  <Tab title="Terminasi TLS proxy (disarankan)">
    Saat reverse proxy Anda menangani HTTPS untuk `https://control.example.com`, atur `Strict-Transport-Security` di proxy untuk domain tersebut.

    - Cocok untuk deployment yang menghadap internet.
    - Menjaga sertifikat + kebijakan hardening HTTP tetap di satu tempat.
    - OpenClaw dapat tetap menggunakan HTTP loopback di belakang proxy.

    Contoh nilai header:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Terminasi TLS Gateway">
    Jika OpenClaw sendiri melayani HTTPS secara langsung (tanpa proxy yang melakukan terminasi TLS), atur:

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

- Mulailah dengan max age singkat terlebih dahulu (misalnya `max-age=300`) sambil memvalidasi trafik.
- Tingkatkan ke nilai jangka panjang (misalnya `max-age=31536000`) hanya setelah keyakinan sudah tinggi.
- Tambahkan `includeSubDomains` hanya jika setiap subdomain sudah siap HTTPS.
- Gunakan preload hanya jika Anda memang memenuhi persyaratan preload untuk seluruh domain Anda.
- Pengembangan lokal khusus loopback tidak mendapat manfaat dari HSTS.

## Contoh penyiapan proxy

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium meneruskan identitas di `x-pomerium-claim-email` (atau header claim lain) dan JWT di `x-pomerium-jwt-assertion`.

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

    Potongan config Pomerium:

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

    Potongan Caddyfile:

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
    oauth2-proxy mengautentikasi pengguna dan meneruskan identitas di `x-auth-request-email`.

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

    Potongan config nginx:

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
        trustedProxies: ["172.17.0.1"], // IP container Traefik
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

OpenClaw menolak konfigurasi ambigu ketika `gateway.auth.token` (atau `OPENCLAW_GATEWAY_TOKEN`) dan mode `trusted-proxy` aktif pada saat yang sama. Config token campuran dapat menyebabkan permintaan loopback diam-diam diautentikasi pada jalur auth yang salah.

Jika Anda melihat error `mixed_trusted_proxy_token` saat startup:

- Hapus shared token saat menggunakan mode trusted-proxy, atau
- Ubah `gateway.auth.mode` ke `"token"` jika Anda memang bermaksud menggunakan auth berbasis token.

Auth trusted-proxy loopback juga gagal secara tertutup: pemanggil pada host yang sama harus menyuplai header identitas yang dikonfigurasi melalui trusted proxy alih-alih diautentikasi diam-diam.

## Header scope operator

Auth trusted-proxy adalah mode HTTP **pembawa identitas**, sehingga pemanggil secara opsional dapat mendeklarasikan scope operator dengan `x-openclaw-scopes`.

Contoh:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Perilaku:

- Saat header ada, OpenClaw menghormati set scope yang dideklarasikan.
- Saat header ada tetapi kosong, permintaan mendeklarasikan **tanpa** scope operator.
- Saat header tidak ada, API HTTP pembawa identitas normal fallback ke set scope default operator standar.
- **Rute HTTP Plugin** gateway-auth lebih sempit secara default: saat `x-openclaw-scopes` tidak ada, scope runtime-nya fallback ke `operator.write`.
- Permintaan HTTP yang berasal dari browser tetap harus lolos `gateway.controlUi.allowedOrigins` (atau mode fallback Host-header yang disengaja) bahkan setelah auth trusted-proxy berhasil.

Aturan praktis: kirim `x-openclaw-scopes` secara eksplisit saat Anda ingin permintaan trusted-proxy lebih sempit daripada default, atau saat rute gateway-auth Plugin memerlukan sesuatu yang lebih kuat daripada scope write.

## Checklist keamanan

Sebelum mengaktifkan auth trusted-proxy, verifikasi:

- [ ] **Proxy adalah satu-satunya jalur**: Port Gateway difirewall dari semua hal kecuali proxy Anda.
- [ ] **trustedProxies minimal**: Hanya IP proxy Anda yang sebenarnya, bukan seluruh subnet.
- [ ] **Tidak ada source proxy loopback**: auth trusted-proxy gagal tertutup untuk permintaan dari source loopback.
- [ ] **Proxy menghapus header**: Proxy Anda menimpa (bukan menambahkan) header `x-forwarded-*` dari klien.
- [ ] **Terminasi TLS**: Proxy Anda menangani TLS; pengguna terhubung melalui HTTPS.
- [ ] **allowedOrigins eksplisit**: Control UI non-loopback menggunakan `gateway.controlUi.allowedOrigins` yang eksplisit.
- [ ] **allowUsers diatur** (disarankan): Batasi ke pengguna yang diketahui daripada mengizinkan siapa saja yang telah diautentikasi.
- [ ] **Tidak ada config token campuran**: Jangan atur `gateway.auth.token` dan `gateway.auth.mode: "trusted-proxy"` sekaligus.

## Audit keamanan

`openclaw security audit` akan menandai auth trusted-proxy dengan temuan severity **critical**. Ini disengaja — ini adalah pengingat bahwa Anda mendelegasikan keamanan ke penyiapan proxy Anda.

Audit memeriksa untuk:

- Peringatan/pengingat critical dasar `gateway.trusted_proxy_auth`
- Konfigurasi `trustedProxies` yang tidak ada
- Konfigurasi `userHeader` yang tidak ada
- `allowUsers` kosong (mengizinkan pengguna terautentikasi mana pun)
- Kebijakan browser-origin wildcard atau tidak ada pada permukaan Control UI yang diekspos

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    Permintaan tidak berasal dari IP dalam `gateway.trustedProxies`. Periksa:

    - Apakah IP proxy benar? (IP container Docker dapat berubah.)
    - Apakah ada load balancer di depan proxy Anda?
    - Gunakan `docker inspect` atau `kubectl get pods -o wide` untuk menemukan IP sebenarnya.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw menolak permintaan trusted-proxy dari source loopback.

    Periksa:

    - Apakah proxy terhubung dari `127.0.0.1` / `::1`?
    - Apakah Anda mencoba menggunakan auth trusted-proxy dengan reverse proxy loopback pada host yang sama?

    Perbaikan:

    - Gunakan auth token/password untuk penyiapan proxy loopback pada host yang sama, atau
    - Rutekan melalui alamat trusted proxy non-loopback dan pertahankan IP itu dalam `gateway.trustedProxies`.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    Header pengguna kosong atau tidak ada. Periksa:

    - Apakah proxy Anda dikonfigurasi untuk meneruskan header identitas?
    - Apakah nama header benar? (tidak peka huruf besar-kecil, tetapi ejaan tetap penting)
    - Apakah pengguna benar-benar sudah diautentikasi di proxy?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Header wajib tidak ada. Periksa:

    - Konfigurasi proxy Anda untuk header-header spesifik tersebut.
    - Apakah header dihapus di suatu tempat dalam rantai.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    Pengguna sudah diautentikasi tetapi tidak ada dalam `allowUsers`. Tambahkan pengguna tersebut atau hapus allowlist.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Auth trusted-proxy berhasil, tetapi header `Origin` browser tidak lolos pemeriksaan origin Control UI.

    Periksa:

    - `gateway.controlUi.allowedOrigins` mencakup origin browser yang tepat.
    - Anda tidak mengandalkan origin wildcard kecuali memang sengaja menginginkan perilaku allow-all.
    - Jika Anda memang sengaja menggunakan mode fallback Host-header, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` diatur secara sengaja.

  </Accordion>
  <Accordion title="WebSocket masih gagal">
    Pastikan proxy Anda:

    - Mendukung upgrade WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - Meneruskan header identitas pada permintaan upgrade WebSocket (bukan hanya HTTP).
    - Tidak memiliki jalur auth terpisah untuk koneksi WebSocket.

  </Accordion>
</AccordionGroup>

## Migrasi dari auth token

Jika Anda berpindah dari auth token ke trusted-proxy:

<Steps>
  <Step title="Konfigurasikan proxy">
    Konfigurasikan proxy Anda untuk mengautentikasi pengguna dan meneruskan header.
  </Step>
  <Step title="Uji proxy secara independen">
    Uji penyiapan proxy secara independen (curl dengan header).
  </Step>
  <Step title="Perbarui config OpenClaw">
    Perbarui config OpenClaw dengan auth trusted-proxy.
  </Step>
  <Step title="Mulai ulang Gateway">
    Mulai ulang Gateway.
  </Step>
  <Step title="Uji WebSocket">
    Uji koneksi WebSocket dari Control UI.
  </Step>
  <Step title="Audit">
    Jalankan `openclaw security audit` dan tinjau temuannya.
  </Step>
</Steps>

## Terkait

- [Configuration](/id/gateway/configuration) — referensi config
- [Akses remote](/id/gateway/remote) — pola akses remote lainnya
- [Security](/id/gateway/security) — panduan keamanan lengkap
- [Tailscale](/id/gateway/tailscale) — alternatif yang lebih sederhana untuk akses khusus tailnet
