---
read_when:
    - Mengekspos Gateway melalui LAN, tailnet, Tailscale Serve, Funnel, atau proxy balik
    - Meninjau penerapan sebelum mengizinkan pengguna perpesanan sungguhan
    - Mengembalikan konfigurasi akses jarak jauh atau DM yang berisiko
sidebarTitle: Exposure runbook
summary: Daftar periksa pra-penerapan dan rollback sebelum membuka akses OpenClaw Gateway di luar loopback
title: Runbook eksposur Gateway
x-i18n:
    generated_at: "2026-06-27T17:33:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c5e94cc03b9d79a03eb16aa04bad0fd311b72f27f14182c036832382dbce3d0f
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
Ekspos Gateway hanya setelah Anda dapat menjelaskan siapa yang dapat menjangkaunya, bagaimana mereka
diautentikasi, agent mana yang dapat mereka picu, dan tool mana yang dapat
digunakan agent tersebut. Jika ragu, kembalikan ke akses khusus loopback dan jalankan ulang audit.
</Warning>

Runbook ini mengubah panduan [Keamanan](/id/gateway/security) yang lebih luas menjadi
checklist operator untuk akses jarak jauh dan eksposur messaging.

## Pilih pola eksposur

Pilih pola tersempit yang memenuhi workflow.

| Pola                       | Direkomendasikan ketika                         | Kontrol wajib                                                                                       |
| -------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Loopback + tunnel SSH      | Penggunaan pribadi, akses admin, debugging      | Pertahankan `gateway.bind: "loopback"` dan tunnel `127.0.0.1:18789`                                 |
| Loopback + Tailscale Serve | Akses tailnet pribadi ke Control UI/WebSocket   | Pertahankan Gateway hanya loopback; andalkan header identitas Tailscale hanya untuk surface yang didukung |
| Bind tailnet/LAN           | Jaringan privat khusus dengan perangkat dikenal | Autentikasi Gateway, allowlist firewall, tanpa port-forward publik                                  |
| Reverse proxy tepercaya    | SSO/OIDC organisasi di depan Gateway            | Autentikasi `trusted-proxy`, `trustedProxies` ketat, aturan timpa/hapus header, pengguna yang diizinkan secara eksplisit |
| Internet publik            | Deployment langka dan berisiko tinggi           | Proxy sadar identitas, TLS, rate limit, allowlist ketat, sesi non-main yang disandbox               |

Hindari port-forward publik langsung ke Gateway. Jika Anda memerlukan akses publik,
pasang proxy sadar identitas di depannya dan jadikan proxy sebagai satu-satunya jalur jaringan
ke Gateway.

## Inventaris pra-penerbangan

Catat ini sebelum mengubah kebijakan bind, proxy, Tailscale, atau channel:

- Host Gateway, pengguna OS, dan direktori state.
- URL Gateway dan mode bind.
- Mode autentikasi, sumber token/kata sandi, atau sumber identitas proxy tepercaya.
- Semua channel yang diaktifkan dan apakah channel tersebut menerima DM, grup, atau webhook.
- Agent yang dapat dijangkau dari pengirim non-lokal.
- Profil tool, mode sandbox, dan kebijakan tool elevated untuk setiap agent yang dapat dijangkau.
- Kredensial eksternal yang tersedia untuk agent tersebut.
- Lokasi backup untuk `~/.openclaw/openclaw.json` dan kredensial.

Jika lebih dari satu orang dapat mengirim pesan ke bot, perlakukan ini sebagai otoritas tool terdelegasi bersama,
bukan sebagai isolasi host per pengguna.

## Pemeriksaan baseline

Jalankan ini sebelum membuka akses:

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

Selesaikan temuan kritis terlebih dahulu. Peringatan hanya dapat diterima ketika memang
disengaja dan didokumentasikan untuk deployment tersebut.

Untuk validasi CLI jarak jauh, berikan kredensial secara eksplisit:

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

Jangan mengasumsikan kredensial konfigurasi lokal berlaku untuk URL jarak jauh eksplisit.

## Baseline aman minimum

Gunakan bentuk ini sebagai titik awal untuk deployment yang terekspos:

