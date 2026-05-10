---
read_when:
    - Gmail Pub/Sub etkinliklerini OpenClaw'a bağlamak istiyorsunuz
    - Tam bayrak listesine ve varsayılan değerlere ihtiyacınız var
summary: '`openclaw webhooks` için CLI referansı (Gmail Pub/Sub kurulumu ve çalıştırıcısı)'
title: Webhook'lar
x-i18n:
    generated_at: "2026-05-10T19:31:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9ce17ca78bbe9836edd4643a262833e52cceb27f441d5922c036777e47a6f74
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Webhook yardımcıları ve entegrasyonları. Bugün bu yüzey, paketle birlikte gelen `gog` izleyicisiyle entegre olan Gmail Pub/Sub akışlarıyla sınırlıdır.

## Alt komutlar

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| Alt komut     | Açıklama                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------ |
| `gmail setup` | Gmail izlemeyi, Pub/Sub konu/aboneliğini ve OpenClaw webhook teslim hedefini yapılandırın.       |
| `gmail run`   | `gog watch serve` ile izleme otomatik yenileme döngüsünü çalıştırın.                             |

## `webhooks gmail setup`

Gmail izlemeyi, Pub/Sub'ı ve OpenClaw webhook teslimini yapılandırın.

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### Zorunlu

| Bayrak              | Açıklama                    |
| ------------------- | --------------------------- |
| `--account <email>` | İzlenecek Gmail hesabı.     |

### Pub/Sub seçenekleri

| Bayrak                  | Varsayılan             | Açıklama                                                        |
| ----------------------- | ---------------------- | --------------------------------------------------------------- |
| `--project <id>`        | (yok)                  | GCP proje kimliği (OAuth istemci sahibi).                       |
| `--topic <name>`        | `gog-gmail-watch`      | Pub/Sub konu adı.                                               |
| `--subscription <name>` | `gog-gmail-watch-push` | Pub/Sub abonelik adı.                                           |
| `--label <label>`       | `INBOX`                | İzlenecek Gmail etiketi.                                        |
| `--push-endpoint <url>` | (yok)                  | Açık Pub/Sub push uç noktası. Tailscale'i geçersiz kılar.       |

### OpenClaw teslim seçenekleri

| Bayrak                 | Varsayılan | Açıklama                                      |
| ---------------------- | ---------- | --------------------------------------------- |
| `--hook-url <url>`     | (yok)      | OpenClaw webhook URL'si.                      |
| `--hook-token <token>` | (yok)      | OpenClaw webhook belirteci.                   |
| `--push-token <token>` | (yok)      | `gog watch serve`'e iletilen push belirteci.  |

### `gog watch serve` seçenekleri

| Bayrak                | Varsayılan      | Açıklama                                                                  |
| --------------------- | --------------- | ------------------------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`     | `gog watch serve` bağlanma ana makinesi.                                  |
| `--port <port>`       | `8788`          | `gog watch serve` portu.                                                  |
| `--path <path>`       | `/gmail-pubsub` | `gog watch serve` yolu.                                                   |
| `--include-body`      | `true`          | E-posta gövdesi parçalarını dahil edin. Devre dışı bırakmak için `--no-include-body` geçirin. |
| `--max-bytes <n>`     | `20000`         | Her gövde parçası için en fazla bayt.                                      |
| `--renew-minutes <n>` | `720` (12h)     | Gmail izlemeyi her N dakikada bir yenileyin.                              |

### Tailscale'e açma

| Bayrak                    | Varsayılan | Açıklama                                                                   |
| ------------------------- | ---------- | -------------------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel`   | Push uç noktasını tailscale üzerinden açın: `funnel`, `serve` veya `off`.  |
| `--tailscale-path <path>` | (yok)      | tailscale serve/funnel için yol.                                           |
| `--tailscale-target <t>`  | (yok)      | Tailscale serve/funnel hedefi (port, `host:port` veya URL).                |

### Çıktı

| Bayrak   | Açıklama                                                     |
| -------- | ------------------------------------------------------------ |
| `--json` | Metin yerine makine tarafından okunabilir bir özet yazdırın. |

## `webhooks gmail run`

`gog watch serve` ile izleme otomatik yenileme döngüsünü ön planda çalıştırın.

```bash
openclaw webhooks gmail run --account you@example.com
```

`run`, `setup` ile aynı `gog watch serve`, OpenClaw teslim, Pub/Sub ve Tailscale bayraklarını kabul eder; şu istisnalarla:

- `--account`, `run` üzerinde **isteğe bağlıdır** (yapılandırılmış hesaba geri döner).
- `run`, `--project`, `--push-endpoint` veya `--json` kabul etmez.
- `run` bayraklarının yerleşik varsayılanları yoktur; eksik değerler `setup` tarafından yazılan değerlere geri döner.

| Kategori          | Bayraklar                                                                        |
| ----------------- | -------------------------------------------------------------------------------- |
| Pub/Sub           | `--account`, `--topic`, `--subscription`, `--label`                              |
| OpenClaw teslimi  | `--hook-url`, `--hook-token`, `--push-token`                                     |
| `gog watch serve` | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale         | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
`run` için `--topic` değeri, yalnızca kısa konu adı değil, tam Pub/Sub konu yoludur (`projects/.../topics/...`).
</Note>

## Uçtan uca akış

Bu CLI komutlarıyla eşleşen GCP projesi, OAuth ve Gateway tarafı kurulumu için [Gmail Pub/Sub entegrasyonu](/tr/automation/cron-jobs#gmail-pubsub-integration) bölümüne bakın.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Webhook otomasyonu](/tr/automation/cron-jobs)
- [Gmail Pub/Sub](/tr/automation/cron-jobs#gmail-pubsub-integration)
