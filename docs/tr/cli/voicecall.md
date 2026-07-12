---
read_when:
    - Voice-call Plugin'ini kullanıyorsunuz ve tüm CLI giriş noktalarını istiyorsunuz
    - Kurulum, duman testi, arama, sürdürme, konuşma, dtmf, sonlandırma, durum, son kayıtlar, gecikme, dışa açma ve başlatma için seçenek tablolarına ve varsayılan değerlere ihtiyacınız var
summary: '`openclaw voicecall` için CLI başvurusu (sesli arama Plugin komut arayüzü)'
title: Sesli arama
x-i18n:
    generated_at: "2026-07-12T11:37:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aec445886cccb79c9212dd9f1f448ff9634274deb380632be786478c9bb29670
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall`, Plugin tarafından sağlanan bir komuttur. Yalnızca sesli arama
Plugin'i yüklendiğinde ve etkinleştirildiğinde görünür.

Gateway çalışırken işletim komutları (`call`, `start`,
`continue`, `speak`, `dtmf`, `end`, `status`) söz konusu Gateway'in
sesli arama çalışma zamanına yönlendirilir. Erişilebilir bir Gateway yoksa bağımsız
CLI çalışma zamanına geri dönerler.

## Alt komutlar

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

| Alt komut  | Açıklama                                                              |
| ---------- | --------------------------------------------------------------------- |
| `setup`    | Sağlayıcı ve webhook hazırlık kontrollerini gösterir.                  |
| `smoke`    | Hazırlık kontrollerini çalıştırır; yalnızca `--yes` ile canlı test araması yapar. |
| `call`     | Giden bir sesli arama başlatır.                                       |
| `start`    | `--to` zorunlu ve `--message` isteğe bağlı olacak şekilde `call` diğer adıdır. |
| `continue` | Bir mesajı seslendirir ve sonraki yanıtı bekler.                       |
| `speak`    | Yanıt beklemeden bir mesajı seslendirir.                               |
| `dtmf`     | Etkin bir aramaya DTMF rakamları gönderir.                             |
| `end`      | Etkin bir aramayı sonlandırır.                                        |
| `status`   | Etkin aramaları (veya `--call-id` ile bir aramayı) inceler.            |
| `tail`     | `calls.jsonl` dosyasını canlı takip eder (sağlayıcı testleri sırasında kullanışlıdır). |
| `latency`  | `calls.jsonl` dosyasındaki tur gecikmesi metriklerini özetler.         |
| `expose`   | Webhook uç noktası için Tailscale Serve/Funnel'ı açar veya kapatır.    |

## Kurulum ve duman testi

### `setup`

Varsayılan olarak insan tarafından okunabilir hazırlık kontrolleri yazdırır. Betikler için `--json` geçirin.

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

Aynı hazırlık kontrollerini çalıştırır. Yalnızca hem
`--to` hem de `--yes` mevcut olduğunda gerçek bir telefon araması yapar.

| Bayrak             | Varsayılan                        | Açıklama                                      |
| ------------------ | --------------------------------- | --------------------------------------------- |
| `-t, --to <phone>` | (yok)                             | Canlı duman testi için aranacak telefon numarası. |
| `--message <text>` | `OpenClaw voice call smoke test.` | Duman testi araması sırasında seslendirilecek mesaj. |
| `--mode <mode>`    | `notify`                          | Arama modu: `notify` veya `conversation`.     |
| `--yes`            | `false`                           | Canlı giden aramayı gerçekten yapar.          |
| `--json`           | `false`                           | Makine tarafından okunabilir JSON yazdırır.   |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # deneme çalıştırması
openclaw voicecall smoke --to "+15555550123" --yes  # canlı bildirim araması
```

<Note>
Harici sağlayıcılar (`plivo`, `telnyx`, `twilio`) için `setup` ve `smoke`, `publicUrl`, bir tünel veya Tailscale üzerinden erişime açılmış genel bir webhook URL'si gerektirir. Operatörler buna erişemeyeceği için local loopback veya özel Serve geri dönüşü reddedilir.
</Note>

## Arama yaşam döngüsü

### `call`

Giden bir sesli arama başlatır.

| Bayrak                 | Zorunlu | Varsayılan        | Açıklama                                                                   |
| ---------------------- | ------- | ----------------- | -------------------------------------------------------------------------- |
| `-m, --message <text>` | evet    | (yok)             | Arama bağlandığında seslendirilecek mesaj.                                 |
| `-t, --to <phone>`     | hayır   | yapılandırma `toNumber` | Aranacak E.164 telefon numarası.                                      |
| `--mode <mode>`        | hayır   | `conversation`    | Arama modu: `notify` (mesajdan sonra kapatır) veya `conversation` (açık tutar). |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

