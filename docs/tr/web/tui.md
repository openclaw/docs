---
read_when:
    - TUI için başlangıç dostu bir adım adım kılavuz istiyorsunuz
    - TUI özelliklerinin, komutlarının ve kısayollarının eksiksiz listesine ihtiyacınız var
summary: 'Terminal kullanıcı arayüzü (TUI): Gateway''e bağlanın veya gömülü modda yerel olarak çalıştırın'
title: TUI
x-i18n:
    generated_at: "2026-05-02T09:09:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c13268991bf11eece9984f21eb959e7a5fab7071be6dc3a47855b525bfe80d8
    source_path: web/tui.md
    workflow: 16
---

## Hızlı başlangıç

### Gateway modu

1. Gateway’i başlatın.

```bash
openclaw gateway
```

2. TUI’yi açın.

```bash
openclaw tui
```

3. Bir mesaj yazın ve Enter’a basın.

Uzak Gateway:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Gateway’iniz parola kimlik doğrulaması kullanıyorsa `--password` kullanın.

### Yerel mod

TUI’yi Gateway olmadan çalıştırın:

```bash
openclaw chat
# veya
openclaw tui --local
```

Notlar:

- `openclaw chat` ve `openclaw terminal`, `openclaw tui --local` için takma adlardır.
- `--local`, `--url`, `--token` veya `--password` ile birlikte kullanılamaz.
- Yerel mod, gömülü ajan çalışma zamanını doğrudan kullanır. Çoğu yerel araç çalışır, ancak yalnızca Gateway’e özgü özellikler kullanılamaz.
- `openclaw` ve `openclaw crestodian` da bu TUI kabuğunu kullanır; Crestodian yerel kurulum ve onarım sohbet arka ucu olarak görev yapar.

## Ne görürsünüz

- Başlık: bağlantı URL’si, geçerli ajan, geçerli oturum.
- Sohbet günlüğü: kullanıcı mesajları, asistan yanıtları, sistem bildirimleri, araç kartları.
- Durum satırı: bağlantı/çalıştırma durumu (bağlanıyor, çalışıyor, akış yapıyor, boşta, hata).
- Alt bilgi: bağlantı durumu + ajan + oturum + model + düşün/hızlı/ayrıntılı/izleme/gerekçelendirme + token sayıları + teslim.
- Girdi: otomatik tamamlama özellikli metin düzenleyici.

## Zihinsel model: ajanlar + oturumlar

- Ajanlar benzersiz slug’lardır (örn. `main`, `research`). Gateway listeyi sunar.
- Oturumlar geçerli ajana aittir.
- Oturum anahtarları `agent:<agentId>:<sessionKey>` olarak saklanır.
  - `/session main` yazarsanız TUI bunu `agent:<currentAgent>:main` biçimine genişletir.
  - `/session agent:other:main` yazarsanız açıkça o ajan oturumuna geçersiniz.
- Oturum kapsamı:
  - `per-sender` (varsayılan): her ajanın birçok oturumu vardır.
  - `global`: TUI her zaman `global` oturumunu kullanır (seçici boş olabilir).
- Geçerli ajan + oturum her zaman alt bilgide görünür.
- `--session` olmadan başlatıldığında, Gateway modundaki TUI aynı Gateway, ajan ve oturum kapsamı için son seçilen oturumu, o oturum hâlâ varsa sürdürür. `--session`, `/session`, `/new` veya `/reset` geçirmek açık bir işlem olmaya devam eder.

## Gönderme + teslim

- Mesajlar Gateway’e gönderilir; sağlayıcılara teslim varsayılan olarak kapalıdır.
- Teslimi açın:
  - `/deliver on`
  - veya Ayarlar paneli
  - veya `openclaw tui --deliver` ile başlatın

## Seçiciler + katmanlar

- Model seçici: kullanılabilir modelleri listeler ve oturum geçersiz kılmasını ayarlar.
- Ajan seçici: farklı bir ajan seçer.
- Oturum seçici: yalnızca geçerli ajanın oturumlarını gösterir.
- Ayarlar: teslimi, araç çıktısı genişletmeyi ve düşünme görünürlüğünü açıp kapatır.

## Klavye kısayolları

- Enter: mesaj gönder
- Esc: etkin çalıştırmayı iptal et
- Ctrl+C: girdiyi temizle (çıkmak için iki kez basın)
- Ctrl+D: çık
- Ctrl+L: model seçici
- Ctrl+G: ajan seçici
- Ctrl+P: oturum seçici
- Ctrl+O: araç çıktısı genişletmeyi aç/kapat
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

- `/auth [provider]`, sağlayıcı kimlik doğrulama/oturum açma akışını TUI içinde açar.

Diğer Gateway slash komutları (örneğin `/context`) Gateway’e iletilir ve sistem çıktısı olarak gösterilir. Bkz. [Slash komutları](/tr/tools/slash-commands).

## Yerel kabuk komutları

- TUI ana makinesinde yerel bir kabuk komutu çalıştırmak için satırın başına `!` ekleyin.
- TUI, yerel yürütmeye izin vermek için oturum başına bir kez sorar; reddetmek, oturum için `!` kullanımını devre dışı bırakır.
- Komutlar TUI çalışma dizininde yeni, etkileşimsiz bir kabukta çalışır (kalıcı `cd`/env yoktur).
- Yerel kabuk komutları ortamlarında `OPENCLAW_SHELL=tui-local` alır.
- Tek başına `!` normal mesaj olarak gönderilir; baştaki boşluklar yerel yürütmeyi tetiklemez.

