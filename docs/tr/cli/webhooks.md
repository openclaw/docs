---
read_when:
    - Gmail Pub/Sub olaylarını OpenClaw'a bağlamak istiyorsunuz
    - Tam bayrak listesine ve varsayılan değerlere ihtiyacınız var
summary: '`openclaw webhooks` için CLI referansı (Gmail Pub/Sub kurulumu ve çalıştırıcısı)'
title: Webhook'lar
x-i18n:
    generated_at: "2026-07-12T12:13:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fff0ac2ce247402f45523eda0b5cdd551bd65212636118698e45cb8740236c
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Webhook yardımcıları ve entegrasyonları. Bu alan şu anda paketle birlikte sunulan `gog` izleyicisi üzerine kurulu Gmail Pub/Sub akışlarıyla sınırlıdır.

## Alt komutlar

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| Alt komut     | Açıklama                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------------- |
| `gmail setup` | Tek seferlik sihirbaz: Gmail izleme, Pub/Sub konusu/aboneliği ve OpenClaw hook teslimi.         |
| `gmail run`   | `gog watch serve` ile izleme otomatik yenileme döngüsünü ön planda çalıştırır.                  |

<Note>
Gateway, `hooks.enabled=true` olduğunda ve `hooks.gmail.account` ayarlandığında (`gmail setup` tarafından ayarlanır) başlangıçta `gog gmail watch serve` komutunu da otomatik olarak başlatır. `gmail run`, aynı mantığı ön planda çalıştırır; hata ayıklama için veya Gateway izleyicisi devre dışı bırakıldığında kullanışlıdır. Otomatik başlatma ayrıntıları ve `OPENCLAW_SKIP_GMAIL_WATCHER` ile devre dışı bırakma seçeneği için [Gmail Pub/Sub entegrasyonu](/tr/automation/cron-jobs#gmail-pubsub-integration) bölümüne bakın.
</Note>

## `webhooks gmail setup`

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

Eksiklerse `gcloud` ve `gog` araçlarını kurar, `gcloud` kimlik doğrulamasını gerçekleştirir, Pub/Sub konusunu ve aboneliğini oluşturur, Gmail izlemeyi başlatır ve `hooks.enabled=true` ile `hooks.gmail` yapılandırmasını yazar. `Sonraki: openclaw webhooks gmail run` çıktısını verir.

### Gerekli

| Bayrak              | Açıklama                     |
| ------------------- | ---------------------------- |
| `--account <email>` | İzlenecek Gmail hesabı.      |

### Pub/Sub seçenekleri

| Bayrak                  | Varsayılan             | Açıklama                                                                                                                                          |
| ----------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--project <id>`        | (yok)                  | GCP proje kimliği (OAuth istemcisinin sahibi). Önce konunun kendi proje kimliğine, ardından `gog` kimlik bilgilerinden çözümlenen projeye döner.    |
| `--topic <name>`        | `gog-gmail-watch`      | Pub/Sub konu adı.                                                                                                                                 |
| `--subscription <name>` | `gog-gmail-watch-push` | Pub/Sub abonelik adı.                                                                                                                             |
| `--label <label>`       | `INBOX`                | İzlenecek Gmail etiketi.                                                                                                                          |
| `--push-endpoint <url>` | (yok)                  | Açıkça belirtilen Pub/Sub push uç noktası. Tailscale ayarını geçersiz kılar.                                                                       |

### OpenClaw teslim seçenekleri

| Bayrak                 | Varsayılan                                             | Açıklama                    |
| ---------------------- | ------------------------------------------------------ | --------------------------- |
| `--hook-url <url>`     | `hooks.path` ve Gateway bağlantı noktasından oluşturulur | OpenClaw webhook URL'si.    |
| `--hook-token <token>` | `hooks.token` veya oluşturulan bir token               | OpenClaw webhook token'ı.   |
| `--push-token <token>` | Oluşturulan token                                      | `gog watch serve` komutuna iletilen push token'ı. |

### `gog watch serve` seçenekleri

| Bayrak                | Varsayılan      | Açıklama                                                                                                                                                                 |
| --------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--bind <host>`       | `127.0.0.1`     | `gog watch serve` bağlanma ana bilgisayarı.                                                                                                                              |
| `--port <port>`       | `8788`          | `gog watch serve` bağlantı noktası.                                                                                                                                      |
| `--path <path>`       | `/gmail-pubsub` | Tailscale açık bir hedef olmadan etkinleştirildiğinde, Tailscale proxy'lemeden önce yolu kaldırdığı için `/` değerine zorlanan `gog watch serve` yolu.                     |
| `--include-body`      | `true`          | E-posta gövdesi parçalarını dahil eder. Bunu kapatmak için CLI bayrağı yoktur; bunun yerine yapılandırmada `hooks.gmail.includeBody: false` ayarını kullanın.              |
| `--max-bytes <n>`     | `20000`         | Her gövde parçası için azami bayt sayısı.                                                                                                                                |
| `--renew-minutes <n>` | `720` (12 sa.)  | Gmail izlemeyi her N dakikada bir yeniler.                                                                                                                               |

### Tailscale üzerinden erişime açma

| Bayrak                    | Varsayılan | Açıklama                                                                 |
| ------------------------- | ---------- | ------------------------------------------------------------------------ |
| `--tailscale <mode>`      | `funnel`   | Push uç noktasını tailscale üzerinden açar: `funnel`, `serve` veya `off`. |
| `--tailscale-path <path>` | (yok)      | Tailscale serve/funnel yolu.                                             |
| `--tailscale-target <t>`  | (yok)      | Tailscale serve/funnel hedefi (bağlantı noktası, `host:port` veya URL).   |

### Çıktı

| Bayrak   | Açıklama                                              |
| -------- | ----------------------------------------------------- |
| `--json` | Metin yerine makine tarafından okunabilir bir özet yazdırır. |

## `webhooks gmail run`

```bash
openclaw webhooks gmail run --account you@example.com
```

`gog watch serve` ile izleme otomatik yenileme döngüsünü ön planda çalıştırır ve `gog watch serve` beklenmedik biçimde sonlanırsa 2 saniyelik gecikmenin ardından yeniden başlatır.

`run`, `setup` ile aynı Pub/Sub, OpenClaw teslimi, `gog watch serve` ve Tailscale bayraklarını kabul eder; ancak şu farklar vardır:

- `run` komutunda `--account` **isteğe bağlıdır**; belirtilmezse `hooks.gmail.account` kullanılır.
- `run`, `--project`, `--push-endpoint` veya `--json` bayraklarını kabul **etmez**.
- Her bayrak önce eşleşen `hooks.gmail.*` yapılandırma değerine (`setup` tarafından yazılır), ardından `setup` tarafından kullanılan aynı yerleşik varsayılana döner; tek istisna şudur: ne bayrak ne de `hooks.gmail.tailscale.mode` ayarlanmışsa `run` komutunda `--tailscale` varsayılan olarak `funnel` değil `off` değerini kullanır.

| Kategori          | Bayraklar                                                                        |
| ----------------- | -------------------------------------------------------------------------------- |
| Pub/Sub           | `--account`, `--topic`, `--subscription`, `--label`                              |
| OpenClaw teslimi  | `--hook-url`, `--hook-token`, `--push-token`                                     |
| `gog watch serve` | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale         | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
`run` için `--topic` değeri yalnızca kısa konu adı değil, tam Pub/Sub konu yoludur (`projects/.../topics/...`).
</Note>

## İlgili

- [CLI başvurusu](/tr/cli)
- [Webhook otomasyonu](/tr/automation/cron-jobs)
- [Gmail Pub/Sub entegrasyonu](/tr/automation/cron-jobs#gmail-pubsub-integration)