Farklı bir varsayılan bayrak yapısına sahip `call` diğer adıdır.

| Bayrak             | Zorunlu | Varsayılan     | Açıklama                                   |
| ------------------ | ------- | -------------- | ------------------------------------------ |
| `--to <phone>`     | evet    | (yok)          | Aranacak telefon numarası.                 |
| `--message <text>` | hayır   | (yok)          | Arama bağlandığında seslendirilecek mesaj. |
| `--mode <mode>`    | hayır   | `conversation` | Arama modu: `notify` veya `conversation`.  |

### `continue`

Bir mesajı seslendirir ve yanıt bekler.

| Bayrak             | Zorunlu | Açıklama                 |
| ------------------ | ------- | ------------------------ |
| `--call-id <id>`   | evet    | Arama kimliği.           |
| `--message <text>` | evet    | Seslendirilecek mesaj.   |

### `speak`

Yanıt beklemeden bir mesajı seslendirir.

| Bayrak             | Zorunlu | Açıklama                 |
| ------------------ | ------- | ------------------------ |
| `--call-id <id>`   | evet    | Arama kimliği.           |
| `--message <text>` | evet    | Seslendirilecek mesaj.   |

### `dtmf`

Etkin bir aramaya DTMF rakamları gönderir.

| Bayrak              | Zorunlu | Açıklama                                           |
| ------------------- | ------- | -------------------------------------------------- |
| `--call-id <id>`    | evet    | Arama kimliği.                                     |
| `--digits <digits>` | evet    | DTMF rakamları (örneğin beklemeler için `ww123456#`). |

### `end`

Etkin bir aramayı sonlandırır.

| Bayrak           | Zorunlu | Açıklama       |
| ---------------- | ------- | -------------- |
| `--call-id <id>` | evet    | Arama kimliği. |

### `status`

Etkin aramaları inceler.

| Bayrak           | Varsayılan | Açıklama                              |
| ---------------- | ---------- | ------------------------------------- |
| `--call-id <id>` | (yok)      | Çıktıyı tek bir aramayla sınırlar.    |
| `--json`         | `false`    | Makine tarafından okunabilir JSON yazdırır. |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## Günlükler ve metrikler

### `tail`

Sesli arama JSONL günlüğünü canlı takip eder. Başlangıçta son `--since` satırı yazdırır, ardından
yazıldıkça yeni satırları akış halinde gösterir.

| Bayrak          | Varsayılan                   | Açıklama                                    |
| --------------- | ---------------------------- | ------------------------------------------- |
| `--file <path>` | Plugin deposundan çözümlenir | `calls.jsonl` dosyasının yolu.              |
| `--since <n>`   | `25`                         | Canlı takipten önce yazdırılacak satır sayısı. |
| `--poll <ms>`   | `250` (en az 50)             | Milisaniye cinsinden yoklama aralığı.       |

### `latency`

`calls.jsonl` dosyasındaki tur gecikmesi ve dinleme bekleme metriklerini özetler. Çıktı,
`recordsScanned`, `turnLatency` ve `listenWait` özetlerini içeren JSON biçimindedir.

| Bayrak          | Varsayılan                   | Açıklama                                  |
| --------------- | ---------------------------- | ----------------------------------------- |
| `--file <path>` | Plugin deposundan çözümlenir | `calls.jsonl` dosyasının yolu.            |
| `--last <n>`    | `200` (en az 1)              | Analiz edilecek son kayıtların sayısı.    |

## Webhook'ları erişime açma

### `expose`

Ses webhook'u için Tailscale Serve/Funnel yapılandırmasını etkinleştirir, devre dışı bırakır veya değiştirir.

| Bayrak                | Varsayılan                                     | Açıklama                                        |
| --------------------- | ---------------------------------------------- | ----------------------------------------------- |
| `--mode <mode>`       | `funnel`                                       | `off`, `serve` (tailnet) veya `funnel` (genel). |
| `--path <path>`       | yapılandırma `tailscale.path` veya `--serve-path` | Erişime açılacak Tailscale yolu.              |
| `--port <port>`       | yapılandırma `serve.port` veya `3334`          | Yerel webhook bağlantı noktası.                 |
| `--serve-path <path>` | yapılandırma `serve.path` veya `/voice/webhook` | Yerel webhook yolu.                            |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
Webhook uç noktasını yalnızca güvendiğiniz ağlara açın. Mümkün olduğunda Funnel yerine Tailscale Serve'ü tercih edin.
</Warning>

## İlgili

- [CLI başvurusu](/tr/cli)
- [Sesli arama Plugin'i](/tr/plugins/voice-call)