## Yerel TUI’den yapılandırmaları onarın

Geçerli yapılandırma zaten doğrulanıyorsa ve gömülü ajanın bunu aynı makinede incelemesini, dokümanlarla karşılaştırmasını ve çalışan bir Gateway’e bağımlı olmadan sapmaları onarmaya yardımcı olmasını istiyorsanız yerel modu kullanın.

`openclaw config validate` zaten başarısız oluyorsa önce `openclaw configure` veya `openclaw doctor --fix` ile başlayın. `openclaw chat`, geçersiz yapılandırma korumasını atlamaz.

Tipik döngü:

1. Yerel modu başlatın:

```bash
openclaw chat
```

2. Ajandan neyin denetlenmesini istediğinizi sorun, örneğin:

```text
Gateway kimlik doğrulama yapılandırmamı dokümanlarla karşılaştır ve en küçük düzeltmeyi öner.
```

3. Kesin kanıt ve doğrulama için yerel kabuk komutlarını kullanın:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. `openclaw config set` veya `openclaw configure` ile dar kapsamlı değişiklikler uygulayın, ardından `!openclaw config validate` komutunu yeniden çalıştırın.
5. Doctor otomatik bir geçiş veya onarım önerirse bunu gözden geçirin ve `!openclaw doctor --fix` çalıştırın.

İpuçları:

- `openclaw.json` dosyasını elle düzenlemek yerine `openclaw config set` veya `openclaw configure` tercih edin.
- `openclaw docs "<query>"`, aynı makineden canlı doküman dizininde arama yapar.
- Yapılandırılmış şema ve SecretRef/çözülebilirlik hataları istediğinizde `openclaw config validate --json` kullanışlıdır.

## Araç çıktısı

- Araç çağrıları bağımsız değişkenler + sonuçlarla kart olarak gösterilir.
- Ctrl+O daraltılmış/genişletilmiş görünümler arasında geçiş yapar.
- Araçlar çalışırken kısmi güncellemeler aynı karta akar.

## Terminal renkleri

- TUI, asistan gövde metnini terminalinizin varsayılan ön plan renginde tutar; böylece hem koyu hem açık terminaller okunabilir kalır.
- Terminaliniz açık arka plan kullanıyorsa ve otomatik algılama yanlışsa, `openclaw tui` başlatmadan önce `OPENCLAW_THEME=light` ayarlayın.
- Bunun yerine özgün koyu paleti zorlamak için `OPENCLAW_THEME=dark` ayarlayın.

## Geçmiş + akış

- Bağlanınca TUI en son geçmişi yükler (varsayılan 200 mesaj).
- Akış yanıtları tamamlanana kadar yerinde güncellenir.
- TUI, daha zengin araç kartları için ajan araç olaylarını da dinler.

## Bağlantı ayrıntıları

- TUI, Gateway’e `mode: "tui"` olarak kaydolur.
- Yeniden bağlantılar bir sistem mesajı gösterir; olay boşlukları günlükte görünür kılınır.

## Seçenekler

- `--local`: Yerel gömülü ajan çalışma zamanına karşı çalıştır
- `--url <url>`: Gateway WebSocket URL’si (varsayılan olarak yapılandırma veya `ws://127.0.0.1:<port>`)
- `--token <token>`: Gateway token’ı (gerekiyorsa)
- `--password <password>`: Gateway parolası (gerekiyorsa)
- `--session <key>`: Oturum anahtarı (varsayılan: `main` veya kapsam global olduğunda `global`)
- `--deliver`: Asistan yanıtlarını sağlayıcıya teslim et (varsayılan kapalı)
- `--thinking <level>`: Gönderimler için düşünme düzeyini geçersiz kıl
- `--message <text>`: Bağlandıktan sonra ilk mesaj gönder
- `--timeout-ms <ms>`: Ajan zaman aşımı, ms cinsinden (varsayılan `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Yüklenecek geçmiş girdileri (varsayılan `200`)

<Warning>
`--url` ayarladığınızda TUI, yapılandırmaya veya ortam kimlik bilgilerine geri dönmez. `--token` veya `--password` değerini açıkça geçirin. Açık kimlik bilgilerinin eksik olması bir hatadır. Yerel modda `--url`, `--token` veya `--password` geçirmeyin.
</Warning>

## Sorun giderme

Mesaj gönderdikten sonra çıktı yok:

- Gateway’in bağlı ve boşta/meşgul olduğunu doğrulamak için TUI’de `/status` çalıştırın.
- Gateway günlüklerini denetleyin: `openclaw logs --follow`.
- Ajanın çalışabildiğini doğrulayın: `openclaw status` ve `openclaw models status`.
- Bir sohbet kanalında mesaj bekliyorsanız teslimi etkinleştirin (`/deliver on` veya `--deliver`).

## Bağlantı sorunlarını giderme

- `disconnected`: Gateway’in çalıştığından ve `--url/--token/--password` değerlerinizin doğru olduğundan emin olun.
- Seçicide ajan yok: `openclaw agents list` ve yönlendirme yapılandırmanızı denetleyin.
- Boş oturum seçici: global kapsamda olabilirsiniz veya henüz oturumunuz olmayabilir.

## İlgili

- [Control UI](/tr/web/control-ui) — web tabanlı denetim arayüzü
- [Config](/tr/cli/config) — `openclaw.json` dosyasını inceleyin, doğrulayın ve düzenleyin
- [Doctor](/tr/cli/doctor) — kılavuzlu onarım ve geçiş denetimleri
- [CLI Reference](/tr/cli) — tam CLI komut başvurusu
