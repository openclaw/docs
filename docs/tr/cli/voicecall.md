---
read_when:
    - Voice-call Plugin'ini kullanıyor ve her CLI giriş noktasını istiyorsunuz
    - setup, smoke, call, continue, speak, dtmf, end, status, tail, latency, expose ve start için bayrak tabloları ve varsayılanlar gerekir
summary: '`openclaw voicecall` için CLI başvurusu (sesli arama Plugin komut yüzeyi)'
title: Sesli arama
x-i18n:
    generated_at: "2026-05-10T19:31:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24013c06bf3e688bd86caa407bf20dddabe0dff60a400ed4f23478de62308634
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall`, Plugin tarafından sağlanan bir komuttur. Yalnızca sesli arama Plugin'i yüklendiğinde ve etkinleştirildiğinde görünür.

Gateway çalışırken operasyonel komutlar (`call`, `start`, `continue`, `speak`, `dtmf`, `end`, `status`) ilgili Gateway'in sesli arama çalışma zamanına yönlendirilir. Erişilebilir bir Gateway yoksa bağımsız CLI çalışma zamanına geri dönerler.

## Alt Komutlar

```bash
openclaw voicecall setup    [--json]
openclaw voicecall smoke    [-t <phone>] [--message <text>] [--mode <m>] [--yes] [--json]
openclaw voicecall call     -m <text> [-t <phone>] [--mode <m>]
openclaw voicecall start    --to <phone> [--message <text>] [--mode <m>]
openclaw voicecall continue --call-id <id> --message <text>
openclaw voicecall speak    --call-id <id> --message <text>
openclaw voicecall dtmf     --call-id <id> --digits <digits>
openclaw voicecall end      --call-id <id>
openclaw voicecall status   [--call-id <id>] [--json]
openclaw voicecall tail     [--file <path>] [--since <n>] [--poll <ms>]
openclaw voicecall latency  [--file <path>] [--last <n>]
openclaw voicecall expose   [--mode <m>] [--path <p>] [--port <port>] [--serve-path <p>]
```

| Alt komut | Açıklama                                                                 |
| ---------- | ------------------------------------------------------------------------ |
| `setup`    | Sağlayıcı ve Webhook hazırlık denetimlerini gösterir.                   |
| `smoke`    | Hazırlık denetimlerini çalıştırır; yalnızca `--yes` ile canlı test araması yapar. |
| `call`     | Giden bir sesli arama başlatır.                                          |
| `start`    | `--to` zorunlu ve `--message` isteğe bağlı olacak şekilde `call` takma adıdır. |
| `continue` | Bir mesaj söyler ve sonraki yanıtı bekler.                               |
| `speak`    | Yanıt beklemeden bir mesaj söyler.                                       |
| `dtmf`     | Etkin bir aramaya DTMF rakamları gönderir.                               |
| `end`      | Etkin bir aramayı kapatır.                                               |
| `status`   | Etkin aramaları inceler (veya `--call-id` ile bir tanesini).             |
| `tail`     | `calls.jsonl` dosyasını izler (sağlayıcı testleri sırasında kullanışlıdır). |
| `latency`  | `calls.jsonl` içindeki tur gecikmesi metriklerini özetler.              |
| `expose`   | Webhook uç noktası için Tailscale serve/funnel özelliğini açıp kapatır. |

## Kurulum ve smoke testi

### `setup`

Varsayılan olarak insan tarafından okunabilir hazırlık denetimlerini yazdırır. Betikler için `--json` geçirin.

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

Aynı hazırlık denetimlerini çalıştırır. Hem `--to` hem de `--yes` bulunmadıkça gerçek bir telefon araması yapmaz.

| Bayrak             | Varsayılan                       | Açıklama                                  |
| ------------------ | -------------------------------- | ----------------------------------------- |
| `-t, --to <phone>` | (yok)                            | Canlı smoke testi için aranacak telefon numarası. |
| `--message <text>` | `OpenClaw voice call smoke test.` | Smoke araması sırasında söylenecek mesaj. |
| `--mode <mode>`    | `notify`                         | Arama modu: `notify` veya `conversation`. |
| `--yes`            | `false`                          | Canlı giden aramayı gerçekten yapar.      |
| `--json`           | `false`                          | Makine tarafından okunabilir JSON yazdırır. |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # kuru çalıştırma
openclaw voicecall smoke --to "+15555550123" --yes  # canlı bildirim araması
```

<Note>
Harici sağlayıcılar (`twilio`, `telnyx`, `plivo`) için `setup` ve `smoke`, `publicUrl`, bir tünel veya Tailscale açma yoluyla genel bir Webhook URL'si gerektirir. Operatörler buna erişemeyeceği için loopback veya özel serve geri dönüşü reddedilir.
</Note>

## Arama yaşam döngüsü

### `call`

Giden bir sesli arama başlatır.

