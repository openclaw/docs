---
read_when:
    - TUI için yeni başlayanlara uygun bir adım adım rehber istiyorsunuz
    - TUI özelliklerinin, komutlarının ve kısayollarının tam listesine ihtiyacınız var
summary: 'Terminal kullanıcı arayüzü (TUI): Gateway''e bağlanın veya gömülü modda yerel olarak çalıştırın'
title: TUI
x-i18n:
    generated_at: "2026-07-12T12:20:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d7181ea88643a129532f698908fd3dd3d93078b7e33b0ab1166dcfca2ecc2abd
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

3. Bir mesaj yazıp Enter tuşuna basın.

Uzak Gateway:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Gateway'iniz parola ile kimlik doğrulama kullanıyorsa `--password` seçeneğini kullanın.

### Yerel mod

TUI'yi Gateway olmadan çalıştırın:

```bash
openclaw chat
# veya
openclaw tui --local
```

- `openclaw chat` ve `openclaw terminal`, `openclaw tui --local` için takma adlardır.
- `--local`; `--url`, `--token` veya `--password` ile birlikte kullanılamaz.
- Yerel mod, gömülü ajan çalışma zamanını doğrudan kullanır. Çoğu yerel araç çalışır ancak yalnızca Gateway'e özgü özellikler kullanılamaz.
- Alt komut verilmeden çalıştırılan `openclaw`, hedefi otomatik olarak seçer: yapılandırılmamış bir kurulum çıkarım ilk kurulumunu çalıştırır; geçersiz yapılandırma klasik Doctor yönlendirmesini açar; erişilebilen, yapılandırılmış bir Gateway bu TUI kabuğunu Gateway modunda açar; aksi hâlde yapılandırılmış bir yerel model bunu yerel modda açar.

## Görecekleriniz

- Başlık: bağlantı URL'si, geçerli ajan, geçerli oturum.
- Sohbet günlüğü: kullanıcı mesajları, asistan yanıtları, sistem bildirimleri, araç kartları.
- Durum satırı: bağlantı/çalıştırma durumu (bağlanıyor, çalışıyor, akış yapılıyor, boşta, hata).
- Alt bilgi: ajan + oturum + model + hedef durumu + düşünme/hızlı/ayrıntılı/izleme/akıl yürütme + token sayıları + teslimat. `tui.footer.showRemoteHost` etkinleştirildiğinde uzak Gateway bağlantıları, bağlantı ana makinesini de gösterir.
- Giriş: otomatik tamamlamalı metin düzenleyici.

## Zihinsel model: ajanlar + oturumlar

- Ajanlar benzersiz kısa adlara sahiptir (ör. `main`, `research`). Gateway listeyi kullanıma sunar.
- Oturumlar geçerli ajana aittir.
- Oturum anahtarları `agent:<agentId>:<sessionKey>` biçiminde saklanır.
  - `/session main` yazarsanız TUI bunu `agent:<currentAgent>:main` biçimine genişletir.
  - `/session agent:other:main` yazarsanız açıkça o ajan oturumuna geçersiniz.
- Oturum kapsamı:
  - `per-sender` (varsayılan): her ajanın birden fazla oturumu vardır.
  - `global`: TUI her zaman `global` oturumunu kullanır (seçici boş olabilir).
- Geçerli ajan ve oturum her zaman alt bilgide görünür.
- Yerel olmayan, URL destekli bağlantılarda Gateway ana makinesini göstermek için şu ayarı etkinleştirin:

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  Varsayılan değer `false` şeklindedir. local loopback ve gömülü yerel bağlantılar hiçbir zaman ana makine etiketi göstermez.

- Oturumun bir [hedefi](/tr/tools/goal) varsa alt bilgi, hedefin kısa durumunu gösterir:
  `Hedef sürdürülüyor`, `Hedef duraklatıldı (/goal resume)`, `Hedef engellendi (/goal resume)` veya `Hedefe ulaşıldı`.
- `--session` olmadan başlatıldığında Gateway modundaki TUI, aynı Gateway, ajan ve oturum kapsamı için son seçilen oturum hâlâ mevcutsa bu oturumu sürdürür. `--session`, `/session`, `/new` veya `/reset` kullanımı açık seçim olarak kalır.

