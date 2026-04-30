---
read_when:
    - TUI için yeni başlayanlara uygun bir adım adım kılavuz istiyorsunuz
    - TUI özelliklerinin, komutlarının ve kısayollarının eksiksiz listesine ihtiyacınız var
summary: 'Terminal kullanıcı arayüzü (TUI): Gateway''e bağlanın veya gömülü modda yerel olarak çalıştırın'
title: TUI
x-i18n:
    generated_at: "2026-04-30T09:52:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5caca4b3f4df02ce1226a8ed0d759023464e5b0752b9cd1b7922b20099d58df1
    source_path: web/tui.md
    workflow: 16
---

## Hızlı başlangıç

### Gateway modu

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

Gateway'iniz parola kimlik doğrulaması kullanıyorsa `--password` kullanın.

### Yerel mod

TUI'yi Gateway olmadan çalıştırın:

```bash
openclaw chat
# veya
openclaw tui --local
```

Notlar:

- `openclaw chat` ve `openclaw terminal`, `openclaw tui --local` için takma adlardır.
- `--local`, `--url`, `--token` veya `--password` ile birlikte kullanılamaz.
- Yerel mod, gömülü ajan çalışma zamanını doğrudan kullanır. Çoğu yerel araç çalışır, ancak yalnızca Gateway özellikleri kullanılamaz.
- `openclaw` ve `openclaw crestodian` da bu TUI kabuğunu kullanır; Crestodian, yerel kurulum ve onarım sohbet arka ucu olarak çalışır.

## Ne görürsünüz

- Üst bilgi: bağlantı URL'si, geçerli ajan, geçerli oturum.
- Sohbet günlüğü: kullanıcı mesajları, asistan yanıtları, sistem bildirimleri, araç kartları.
- Durum satırı: bağlantı/çalışma durumu (bağlanıyor, çalışıyor, akış yapıyor, boşta, hata).
- Alt bilgi: bağlantı durumu + ajan + oturum + model + düşün/hızlı/ayrıntılı/izleme/gerekçelendirme + token sayıları + teslim.
- Girdi: otomatik tamamlamalı metin düzenleyici.

## Zihinsel model: ajanlar + oturumlar

- Ajanlar benzersiz slug'lardır (örn. `main`, `research`). Gateway listeyi sunar.
- Oturumlar geçerli ajana aittir.
- Oturum anahtarları `agent:<agentId>:<sessionKey>` olarak saklanır.
  - `/session main` yazarsanız TUI bunu `agent:<currentAgent>:main` biçimine genişletir.
  - `/session agent:other:main` yazarsanız açıkça o ajan oturumuna geçersiniz.
- Oturum kapsamı:
  - `per-sender` (varsayılan): her ajanın birçok oturumu vardır.
  - `global`: TUI her zaman `global` oturumunu kullanır (seçici boş olabilir).
- Geçerli ajan + oturum her zaman alt bilgide görünür.

## Gönderme + teslim

- Mesajlar Gateway'e gönderilir; sağlayıcılara teslim varsayılan olarak kapalıdır.
- Teslimi açın:
  - `/deliver on`
  - veya Ayarlar paneli
  - veya `openclaw tui --deliver` ile başlatın

## Seçiciler + katmanlar

- Model seçici: kullanılabilir modelleri listeleyin ve oturum geçersiz kılmasını ayarlayın.
- Ajan seçici: farklı bir ajan seçin.
- Oturum seçici: yalnızca geçerli ajan için oturumları gösterir.
- Ayarlar: teslimi, araç çıktısı genişletmeyi ve düşünme görünürlüğünü açıp kapatın.

## Klavye kısayolları

- Enter: mesaj gönder
- Esc: etkin çalışmayı iptal et
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

Oturum kontrolleri:

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
- `/abort` (etkin çalışmayı iptal et)
- `/settings`
- `/exit`

Yalnızca yerel mod:

- `/auth [provider]`, sağlayıcı kimlik doğrulama/giriş akışını TUI içinde açar.

Diğer Gateway slash komutları (örneğin, `/context`) Gateway'e iletilir ve sistem çıktısı olarak gösterilir. Bkz. [Slash komutları](/tr/tools/slash-commands).

## Yerel kabuk komutları

- TUI ana makinesinde yerel bir kabuk komutu çalıştırmak için satırın başına `!` ekleyin.
- TUI, yerel yürütmeye izin vermek için oturum başına bir kez onay ister; reddetmek `!` kullanımını oturum için devre dışı bırakır.
- Komutlar TUI çalışma dizininde yeni, etkileşimsiz bir kabukta çalışır (kalıcı `cd`/env yoktur).
- Yerel kabuk komutları ortamlarında `OPENCLAW_SHELL=tui-local` alır.
- Tek başına `!` normal mesaj olarak gönderilir; baştaki boşluklar yerel yürütmeyi tetiklemez.

## Yerel TUI'den yapılandırmaları onarma

Geçerli yapılandırma zaten doğrulanıyorsa ve gömülü ajanın bunu aynı makinede incelemesini, dokümanlarla karşılaştırmasını ve çalışan bir Gateway'e bağlı olmadan sapmayı onarmaya yardım etmesini istiyorsanız yerel modu kullanın.