| Bayrak                 | Zorunlu | Varsayılan       | Açıklama                                                                  |
| ---------------------- | ------- | ---------------- | ------------------------------------------------------------------------- |
| `-m, --message <text>` | evet    | (yok)            | Arama bağlandığında söylenecek mesaj.                                     |
| `-t, --to <phone>`     | hayır   | config `toNumber` | Aranacak E.164 telefon numarası.                                          |
| `--mode <mode>`        | hayır   | `conversation`   | Arama modu: `notify` (mesajdan sonra kapat) veya `conversation` (açık tut). |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

Farklı bir varsayılan bayrak biçimine sahip `call` takma adıdır.

| Bayrak             | Zorunlu | Varsayılan     | Açıklama                              |
| ------------------ | ------- | -------------- | ------------------------------------- |
| `--to <phone>`     | evet    | (yok)          | Aranacak telefon numarası.            |
| `--message <text>` | hayır   | (yok)          | Arama bağlandığında söylenecek mesaj. |
| `--mode <mode>`    | hayır   | `conversation` | Arama modu: `notify` veya `conversation`. |

### `continue`

Bir mesaj söyler ve yanıt bekler.

| Bayrak             | Zorunlu | Açıklama           |
| ------------------ | ------- | ------------------ |
| `--call-id <id>`   | evet    | Arama kimliği.     |
| `--message <text>` | evet    | Söylenecek mesaj.  |

### `speak`

Yanıt beklemeden bir mesaj söyler.

| Bayrak             | Zorunlu | Açıklama           |
| ------------------ | ------- | ------------------ |
| `--call-id <id>`   | evet    | Arama kimliği.     |
| `--message <text>` | evet    | Söylenecek mesaj.  |

### `dtmf`

Etkin bir aramaya DTMF rakamları gönderir.

| Bayrak              | Zorunlu | Açıklama                                      |
| ------------------- | ------- | --------------------------------------------- |
| `--call-id <id>`    | evet    | Arama kimliği.                                |
| `--digits <digits>` | evet    | DTMF rakamları (ör. beklemeler için `ww123456#`). |

### `end`

Etkin bir aramayı kapatır.

| Bayrak           | Zorunlu | Açıklama       |
| ---------------- | ------- | -------------- |
| `--call-id <id>` | evet    | Arama kimliği. |

### `status`

Etkin aramaları inceler.

| Bayrak           | Varsayılan | Açıklama                            |
| ---------------- | ---------- | ----------------------------------- |
| `--call-id <id>` | (yok)      | Çıktıyı tek bir aramayla sınırlar.  |
| `--json`         | `false`    | Makine tarafından okunabilir JSON yazdırır. |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## Günlükler ve metrikler

### `tail`

Sesli arama JSONL günlüğünü izler. Başlangıçta son `--since` satırını yazdırır, ardından yeni satırlar yazıldıkça bunları aktarır.

| Bayrak          | Varsayılan                 | Açıklama                               |
| --------------- | -------------------------- | -------------------------------------- |
| `--file <path>` | Plugin deposundan çözümlenir | `calls.jsonl` yolu.                    |
| `--since <n>`   | `25`                       | İzlemeye başlamadan önce yazdırılacak satırlar. |
| `--poll <ms>`   | `250` (minimum 50)         | Milisaniye cinsinden yoklama aralığı.  |

### `latency`

`calls.jsonl` içindeki tur gecikmesi ve dinleme bekleme metriklerini özetler. Çıktı, `recordsScanned`, `turnLatency` ve `listenWait` özetlerini içeren JSON'dur.

| Bayrak          | Varsayılan                 | Açıklama                              |
| --------------- | -------------------------- | ------------------------------------- |
| `--file <path>` | Plugin deposundan çözümlenir | `calls.jsonl` yolu.                   |
| `--last <n>`    | `200` (minimum 1)          | Analiz edilecek son kayıt sayısı.     |

## Webhook'ları dışa açma

### `expose`

Ses Webhook'u için Tailscale serve/funnel yapılandırmasını etkinleştirir, devre dışı bırakır veya değiştirir.

| Bayrak                | Varsayılan                                | Açıklama                                      |
| --------------------- | ---------------------------------------- | --------------------------------------------- |
| `--mode <mode>`       | `funnel`                                 | `off`, `serve` (tailnet) veya `funnel` (public). |
| `--path <path>`       | config `tailscale.path` veya `--serve-path` | Dışa açılacak Tailscale yolu.              |
| `--port <port>`       | config `serve.port` veya `3334`          | Yerel Webhook bağlantı noktası.               |
| `--serve-path <path>` | config `serve.path` veya `/voice/webhook` | Yerel Webhook yolu.                         |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
Webhook uç noktasını yalnızca güvendiğiniz ağlara açın. Mümkün olduğunda Funnel yerine Tailscale Serve tercih edin.
</Warning>

## İlgili

- [CLI referansı](/tr/cli)
- [Sesli arama Plugin'i](/tr/plugins/voice-call)