```json5
{
  gateway: {
    bind: "loopback",
    auth: {
      mode: "token",
      token: "replace-with-a-long-random-token",
    },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  agents: {
    defaults: {
      sandbox: { mode: "non-main" },
    },
  },
  tools: {
    profile: "messaging",
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

Lalu perluas satu kontrol pada satu waktu. Misalnya, tambahkan allowlist channel tertentu
sebelum mengaktifkan tool yang dapat menulis, atau aktifkan reverse proxy sebelum menerima
traffic Control UI jarak jauh.

Baseline `exec.security: "deny"` yang ketat memblokir semua panggilan exec, termasuk
diagnostik yang aman. Jika diagnostik atau perintah berisiko rendah diperlukan, longgarkan ini
hanya setelah memilih pengirim, agent, perintah, dan mode persetujuan spesifik
yang sesuai dengan model ancaman Anda.

## Eksposur DM dan grup

Channel messaging adalah surface input yang tidak tepercaya. Sebelum mengizinkan DM atau grup:

- Pilih `dmPolicy: "pairing"` atau daftar `allowFrom` yang ketat.
- Hindari `dmPolicy: "open"` kecuali setiap pengirim tepercaya.
- Jangan gabungkan allowlist `"*"` dengan akses tool yang luas.
- Wajibkan mention di grup kecuali room dikontrol ketat.
- Gunakan `session.dmScope: "per-channel-peer"` ketika beberapa orang dapat mengirim DM ke bot.
- Arahkan channel bersama ke agent dengan tool minimal dan tanpa kredensial pribadi.

Pairing menyetujui pengirim untuk memicu bot. Ini tidak menjadikan pengirim tersebut sebagai
batas keamanan host yang terpisah.

## Pemeriksaan reverse proxy

Untuk proxy sadar identitas:

- Proxy harus mengautentikasi pengguna sebelum meneruskan ke Gateway.
- Akses langsung ke port Gateway harus diblokir oleh firewall atau kebijakan jaringan.
- `gateway.trustedProxies` hanya boleh berisi IP sumber proxy.
- Proxy harus menghapus atau menimpa header identitas dan forwarding yang diberikan klien.
- `gateway.auth.trustedProxy.allowUsers` sebaiknya mencantumkan pengguna yang diharapkan ketika proxy melayani lebih dari satu audiens.
- Mode proxy loopback pada host yang sama sebaiknya menggunakan `allowLoopback` hanya ketika proses lokal tepercaya dan proxy memiliki header identitas.

Jalankan `openclaw security audit --deep` setelah perubahan proxy. Temuan trusted-proxy
sengaja dibuat bernilai sinyal tinggi karena proxy menjadi batas autentikasi.

## Tinjauan tool dan sandbox

Sebelum mengekspos agent ke pengirim jarak jauh:

- Konfirmasi sesi mana yang berjalan di host versus sandbox.
- Tolak atau wajibkan persetujuan untuk exec host.
- Biarkan tool elevated dinonaktifkan kecuali pengirim spesifik dan tepercaya membutuhkannya.
- Hindari tool browser, canvas, node, cron, gateway, dan session-spawn untuk surface messaging terbuka atau semi-terbuka.
- Jaga bind mount tetap sempit dan hindari kredensial, home, socket Docker, dan path sistem.
- Gunakan gateway, pengguna OS, atau host terpisah untuk batas kepercayaan yang benar-benar berbeda.

Jika pengguna jarak jauh tidak sepenuhnya tepercaya, isolasi harus berasal dari deployment
terpisah, bukan hanya dari prompt atau label sesi.

## Validasi pascaperubahan

Setelah setiap perubahan eksposur:

1. Jalankan ulang `openclaw security audit --deep`.
2. Uji koneksi terotorisasi yang berhasil.
3. Uji bahwa pengirim atau sesi browser yang tidak terotorisasi ditolak.
4. Konfirmasi log menyensor rahasia.
5. Konfirmasi routing DM/grup hanya mencapai agent yang dimaksud.
6. Konfirmasi tool berdampak tinggi meminta persetujuan atau ditolak.
7. Dokumentasikan peringatan residual yang diterima.

Jangan lanjut ke perubahan eksposur berikutnya sampai perubahan saat ini dipahami.

## Rencana rollback

Jika Gateway mungkin terlalu terekspos:

```json5
{
  gateway: {
    bind: "loopback",
  },
  channels: {
    whatsapp: { dmPolicy: "disabled" },
    telegram: { dmPolicy: "disabled" },
    discord: { dmPolicy: "disabled" },
    slack: { dmPolicy: "disabled" },
  },
  tools: {
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

Lalu:

1. Hentikan forwarding publik, Tailscale Funnel, atau route reverse proxy.
2. Rotasi token/kata sandi Gateway dan kredensial integrasi yang terdampak.
3. Hapus `"*"` dan pengirim tidak terduga dari allowlist.
4. Tinjau log audit terbaru, riwayat run, panggilan tool, dan perubahan konfigurasi.
5. Jalankan ulang `openclaw security audit --deep`.
6. Aktifkan ulang akses dengan pola tersempit yang memenuhi workflow.

## Checklist tinjauan

- Gateway tetap hanya loopback kecuali ada alasan terdokumentasi.
- Akses non-loopback memiliki autentikasi, firewall, dan tanpa route langsung publik.
- Deployment trusted-proxy memiliki IP proxy dan kontrol header yang ketat.
- DM menggunakan pairing atau allowlist, bukan akses terbuka secara default.
- Grup mewajibkan mention atau allowlist eksplisit.
- Channel bersama tidak menjangkau kredensial pribadi.
- Sesi non-main berjalan dalam mode sandbox.
- Exec host dan tool elevated ditolak atau dibatasi persetujuan.
- Log menyensor rahasia.
- Temuan audit kritis diselesaikan.
- Langkah rollback diuji dan didokumentasikan.
