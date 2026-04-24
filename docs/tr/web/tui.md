---
read_when:
    - TUI için başlangıç dostu adım adım anlatım istiyorsunuz
    - TUI özelliklerinin, komutlarının ve kısayollarının tam listesine ihtiyacınız var
summary: 'Terminal UI (TUI): Gateway''e bağlanın veya yerel olarak gömülü modda çalıştırın'
title: TUI
x-i18n:
    generated_at: "2026-04-24T09:38:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6168ab6cec8e0069f660ddcfca03275c407b613b6eb756aa6ef7e97f2312effe
    source_path: web/tui.md
    workflow: 15
---

## Hızlı başlangıç

### Gateway modu

1. Gateway'i başlatın.

```bash
openclaw gateway
```

2. TUI'ı açın.

```bash
openclaw tui
```

3. Bir mesaj yazın ve Enter'a basın.

Uzak Gateway:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Gateway'iniz parola auth kullanıyorsa `--password` kullanın.

### Yerel mod

TUI'ı Gateway olmadan çalıştırın:

```bash
openclaw chat
# veya
openclaw tui --local
```

Notlar:

- `openclaw chat` ve `openclaw terminal`, `openclaw tui --local` için takma addır.
- `--local`, `--url`, `--token` veya `--password` ile birlikte kullanılamaz.
- Yerel mod, gömülü aracı çalışma zamanını doğrudan kullanır. Çoğu yerel araç çalışır, ancak yalnızca Gateway'e özgü özellikler kullanılamaz.

## Ne görürsünüz

- Başlık: bağlantı URL'si, geçerli aracı, geçerli oturum.
- Sohbet günlüğü: kullanıcı mesajları, asistan yanıtları, sistem bildirimleri, araç kartları.
- Durum satırı: bağlantı/çalıştırma durumu (bağlanıyor, çalışıyor, akışta, boşta, hata).
- Alt bilgi: bağlantı durumu + aracı + oturum + model + think/fast/verbose/trace/reasoning + token sayıları + deliver.
- Girdi: otomatik tamamlama içeren metin düzenleyici.

## Zihinsel model: aracılar + oturumlar

- Aracılar benzersiz slug'lardır (ör. `main`, `research`). Gateway listeyi sunar.
- Oturumlar geçerli aracıya aittir.
- Oturum anahtarları `agent:<agentId>:<sessionKey>` olarak saklanır.
  - `/session main` yazarsanız TUI bunu `agent:<currentAgent>:main` olarak genişletir.
  - `/session agent:other:main` yazarsanız açıkça o aracı oturumuna geçersiniz.
- Oturum kapsamı:
  - `per-sender` (varsayılan): her aracının birçok oturumu vardır.
  - `global`: TUI her zaman `global` oturumunu kullanır (seçici boş olabilir).
- Geçerli aracı + oturum her zaman alt bilgide görünür.

## Gönderme + teslim

- Mesajlar Gateway'e gönderilir; sağlayıcılara teslim varsayılan olarak kapalıdır.
- Teslimi açmak için:
  - `/deliver on`
  - veya Ayarlar paneli
  - veya `openclaw tui --deliver` ile başlatın

## Seçiciler + katmanlar

- Model seçici: kullanılabilir modelleri listeler ve oturum geçersiz kılmasını ayarlar.
- Aracı seçici: farklı bir aracı seçin.
- Oturum seçici: yalnızca geçerli aracı için oturumları gösterir.
- Ayarlar: deliver, araç çıktısı genişletme ve thinking görünürlüğünü açıp kapatır.

## Klavye kısayolları

- Enter: mesaj gönder
- Esc: etkin çalıştırmayı iptal et
- Ctrl+C: girdiyi temizle (çıkmak için iki kez basın)
- Ctrl+D: çık
- Ctrl+L: model seçici
- Ctrl+G: aracı seçici
- Ctrl+P: oturum seçici
- Ctrl+O: araç çıktısı genişletmeyi aç/kapat
- Ctrl+T: thinking görünürlüğünü aç/kapat (geçmişi yeniden yükler)

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
- `/trace <on|off>`
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

Yalnızca yerel mod:

- `/auth [provider]`, TUI içinde sağlayıcı auth/login akışını açar.

Diğer Gateway slash komutları (örneğin `/context`) Gateway'e iletilir ve sistem çıktısı olarak gösterilir. Bkz. [Slash commands](/tr/tools/slash-commands).

## Yerel kabuk komutları

- Bir satırın başına `!` koyarak TUI sunucusunda yerel kabuk komutu çalıştırın.
- TUI, oturum başına bir kez yerel yürütmeye izin vermek için sorar; reddederseniz o oturum için `!` devre dışı kalır.
- Komutlar TUI çalışma dizininde taze, etkileşimsiz bir kabukta çalışır (kalıcı `cd`/env yoktur).
- Yerel kabuk komutları ortamlarında `OPENCLAW_SHELL=tui-local` alır.
- Tek başına `!`, normal mesaj olarak gönderilir; baştaki boşluklar yerel exec tetiklemez.

## Yerel TUI'dan config onarma