## Gönderme + teslimat

- Mesajlar her zaman Gateway'e (yerel modda ise gömülü çalışma zamanına) gider; asistanın yanıtını bir sohbet sağlayıcısına geri teslim etmek, varsayılan olarak kapalı olan ayrı bir adımdır.
- TUI, genel amaçlı bir giden kanal değil, WebChat gibi dahili bir kaynak yüzeyidir. Görünür yanıtlar için `tools.message` gerektiren çalıştırma ortamları, etkin TUI dönüşünü hedefsiz bir `message.send` ile karşılayabilir; açık sağlayıcı teslimatı ise normal yapılandırılmış kanalları kullanmaya devam eder ve hiçbir zaman `lastChannel` seçeneğine geri dönmez.
- Teslimat, başlatma sırasında tüm TUI oturumu için sabitlenir: etkinleştirmek için `openclaw tui --deliver` ile başlatın. Oturum sırasında bunu değiştirecek bir `/deliver` eğik çizgi komutu veya Ayarlar anahtarı yoktur; değiştirmek için TUI'yi yeniden başlatın.

## Seçiciler + katmanlar

- Model seçici: kullanılabilir modelleri listeler ve oturum geçersiz kılmasını ayarlar.
- Ajan seçici: farklı bir ajan seçer.
- Oturum seçici: geçerli ajan için son 7 gün içinde güncellenmiş en fazla 50 oturumu gösterir. Bilinen daha eski bir oturuma geçmek için `/session <key>` kullanın.
- Ayarlar (`/settings`): araç çıktısının genişletilmesini ve düşünme görünürlüğünü açıp kapatır. Bu panel teslimatı denetlemez.

## Klavye kısayolları

- Enter: mesaj gönder
- Esc: etkin çalıştırmayı iptal et
- Ctrl+C: girişi temizle (çıkmak için iki kez basın)
- Ctrl+D: çık
- Ctrl+L: model seçici
- Ctrl+G: ajan seçici
- Ctrl+P: oturum seçici
- Ctrl+O: araç çıktısının genişletilmesini aç/kapat
- Ctrl+T: düşünme görünürlüğünü aç/kapat (geçmişi yeniden yükler)

## Eğik çizgi komutları

Temel:

- `/help`
- `/status` (Gateway'e iletilir; oturum/model özetini gösterir)
- `/gateway-status` (`/gwstatus` takma adı; Gateway bağlantı durumunu doğrudan gösterir)
- `/agent <id>` (veya `/agents`)
- `/session <key>` (veya `/sessions`)
- `/model <provider/model>` (veya `/models`)

Oturum denetimleri:

- `/think <off|minimal|low|medium|high>` (modele bağlı olarak daha yüksek kademeler `xhigh`/`max` gibi düzeyler ekleyebilir)
- `/fast <status|auto|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>` (`reset`/`inherit`/`clear`/`default`, oturum geçersiz kılmasını temizler)
- `/goal [status] | /goal start <objective> | /goal edit <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>` (takma ad: `/elev`)
- `/activation <mention|always>`

Oturum yaşam döngüsü:

- `/new` (yeni bir anahtar altında yeni ve yalıtılmış bir oturum oluşturur; eski oturumdaki diğer TUI istemcilerini etkilemez)
- `/reset` (geçerli oturum anahtarını yerinde sıfırlar)
- `/abort` (etkin çalıştırmayı iptal eder)
- `/settings`
- `/exit` (veya `/quit`)

Yalnızca yerel mod:

- `/auth [provider]`, sağlayıcının kimlik doğrulama/oturum açma akışını TUI içinde açar.

Crestodian:

- `/crestodian [request]`, isteğe bağlı olarak bir isteği iletip normal ajan TUI'sinden [Crestodian](#crestodian-setup-and-repair-helper) kurulum/onarım sohbetine döner.

Diğer Gateway eğik çizgi komutları (örneğin `/context`) Gateway'e iletilir ve sistem çıktısı olarak gösterilir. Bkz. [Eğik çizgi komutları](/tr/tools/slash-commands).

## Yerel kabuk komutları

- TUI ana makinesinde yerel bir kabuk komutu çalıştırmak için satırın başına `!` ekleyin.
- TUI, yerel yürütmeye izin vermek için oturum başına bir kez onay ister; reddederseniz `!` oturum boyunca devre dışı kalır.
- Komutlar, TUI çalışma dizininde yeni ve etkileşimsiz bir kabukta çalışır (kalıcı `cd`/ortam yoktur).
- Yerel kabuk komutlarının ortamına `OPENCLAW_SHELL=tui-local` eklenir.
- Tek başına bir `!`, normal mesaj olarak gönderilir; baştaki boşluklar yerel yürütmeyi tetiklemez.

## Crestodian kurulum ve onarım yardımcısı

Crestodian, yapılandırılmış varsayılan model canlı çıkarım denetimini geçtikten sonra `openclaw crestodian` olarak kullanıma sunulan sıfırıncı halka kurulum/onarım asistanıdır. Çıkarım kullanılamıyorsa etkileşimli çağrı çıkarım ilk kurulumuna döner ve otomasyon, onarım yönlendirmesiyle başarısız olur. `openclaw tui --local` ile aynı yerel TUI kabuğunda çalışır ve Crestodian'ın türü belirlenmiş, onaya tabi işlemleriyle sınırlandırılmış bir yapay zekâ ajanı tarafından desteklenir:

```bash
openclaw crestodian                       # etkileşimli olarak başlat
openclaw crestodian -m "status"           # bir istek çalıştır ve çık
openclaw crestodian -m "set default model openai/gpt-5.2" --yes   # yapılandırma yazımını uygula
```

- Kalıcı yapılandırma yazımları onay gerektirir: etkileşimli olarak onaylayın veya `--yes` seçeneğini geçirin.
- `--json`, sohbeti başlatmak yerine başlangıç genel görünümünü JSON olarak yazdırır.
- Crestodian içindeyken bir `open-tui` isteği (örneğin normal bir ajanla konuşma isteği), Crestodian'dan çıkar ve normal ajan TUI'sini açar; geri dönmek için orada `/crestodian` kullanın.

Geçerli yapılandırma zaten doğrulanıyorsa ve gömülü ajanın bunu aynı makinede incelemesini, belgelerle karşılaştırmasını ve çalışan bir Gateway'e bağlı olmadan sapmaları onarmaya yardımcı olmasını istiyorsanız yerel modu kullanın.

`openclaw config validate` zaten başarısız oluyorsa önce `openclaw configure` veya `openclaw doctor --fix` ile başlayın; `openclaw chat` başlatılmak için yine de yüklenebilir bir yapılandırmaya ihtiyaç duyar.

Tipik döngü:

1. Yerel modu başlatın:

```bash
openclaw chat
```

2. Ajandan neyi denetlemesini istediğinizi belirtin, örneğin:

```text
Gateway kimlik doğrulama yapılandırmamı belgelerle karşılaştır ve en küçük düzeltmeyi öner.
```

3. Kesin kanıt ve doğrulama için yerel kabuk komutlarını kullanın:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. `openclaw config set` veya `openclaw configure` ile dar kapsamlı değişiklikler uygulayın, ardından `!openclaw config validate` komutunu yeniden çalıştırın.
5. Doctor otomatik bir geçiş veya onarım önerirse bunu inceleyip `!openclaw doctor --fix` komutunu çalıştırın.

İpuçları:

- `openclaw.json` dosyasını elle düzenlemek yerine `openclaw config set` veya `openclaw configure` kullanmayı tercih edin.
- `openclaw docs "<query>"`, aynı makineden canlı belge dizininde arama yapar.
- Yapılandırılmış şema ile SecretRef/çözümlenebilirlik hatalarını görmek istediğinizde `openclaw config validate --json` kullanışlıdır.

## Araç çıktısı

- Araç çağrıları, bağımsız değişkenler + sonuçlar içeren kartlar olarak gösterilir.
- Ctrl+O, daraltılmış ve genişletilmiş görünümler arasında geçiş yapar.
- Araçlar çalışırken kısmi güncellemeler aynı karta akışla aktarılır.

## Terminal renkleri

- TUI, asistan gövde metnini terminalinizin varsayılan ön plan renginde tutar; böylece hem koyu hem de açık terminaller okunabilir kalır.
- Terminaliniz açık renkli bir arka plan kullanıyor ve otomatik algılama yanlış çalışıyorsa `openclaw tui` komutunu başlatmadan önce `OPENCLAW_THEME=light` ayarını yapın.
- Bunun yerine özgün koyu paleti zorlamak için `OPENCLAW_THEME=dark` ayarını yapın.

## Geçmiş + akış

- TUI, bağlandığında en son geçmişi yükler (varsayılan 200 mesaj).
- Akışla alınan yanıtlar tamamlanana kadar yerinde güncellenir.
- TUI ayrıca daha zengin araç kartları için ajan araç olaylarını dinler.

## Bağlantı ayrıntıları

- TUI, kaba düzeyli `ui` istemci modu altında `openclaw-tui` istemci kimliğiyle bağlanır (Control UI ve WebChat'in Gateway ilkesi için kullandığı modla aynıdır).
- Yeniden bağlantılar bir sistem mesajı gösterir; olay boşlukları günlükte belirtilir.

## Seçenekler

- `--local`: Yerel gömülü ajan çalışma zamanına karşı çalıştır
- `--url <url>`: Gateway WebSocket URL'si (varsayılan olarak yapılandırmadaki `gateway.remote.url` veya local loopback üzerinde `ws://127.0.0.1:<port>`)
- `--token <token>`: Gateway token'ı (gerekiyorsa)
- `--password <password>`: Gateway parolası (gerekiyorsa)
- `--tls-fingerprint <sha256>`: Sabitlenmiş bir `wss://` Gateway için beklenen TLS sertifikası parmak izi
- `--session <key>`: Oturum anahtarı (varsayılan: `main`; kapsam global olduğunda `global`)
- `--deliver`: Asistan yanıtlarını sağlayıcıya teslim et (varsayılan olarak kapalı)
- `--thinking <level>`: Gönderimler için düşünme düzeyini geçersiz kıl
- `--message <text>`: Bağlandıktan sonra bir ilk mesaj gönder
- `--timeout-ms <ms>`: Milisaniye cinsinden ajan zaman aşımı (varsayılan olarak `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Yüklenecek geçmiş girdileri (varsayılan `200`)

<Warning>
`--url` ayarlandığında TUI, yapılandırma veya ortam kimlik bilgilerine geri dönmez. `--token` veya `--password` seçeneğini açıkça geçirin; hedef sabitlenmiş bir sertifika kullanıyorsa ayrıca `--tls-fingerprint` seçeneğini geçirin. Açık kimlik bilgilerinin eksik olması hatadır. Yerel modda `--url`, `--token`, `--password` veya `--tls-fingerprint` geçirmeyin.
</Warning>

## Sorun giderme

Mesaj gönderdikten sonra çıktı yoksa:

- Gateway'in bağlı ve boşta/meşgul olduğunu doğrulamak için TUI'de `/status` komutunu çalıştırın.
- Gateway günlüklerini denetleyin: `openclaw logs --follow`.
- Ajanın çalışabildiğini doğrulayın: `openclaw status` ve `openclaw models status`.
- Mesajların bir sohbet kanalında görünmesini bekliyorsanız TUI'nin `--deliver` ile başlatıldığını doğrulayın (bu seçenek yeniden başlatmadan sonradan etkinleştirilemez).

## Bağlantı sorunlarını giderme

- `disconnected`: Gateway'in çalıştığından ve `--url/--token/--password` değerlerinizin doğru olduğundan emin olun.
- Seçicide ajan yoksa: `openclaw agents list` komutunu ve yönlendirme yapılandırmanızı denetleyin.
- Oturum seçici boşsa: global kapsamda olabilirsiniz veya henüz oturumunuz olmayabilir.

## İlgili

- [Control UI](/tr/web/control-ui) — web tabanlı denetim arayüzü
- [Yapılandırma](/tr/cli/config) — `openclaw.json` dosyasını inceleyin, doğrulayın ve düzenleyin
- [Doctor](/tr/cli/doctor) — yönlendirmeli onarım ve geçiş denetimleri
- [CLI Başvurusu](/tr/cli) — eksiksiz CLI komut başvurusu
