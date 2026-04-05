---
read_when:
    - TUI için başlangıç dostu bir adım adım kılavuz istiyorsunuz
    - TUI özellikleri, komutları ve kısayollarının tam listesine ihtiyacınız var
summary: 'Terminal UI (TUI): herhangi bir makineden Gateway''e bağlanın'
title: TUI
x-i18n:
    generated_at: "2026-04-05T14:14:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: a73f70d65ecc7bff663e8df28c07d70d2920d4732fbb8288c137d65b8653ac52
    source_path: web/tui.md
    workflow: 15
---

# TUI (Terminal UI)

## Hızlı başlangıç

1. Gateway'i başlatın.

```bash
openclaw gateway
```

2. TUI'yi açın.

```bash
openclaw tui
```

3. Bir mesaj yazın ve Enter'a basın.

Uzak Gateway:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Gateway'iniz parola auth kullanıyorsa `--password` kullanın.

## Gördükleriniz

- Üst bilgi: bağlantı URL'si, geçerli aracı, geçerli oturum.
- Sohbet günlüğü: kullanıcı mesajları, asistan yanıtları, sistem bildirimleri, araç kartları.
- Durum satırı: bağlantı/çalışma durumu (bağlanıyor, çalışıyor, akış sürüyor, boşta, hata).
- Alt bilgi: bağlantı durumu + aracı + oturum + model + think/fast/verbose/reasoning + token sayıları + deliver.
- Girdi: otomatik tamamlama içeren metin düzenleyici.

## Zihinsel model: aracılar + oturumlar

- Aracılar benzersiz slug'lardır (ör. `main`, `research`). Gateway listeyi sunar.
- Oturumlar geçerli aracıya aittir.
- Oturum anahtarları `agent:<agentId>:<sessionKey>` olarak saklanır.
  - `/session main` yazarsanız, TUI bunu `agent:<currentAgent>:main` olarak genişletir.
  - `/session agent:other:main` yazarsanız, açıkça o aracı oturumuna geçersiniz.
- Oturum kapsamı:
  - `per-sender` (varsayılan): her aracının birçok oturumu vardır.
  - `global`: TUI her zaman `global` oturumunu kullanır (seçici boş olabilir).
- Geçerli aracı + oturum alt bilgide her zaman görünür.

## Gönderme + teslimat

- Mesajlar Gateway'e gönderilir; sağlayıcılara teslimat varsayılan olarak kapalıdır.
- Teslimatı açın:
  - `/deliver on`
  - veya Ayarlar panelinden
  - veya `openclaw tui --deliver` ile başlatın

## Seçiciler + katmanlar

- Model seçici: kullanılabilir modelleri listeler ve oturum geçersiz kılmasını ayarlar.
- Aracı seçici: farklı bir aracı seçin.
- Oturum seçici: yalnızca geçerli aracıya ait oturumları gösterir.
- Ayarlar: deliver, araç çıktısı genişletme ve düşünme görünürlüğünü açıp kapatın.

## Klavye kısayolları

- Enter: mesaj gönder
- Esc: etkin çalıştırmayı iptal et
- Ctrl+C: girdiyi temizle (çıkmak için iki kez basın)
- Ctrl+D: çık
- Ctrl+L: model seçici
- Ctrl+G: aracı seçici
- Ctrl+P: oturum seçici
- Ctrl+O: araç çıktısı genişletmesini aç/kapat
- Ctrl+T: düşünme görünürlüğünü aç/kapat (geçmişi yeniden yükler)

## Slash komutları

Çekirdek:

- `/help`
- `/status`
- `/agent <id>` (veya `/agents`)
- `/session <key>` (veya `/sessions`)
- `/model <provider/model>` (veya `/models`)

