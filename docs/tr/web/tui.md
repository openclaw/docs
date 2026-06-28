---
read_when:
    - TUI için başlangıç dostu bir adım adım kılavuz istiyorsunuz
    - TUI özelliklerinin, komutlarının ve kısayollarının tam listesine ihtiyacınız var
summary: 'Terminal UI (TUI): Gateway''e bağlanın veya gömülü modda yerel olarak çalıştırın'
title: TUI
x-i18n:
    generated_at: "2026-06-28T01:28:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed02875ea5dcb8cef987d16fe11701eba11160525caf9791f74c610b1b6bec6e
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
# or
openclaw tui --local
```

Notlar:

- `openclaw chat` ve `openclaw terminal`, `openclaw tui --local` için takma adlardır.
- `--local`, `--url`, `--token` veya `--password` ile birlikte kullanılamaz.
- Yerel mod, gömülü agent çalışma zamanını doğrudan kullanır. Çoğu yerel araç çalışır, ancak yalnızca Gateway özellikleri kullanılamaz.
- Bir yapılandırma dosyasında yazılmış ayarlar olduktan sonra, `openclaw` ve `openclaw crestodian` da bu TUI kabuğunu kullanır; Crestodian yerel kurulum ve onarım sohbet arka ucu olur.

## Gördükleriniz

- Üst bilgi: bağlantı URL'si, geçerli agent, geçerli oturum.
- Sohbet günlüğü: kullanıcı mesajları, asistan yanıtları, sistem bildirimleri, araç kartları.
- Durum satırı: bağlantı/çalıştırma durumu (bağlanıyor, çalışıyor, akışta, boşta, hata).
- Alt bilgi: agent + oturum + model + hedef durumu + düşün/hızlı/ayrıntılı/izleme/akıl yürütme + token sayıları + teslim. `tui.footer.showRemoteHost` etkinleştirildiğinde, uzak Gateway bağlantıları bağlantı host'unu da gösterir.
- Girdi: otomatik tamamlama özellikli metin düzenleyici.

## Zihinsel model: agent'lar + oturumlar

- Agent'lar benzersiz slug'lardır (örn. `main`, `research`). Gateway listeyi sunar.
- Oturumlar geçerli agent'a aittir.
- Oturum anahtarları `agent:<agentId>:<sessionKey>` olarak saklanır.
  - `/session main` yazarsanız, TUI bunu `agent:<currentAgent>:main` olarak genişletir.
  - `/session agent:other:main` yazarsanız, açıkça o agent oturumuna geçersiniz.
- Oturum kapsamı:
  - `per-sender` (varsayılan): her agent'ın birçok oturumu vardır.
  - `global`: TUI her zaman `global` oturumunu kullanır (seçici boş olabilir).
- Geçerli agent + oturum alt bilgide her zaman görünür.
- Yerel olmayan URL destekli bağlantılarda Gateway host'unu göstermek için şununla etkinleştirin:

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  Loopback ve gömülü yerel bağlantılar hiçbir zaman host etiketi göstermez.

- Oturumun bir [hedefi](/tr/tools/goal) varsa, alt bilgi `Pursuing goal`, `Goal paused (/goal resume)` veya `Goal achieved` gibi kompakt durumunu gösterir.
- `--session` olmadan başlatıldığında, Gateway modundaki TUI aynı gateway, agent ve oturum kapsamı için son seçilen oturum hâlâ mevcutsa onu sürdürür. `--session`, `/session`, `/new` veya `/reset` geçirmek açık seçim olarak kalır.

## Gönderme + teslim

- Mesajlar Gateway'e gönderilir; sağlayıcılara teslim varsayılan olarak kapalıdır.
- TUI, WebChat gibi dahili bir kaynak yüzeyidir; genel amaçlı bir giden kanal değildir. Görünür yanıtlar için `tools.message` gerektiren harness'lar, hedefsiz `message.send` ile etkin TUI turunu karşılayabilir; açık sağlayıcı teslimi yine normal yapılandırılmış kanalları kullanır ve hiçbir zaman `lastChannel` değerine geri dönmez.
- Teslimi açın:
  - `/deliver on`
  - veya Ayarlar paneli
  - veya `openclaw tui --deliver` ile başlatın

## Seçiciler + katmanlar

- Model seçici: kullanılabilir modelleri listeleyin ve oturum geçersiz kılmasını ayarlayın.
- Agent seçici: farklı bir agent seçin.
- Oturum seçici: geçerli agent için son 7 gün içinde güncellenmiş en fazla 50 oturumu gösterir. Daha eski bilinen bir oturuma atlamak için `/session <key>` kullanın.
- Ayarlar: teslimi, araç çıktısı genişletmesini ve düşünme görünürlüğünü açıp kapatın.

## Klavye kısayolları

- Enter: mesaj gönder
- Esc: etkin çalıştırmayı iptal et
- Ctrl+C: girdiyi temizle (çıkmak için iki kez basın)
- Ctrl+D: çık
- Ctrl+L: model seçici
- Ctrl+G: agent seçici
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
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>` (`reset`/`inherit`/`clear`/`default` oturum geçersiz kılmasını temizler)
- `/goal [status] | /goal start <objective> | /goal pause|resume|complete|block|clear`
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

Diğer Gateway slash komutları (örneğin `/context`) Gateway'e iletilir ve sistem çıktısı olarak gösterilir. Bkz. [Slash komutları](/tr/tools/slash-commands).

## Yerel kabuk komutları