`openclaw config validate` zaten başarısız oluyorsa önce `openclaw configure` veya `openclaw doctor --fix` ile başlayın. `openclaw chat` geçersiz yapılandırma korumasını atlamaz.

Tipik döngü:

1. Yerel modu başlatın:

```bash
openclaw chat
```

2. Ajana neyin kontrol edilmesini istediğinizi sorun, örneğin:

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

4. `openclaw config set` veya `openclaw configure` ile dar kapsamlı değişiklikleri uygulayın, ardından `!openclaw config validate` komutunu yeniden çalıştırın.
5. Doctor otomatik bir geçiş veya onarım önerirse bunu inceleyin ve `!openclaw doctor --fix` komutunu çalıştırın.

İpuçları:

- `openclaw.json` dosyasını elle düzenlemek yerine `openclaw config set` veya `openclaw configure` tercih edin.
- `openclaw docs "<query>"`, aynı makineden canlı doküman dizininde arama yapar.
- Yapılandırılmış şema ve SecretRef/çözülebilirlik hataları istediğinizde `openclaw config validate --json` kullanışlıdır.

## Araç çıktısı

- Araç çağrıları bağımsız değişkenler + sonuçlarla birlikte kart olarak gösterilir.
- Ctrl+O daraltılmış/genişletilmiş görünümler arasında geçiş yapar.
- Araçlar çalışırken kısmi güncellemeler aynı karta akar.

## Terminal renkleri

- TUI, koyu ve açık terminallerin okunabilir kalması için asistan gövde metnini terminalinizin varsayılan ön plan renginde tutar.
- Terminaliniz açık renkli bir arka plan kullanıyorsa ve otomatik algılama yanlışsa, `openclaw tui` başlatmadan önce `OPENCLAW_THEME=light` ayarlayın.
- Bunun yerine özgün koyu paleti zorlamak için `OPENCLAW_THEME=dark` ayarlayın.

## Geçmiş + akış

- Bağlanınca TUI en son geçmişi yükler (varsayılan 200 mesaj).
- Akış yanıtları sonuçlanana kadar yerinde güncellenir.
- TUI ayrıca daha zengin araç kartları için ajan araç olaylarını dinler.

## Bağlantı ayrıntıları

- TUI, Gateway'e `mode: "tui"` olarak kaydolur.
- Yeniden bağlantılar bir sistem mesajı gösterir; olay boşlukları günlükte görünür hale getirilir.

## Seçenekler

- `--local`: Yerel gömülü ajan çalışma zamanına karşı çalıştır
- `--url <url>`: Gateway WebSocket URL'si (varsayılan yapılandırmaya veya `ws://127.0.0.1:<port>` adresine döner)
- `--token <token>`: Gateway token'ı (gerekliyse)
- `--password <password>`: Gateway parolası (gerekliyse)
- `--session <key>`: Oturum anahtarı (varsayılan: `main`, kapsam global olduğunda `global`)
- `--deliver`: Asistan yanıtlarını sağlayıcıya teslim et (varsayılan kapalı)
- `--thinking <level>`: Gönderimler için düşünme düzeyini geçersiz kıl
- `--message <text>`: Bağlandıktan sonra ilk mesaj gönder
- `--timeout-ms <ms>`: ms cinsinden ajan zaman aşımı (varsayılan `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Yüklenecek geçmiş girdileri (varsayılan `200`)

<Warning>
`--url` ayarladığınızda TUI, yapılandırmaya veya ortam kimlik bilgilerine geri dönmez. `--token` veya `--password` değerini açıkça geçirin. Açık kimlik bilgilerinin eksik olması hatadır. Yerel modda `--url`, `--token` veya `--password` geçirmeyin.
</Warning>

## Sorun giderme

Mesaj gönderdikten sonra çıktı yok:

- Gateway'in bağlı ve boşta/meşgul olduğunu doğrulamak için TUI'de `/status` çalıştırın.
- Gateway günlüklerini kontrol edin: `openclaw logs --follow`.
- Ajanın çalışabildiğini doğrulayın: `openclaw status` ve `openclaw models status`.
- Bir sohbet kanalında mesaj bekliyorsanız teslimi etkinleştirin (`/deliver on` veya `--deliver`).

## Bağlantı sorunlarını giderme

- `disconnected`: Gateway'in çalıştığından ve `--url/--token/--password` değerlerinizin doğru olduğundan emin olun.
- Seçicide ajan yok: `openclaw agents list` ve yönlendirme yapılandırmanızı kontrol edin.
- Boş oturum seçici: global kapsamda olabilir veya henüz hiç oturumunuz olmayabilir.

## İlgili

- [Kontrol UI](/tr/web/control-ui) — web tabanlı kontrol arayüzü
- [Yapılandırma](/tr/cli/config) — `openclaw.json` dosyasını inceleyin, doğrulayın ve düzenleyin
- [Doctor](/tr/cli/doctor) — kılavuzlu onarım ve geçiş kontrolleri
- [CLI Referansı](/tr/cli) — tam CLI komut referansı