Geçerli config zaten doğrulanıyorsa ve
gömülü aracının aynı makinede bunu incelemesini, belgelerle karşılaştırmasını
ve çalışan bir Gateway'e bağlı olmadan kaymaları onarmaya yardımcı olmasını istiyorsanız yerel modu kullanın.

`openclaw config validate` zaten başarısız oluyorsa önce `openclaw configure`
veya `openclaw doctor --fix` ile başlayın. `openclaw chat`, geçersiz config
korumasını atlamaz.

Tipik döngü:

1. Yerel modu başlatın:

```bash
openclaw chat
```

2. Aracıya neyi kontrol etmesini istediğinizi söyleyin, örneğin:

```text
Gateway auth config'imi belgelerle karşılaştır ve en küçük düzeltmeyi öner.
```

3. Kesin kanıt ve doğrulama için yerel kabuk komutlarını kullanın:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. `openclaw config set` veya `openclaw configure` ile dar değişiklikler uygulayın, sonra `!openclaw config validate` yeniden çalıştırın.
5. Doctor otomatik bir migration veya onarım önerirse bunu gözden geçirin ve `!openclaw doctor --fix` çalıştırın.

İpuçları:

- `openclaw.json` dosyasını elle düzenlemek yerine `openclaw config set` veya `openclaw configure` tercih edin.
- `openclaw docs "<query>"`, aynı makineden canlı belge dizininde arama yapar.
- Yapılandırılmış şema ve SecretRef/çözülebilirlik hataları istediğinizde `openclaw config validate --json` kullanışlıdır.

## Araç çıktısı

- Araç çağrıları bağımsız değişkenler + sonuçlarla kartlar olarak gösterilir.
- Ctrl+O, daraltılmış/genişletilmiş görünümler arasında geçiş yapar.
- Araçlar çalışırken kısmi güncellemeler aynı karta akar.

## Terminal renkleri

- TUI, hem koyu hem açık terminallerde okunabilir kalması için asistan gövde metnini terminalinizin varsayılan ön plan renginde tutar.
- Terminaliniz açık arka plan kullanıyorsa ve otomatik algılama yanlışsa `openclaw tui` başlatmadan önce `OPENCLAW_THEME=light` ayarlayın.
- Bunun yerine özgün koyu paleti zorlamak için `OPENCLAW_THEME=dark` ayarlayın.

## Geçmiş + akış

- Bağlantıda TUI en son geçmişi yükler (varsayılan 200 mesaj).
- Akış halindeki yanıtlar tamamlanana kadar yerinde güncellenir.
- TUI ayrıca daha zengin araç kartları için aracı araç olaylarını da dinler.

## Bağlantı ayrıntıları

- TUI, Gateway'e `mode: "tui"` olarak kaydolur.
- Yeniden bağlantılar sistem mesajı gösterir; olay boşlukları günlüğe yansıtılır.

## Seçenekler

- `--local`: Yerel gömülü aracı çalışma zamanına karşı çalıştır
- `--url <url>`: Gateway WebSocket URL'si (varsayılan config veya `ws://127.0.0.1:<port>`)
- `--token <token>`: Gateway token'ı (gerekiyorsa)
- `--password <password>`: Gateway parolası (gerekiyorsa)
- `--session <key>`: Oturum anahtarı (varsayılan: `main`, kapsam global olduğunda `global`)
- `--deliver`: Asistan yanıtlarını sağlayıcıya teslim et (varsayılan kapalı)
- `--thinking <level>`: Gönderimler için thinking düzeyini geçersiz kıl
- `--message <text>`: Bağlandıktan sonra ilk mesajı gönder
- `--timeout-ms <ms>`: Aracı zaman aşımı, ms cinsinden (varsayılan `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Yüklenecek geçmiş girdileri (varsayılan `200`)

Not: `--url` ayarladığınızda TUI config veya ortam kimlik bilgilerinə fallback yapmaz.
`--token` veya `--password` değerini açıkça geçin. Açık kimlik bilgisi eksikse hata olur.
Yerel modda `--url`, `--token` veya `--password` geçmeyin.

## Sorun giderme

Mesaj gönderdikten sonra çıktı yok:

- Gateway'in bağlı ve boşta/meşgul olduğunu doğrulamak için TUI içinde `/status` çalıştırın.
- Gateway günlüklerini kontrol edin: `openclaw logs --follow`.
- Aracının çalışabildiğini doğrulayın: `openclaw status` ve `openclaw models status`.
- Bir sohbet kanalında mesaj bekliyorsanız teslimi etkinleştirin (`/deliver on` veya `--deliver`).

## Bağlantı sorun giderme

- `disconnected`: Gateway'in çalıştığından ve `--url/--token/--password` değerlerinizin doğru olduğundan emin olun.
- Seçicide aracı yok: `openclaw agents list` ve yönlendirme config'inizi kontrol edin.
- Boş oturum seçici: global kapsamda olabilirsiniz veya henüz oturumunuz olmayabilir.

## İlgili

- [Control UI](/tr/web/control-ui) — web tabanlı denetim arayüzü
- [Config](/tr/cli/config) — `openclaw.json` dosyasını inceleyin, doğrulayın ve düzenleyin
- [Doctor](/tr/cli/doctor) — rehberli onarım ve migration denetimleri
- [CLI Reference](/tr/cli) — tam CLI komut başvurusu