- TUI host'unda yerel bir kabuk komutu çalıştırmak için satırın başına `!` ekleyin.
- TUI, yerel yürütmeye izin vermek için oturum başına bir kez sorar; reddetmek oturum için `!` özelliğini devre dışı tutar.
- Komutlar, TUI çalışma dizininde taze, etkileşimsiz bir kabukta çalışır (kalıcı `cd`/env yoktur).
- Yerel kabuk komutları ortamlarında `OPENCLAW_SHELL=tui-local` alır.
- Tek başına `!` normal mesaj olarak gönderilir; baştaki boşluklar yerel yürütmeyi tetiklemez.

## Yerel TUI'den yapılandırmaları onarın

Geçerli yapılandırma zaten doğrulanıyorsa ve gömülü agent'ın aynı makinede bunu incelemesini, dokümanlarla karşılaştırmasını ve çalışan bir Gateway'e bağlı kalmadan sapmayı onarmaya yardımcı olmasını istiyorsanız yerel modu kullanın.

`openclaw config validate` zaten başarısız oluyorsa önce `openclaw configure` veya `openclaw doctor --fix` ile başlayın. `openclaw chat`, geçersiz yapılandırma korumasını atlamaz.

Tipik döngü:

1. Yerel modu başlatın:

```bash
openclaw chat
```

2. Agent'a neyi denetlemek istediğinizi sorun, örneğin:

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. Kesin kanıt ve doğrulama için yerel kabuk komutlarını kullanın:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. `openclaw config set` veya `openclaw configure` ile dar kapsamlı değişiklikler uygulayın, ardından `!openclaw config validate` komutunu yeniden çalıştırın.
5. Doctor otomatik bir migration veya onarım önerirse, inceleyin ve `!openclaw doctor --fix` komutunu çalıştırın.

İpuçları:

- `openclaw.json` dosyasını elle düzenlemek yerine `openclaw config set` veya `openclaw configure` tercih edin.
- `openclaw docs "<query>"`, aynı makineden canlı doküman dizininde arama yapar.
- Yapılandırılmış şema ve SecretRef/çözülebilirlik hataları istediğinizde `openclaw config validate --json` yararlıdır.

## Araç çıktısı

- Araç çağrıları argümanlar + sonuçlarla kart olarak gösterilir.
- Ctrl+O, daraltılmış/genişletilmiş görünümler arasında geçiş yapar.
- Araçlar çalışırken kısmi güncellemeler aynı karta akar.

## Terminal renkleri

- TUI, asistan gövde metnini terminalinizin varsayılan ön plan renginde tutar; böylece hem koyu hem açık terminaller okunabilir kalır.
- Terminaliniz açık arka plan kullanıyorsa ve otomatik algılama yanlışsa, `openclaw tui` başlatmadan önce `OPENCLAW_THEME=light` ayarlayın.
- Bunun yerine özgün koyu paleti zorlamak için `OPENCLAW_THEME=dark` ayarlayın.

## Geçmiş + akış

- Bağlanıldığında TUI en son geçmişi yükler (varsayılan 200 mesaj).
- Akış yanıtları tamamlanana kadar yerinde güncellenir.
- TUI ayrıca daha zengin araç kartları için agent araç olaylarını dinler.

## Bağlantı ayrıntıları

- TUI, Gateway'e `mode: "tui"` olarak kaydolur.
- Yeniden bağlanmalar bir sistem mesajı gösterir; olay boşlukları günlükte görünür kılınır.

## Seçenekler

- `--local`: Yerel gömülü agent çalışma zamanına karşı çalıştır
- `--url <url>`: Gateway WebSocket URL'si (varsayılan olarak yapılandırma veya `ws://127.0.0.1:<port>`)
- `--token <token>`: Gateway token'ı (gerekliyse)
- `--password <password>`: Gateway parolası (gerekliyse)
- `--session <key>`: Oturum anahtarı (varsayılan: `main`, kapsam global olduğunda `global`)
- `--deliver`: Asistan yanıtlarını sağlayıcıya teslim et (varsayılan kapalı)
- `--thinking <level>`: Gönderimler için düşünme düzeyini geçersiz kıl
- `--message <text>`: Bağlandıktan sonra ilk mesaj gönder
- `--timeout-ms <ms>`: Ms cinsinden agent zaman aşımı (varsayılan `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Yüklenecek geçmiş girdileri (varsayılan `200`)

<Warning>
`--url` ayarladığınızda, TUI yapılandırma veya ortam kimlik bilgilerine geri dönmez. `--token` veya `--password` değerini açıkça geçirin. Açık kimlik bilgilerinin eksik olması hatadır. Yerel modda `--url`, `--token` veya `--password` geçirmeyin.
</Warning>

## Sorun giderme

Mesaj gönderdikten sonra çıktı yok:

- Gateway'in bağlı ve boşta/meşgul olduğunu doğrulamak için TUI içinde `/status` çalıştırın.
- Gateway günlüklerini kontrol edin: `openclaw logs --follow`.
- Agent'ın çalışabildiğini doğrulayın: `openclaw status` ve `openclaw models status`.
- Bir sohbet kanalında mesaj bekliyorsanız teslimi etkinleştirin (`/deliver on` veya `--deliver`).

## Bağlantı sorunlarını giderme

- `disconnected`: Gateway'in çalıştığından ve `--url/--token/--password` değerlerinizin doğru olduğundan emin olun.
- Seçicide agent yok: `openclaw agents list` ve yönlendirme yapılandırmanızı kontrol edin.
- Boş oturum seçici: global kapsamda olabilirsiniz veya henüz oturumunuz olmayabilir.

## İlgili

- [Kontrol UI](/tr/web/control-ui) — web tabanlı denetim arayüzü
- [Yapılandırma](/tr/cli/config) — `openclaw.json` dosyasını incele, doğrula ve düzenle
- [Doctor](/tr/cli/doctor) — yönlendirmeli onarım ve migration denetimleri
- [CLI Referansı](/tr/cli) — tam CLI komut referansı