Oturum denetimleri:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>` (takma ad: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

Oturum yaşam döngüsü:

- `/new` veya `/reset` (oturumu sıfırla)
- `/abort` (etkin çalıştırmayı iptal et)
- `/settings`
- `/exit`

Diğer Gateway slash komutları (örneğin `/context`) Gateway'e iletilir ve sistem çıktısı olarak gösterilir. Bkz. [Slash commands](/tools/slash-commands).

## Yerel kabuk komutları

- TUI ana makinesinde yerel bir kabuk komutu çalıştırmak için satırın başına `!` koyun.
- TUI, yerel yürütmeye izin vermek için oturum başına bir kez istem gösterir; reddederseniz oturum için `!` devre dışı kalır.
- Komutlar, TUI çalışma dizininde yeni ve etkileşimsiz bir kabukta çalışır (kalıcı `cd`/env yoktur).
- Yerel kabuk komutları ortamlarında `OPENCLAW_SHELL=tui-local` alır.
- Tek başına `!` normal mesaj olarak gönderilir; baştaki boşluklar yerel yürütmeyi tetiklemez.

## Araç çıktısı

- Araç çağrıları bağımsız değişkenler + sonuçlarla birlikte kart olarak gösterilir.
- Ctrl+O daraltılmış/genişletilmiş görünümler arasında geçiş yapar.
- Araçlar çalışırken kısmi güncellemeler aynı karta akış olarak gelir.

## Terminal renkleri

- TUI, asistan gövde metnini terminalinizin varsayılan ön plan renginde tutar; böylece hem koyu hem açık terminaller okunabilir kalır.
- Terminaliniz açık arka plan kullanıyorsa ve otomatik algılama yanlışsa, `openclaw tui` başlatmadan önce `OPENCLAW_THEME=light` ayarlayın.
- Bunun yerine özgün koyu paleti zorlamak için `OPENCLAW_THEME=dark` ayarlayın.

## Geçmiş + akış

- Bağlantı kurulduğunda TUI en son geçmişi yükler (varsayılan 200 mesaj).
- Akış yanıtları kesinleştirilene kadar yerinde güncellenir.
- TUI ayrıca daha zengin araç kartları için aracı araç olaylarını da dinler.

## Bağlantı ayrıntıları

- TUI, Gateway'e `mode: "tui"` olarak kaydolur.
- Yeniden bağlanmalar sistem mesajı gösterir; olay boşlukları günlükte görünür hale getirilir.

## Seçenekler

- `--url <url>`: Gateway WebSocket URL'si (varsayılan olarak yapılandırma veya `ws://127.0.0.1:<port>`)
- `--token <token>`: Gateway token'ı (gerekiyorsa)
- `--password <password>`: Gateway parolası (gerekiyorsa)
- `--session <key>`: Oturum anahtarı (varsayılan: `main`, kapsam global olduğunda `global`)
- `--deliver`: Asistan yanıtlarını sağlayıcıya teslim et (varsayılan kapalı)
- `--thinking <level>`: Gönderimler için düşünme düzeyini geçersiz kıl
- `--message <text>`: Bağlandıktan sonra ilk mesajı gönder
- `--timeout-ms <ms>`: ms cinsinden aracı zaman aşımı (varsayılan `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Yüklenecek geçmiş girdileri (varsayılan `200`)

Not: `--url` ayarladığınızda TUI yapılandırma veya ortam kimlik bilgilerine geri dönmez.
`--token` veya `--password` değerini açıkça verin. Açık kimlik bilgileri eksikse bu bir hatadır.

## Sorun giderme

Mesaj gönderdikten sonra çıktı yoksa:

- Gateway'in bağlı olduğunu ve boşta/meşgul olduğunu doğrulamak için TUI içinde `/status` çalıştırın.
- Gateway günlüklerini kontrol edin: `openclaw logs --follow`.
- Aracının çalışabildiğini doğrulayın: `openclaw status` ve `openclaw models status`.
- Bir sohbet kanalında mesaj bekliyorsanız, teslimatı etkinleştirin (`/deliver on` veya `--deliver`).

## Bağlantı sorun giderme

- `disconnected`: Gateway'in çalıştığından ve `--url/--token/--password` değerlerinizin doğru olduğundan emin olun.
- Seçicide aracı yoksa: `openclaw agents list` ve yönlendirme yapılandırmanızı kontrol edin.
- Boş oturum seçici: global kapsamda olabilirsiniz veya henüz hiç oturumunuz yoktur.

## İlgili

- [Control UI](/web/control-ui) — web tabanlı kontrol arayüzü
- [CLI Reference](/cli) — tam CLI komut başvurusu
