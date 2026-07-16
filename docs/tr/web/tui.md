---
read_when:
    - TUI için yeni başlayanlara uygun bir adım adım kılavuz istiyorsunuz
    - TUI özelliklerinin, komutlarının ve kısayollarının eksiksiz listesine ihtiyacınız var
summary: 'Terminal kullanıcı arayüzü (TUI): Gateway''e bağlanın veya yerleşik modda yerel olarak çalıştırın'
title: TUI
x-i18n:
    generated_at: "2026-07-16T17:56:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1e171520c24d95ac1d6df28227efea0a1258a0b9e59b61fe02c09a2d87b24391
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

Gateway'iniz parola kimlik doğrulaması kullanıyorsa `--password` kullanın.

### Yerel mod

TUI'yi Gateway olmadan çalıştırın:

```bash
openclaw chat
# veya
openclaw tui --local
```

- `openclaw chat` ve `openclaw terminal`, `openclaw tui --local` için birer diğer addır.
- `--local`; `--url`, `--token` veya `--password` ile birlikte kullanılamaz.
- Yerel mod, gömülü ajan çalışma zamanını doğrudan kullanır. Çoğu yerel araç çalışır ancak yalnızca Gateway'e özgü özellikler kullanılamaz.
- Alt komut olmadan kullanılan `openclaw`, hedefi otomatik olarak seçer: yapılandırılmamış bir kurulum çıkarım başlangıç akışını çalıştırır; geçersiz bir yapılandırma klasik Doctor rehberini açar; erişilebilen ve yapılandırılmış bir Gateway, bu TUI kabuğunu Gateway modunda açar; aksi takdirde yapılandırılmış bir yerel model, kabuğu yerel modda açar.

## Görüntülenenler

- Üstbilgi: bağlantı URL'si, geçerli ajan, geçerli oturum.
- Sohbet günlüğü: kullanıcı mesajları, asistan yanıtları, sistem bildirimleri, araç kartları.
- Durum satırı: bağlantı/çalıştırma durumu (bağlanıyor, çalışıyor, akış yapılıyor, boşta, hata).
- Altbilgi: ajan + oturum + model + hedef durumu + düşünme/hızlı/ayrıntılı/izleme/akıl yürütme + token sayıları + teslim. `tui.footer.showRemoteHost` etkinleştirildiğinde uzak Gateway bağlantıları, bağlantı ana makinesini de gösterir.
- Giriş: otomatik tamamlamalı metin düzenleyici.

## Zihinsel model: ajanlar + oturumlar

- Ajanlar benzersiz kısa adlardır (ör. `main`, `research`). Gateway listeyi sunar.
- Oturumlar geçerli ajana aittir.
- Oturum anahtarları `agent:<agentId>:<sessionKey>` biçiminde saklanır.
  - `/session main` yazarsanız TUI bunu `agent:<currentAgent>:main` olarak genişletir.
  - `/session agent:other:main` yazarsanız açıkça o ajan oturumuna geçersiniz.
- Oturum kapsamı:
  - `per-sender` (varsayılan): her ajanın birden fazla oturumu vardır.
  - `global`: TUI her zaman `global` oturumunu kullanır (seçici boş olabilir).
- Geçerli ajan + oturum her zaman altbilgide görünür.
- Yerel olmayan, URL tabanlı bağlantılarda Gateway ana makinesini göstermek için şu ayarla etkinleştirin:

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  Varsayılan değer `false` şeklindedir. Geri döngü ve gömülü yerel bağlantılar hiçbir zaman ana makine etiketi göstermez.

- Oturumun bir [hedefi](/tr/tools/goal) varsa altbilgi bunun kompakt durumunu gösterir:
  `Pursuing goal`, `Goal paused (/goal resume)`, `Goal blocked (/goal resume)` veya `Goal achieved`.
- `--session` olmadan başlatıldığında Gateway modundaki TUI, aynı Gateway, ajan ve oturum kapsamı için son seçilen oturum hâlâ mevcutsa bu oturumu sürdürür. `--session`, `/session`, `/new` veya `/reset` iletmek açık bir seçim olmaya devam eder.

## Gönderme + teslim

- Mesajlar her zaman Gateway'e (veya yerel modda gömülü çalışma zamanına) gider; asistanın yanıtını bir sohbet sağlayıcısına geri teslim etmek, varsayılan olarak kapalı olan ayrı bir adımdır.
- TUI, genel amaçlı bir giden kanal değil, WebChat gibi dahili bir kaynak yüzeyidir. Görünür yanıtlar için `tools.message` gerektiren test donanımları, etkin TUI turunu hedefsiz bir `message.send` ile karşılayabilir; açık sağlayıcı teslimi yine normal yapılandırılmış kanalları kullanır ve hiçbir zaman `lastChannel` seçeneğine geri dönmez.
- Teslim, başlatma sırasında tüm TUI oturumu için sabitlenir: açmak için `openclaw tui --deliver` ile başlatın. Oturum sırasında değiştirmek için `/deliver` eğik çizgi komutu veya Ayarlar anahtarı yoktur; değiştirmek için TUI'yi yeniden başlatın.

## Seçiciler + katmanlar

- Model seçici: kullanılabilir modelleri listeleyin ve oturum geçersiz kılmasını ayarlayın.
- Ajan seçici: farklı bir ajan seçin.
- Oturum seçici: geçerli ajan için son 7 gün içinde güncellenmiş en fazla 50 oturumu gösterir. Bilinen daha eski bir oturuma atlamak için `/session <key>` kullanın.
- Ayarlar (`/settings`): araç çıktısının genişletilmesini ve düşünmenin görünürlüğünü açıp kapatın. Bu panel teslimi denetlemez.

## Klavye kısayolları

- Enter: mesaj gönder
- Esc: etkin çalıştırmayı iptal et
- Ctrl+C: girişi temizle (çıkmak için iki kez basın)
- Ctrl+D: çık
- Ctrl+L: model seçici
- Ctrl+G: ajan seçici
- Ctrl+P: oturum seçici
- Ctrl+O: araç çıktısının genişletilmesini aç/kapat
- Ctrl+T: düşünmenin görünürlüğünü aç/kapat (geçmişi yeniden yükler)

## Eğik çizgi komutları

Çekirdek:

- `/help`
- `/status` (Gateway'e iletilir; oturum/model özetini gösterir)
- `/gateway-status` (diğer adı `/gwstatus`; Gateway bağlantı durumunu doğrudan gösterir)
- `/agent <id>` (veya `/agents`)
- `/session <key>` (veya `/sessions`)
- `/model <provider/model>` (veya `/models`)

Oturum denetimleri:

- `/think <off|minimal|low|medium|high>` (daha yüksek katmanlar, modele bağlı olarak `xhigh`/`max` gibi düzeyler ekleyebilir)
- `/fast <status|auto|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>` (`reset`/`inherit`/`clear`/`default`, oturum geçersiz kılmasını temizler)
- `/goal [status] | /goal start <objective> | /goal edit <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>` (diğer adı: `/elev`)
- `/activation <mention|always>`

Oturum yaşam döngüsü:

- `/new` (yeni bir anahtar altında yeni ve yalıtılmış bir oturum oluşturur; eski oturumdaki diğer TUI istemcilerini etkilemez)
- `/reset` (geçerli oturum anahtarını yerinde sıfırlar)
- `/abort` (etkin çalıştırmayı iptal eder)
- `/settings`
- `/exit` (veya `/quit`)

Yalnızca yerel mod:

- `/auth [provider]`, sağlayıcı kimlik doğrulama/oturum açma akışını TUI içinde açar.

OpenClaw:

- `/openclaw [request]`, normal ajan TUI'sinden [OpenClaw](#openclaw-setup-and-repair-helper) kurulum/onarım sohbetine döner ve isteğe bağlı olarak bir isteği iletir.

Diğer Gateway eğik çizgi komutları (örneğin `/context`) Gateway'e iletilir ve sistem çıktısı olarak gösterilir. Bkz. [Eğik çizgi komutları](/tr/tools/slash-commands).

## Yerel kabuk komutları

- TUI ana makinesinde yerel bir kabuk komutu çalıştırmak için satırın başına `!` ekleyin.
- TUI, yerel yürütmeye izin vermek için oturum başına bir kez sorar; reddedilirse `!` oturum boyunca devre dışı kalır.
- Komutlar, TUI çalışma dizinindeki yeni ve etkileşimsiz bir kabukta çalışır (kalıcı `cd`/ortam yoktur).
- Yerel kabuk komutlarının ortamına `OPENCLAW_SHELL=tui-local` sağlanır.
- Tek başına `!` normal bir mesaj olarak gönderilir; baştaki boşluklar yerel yürütmeyi tetiklemez.

## OpenClaw kurulum ve onarım yardımcısı

OpenClaw, yapılandırılmış varsayılan model canlı çıkarım denetimini geçtikten sonra `openclaw setup` olarak sunulan sıfırıncı halka kurulum/onarım asistanıdır. Çıkarım kullanılamıyorsa etkileşimli bir çağrı çıkarım başlangıç akışına döner, otomasyon ise onarım rehberiyle başarısız olur. `openclaw tui --local` ile aynı yerel TUI kabuğunda çalışır ve OpenClaw'ın türü belirlenmiş, onay geçitli işlemleriyle sınırlandırılmış bir yapay zekâ ajanı tarafından desteklenir:

```bash
openclaw setup                       # etkileşimli olarak başlat
openclaw setup -m "status"           # bir istek çalıştır ve çık
openclaw setup -m "set default model openai/gpt-5.2" --yes   # yapılandırma yazma işlemi uygula
```

- Kalıcı yapılandırma yazma işlemleri onay gerektirir: etkileşimli olarak onaylayın veya `--yes` iletin.
- `--json`, sohbeti başlatmak yerine başlangıç genel görünümünü JSON olarak yazdırır.
- OpenClaw içindeyken bir `open-tui` isteği (örneğin normal bir ajanla konuşma isteği) OpenClaw'dan çıkar ve normal ajan TUI'sini açar; geri dönmek için burada `/openclaw` kullanın.

Geçerli yapılandırma zaten doğrulandığında ve gömülü ajanın aynı makinede bunu incelemesini, belgelerle karşılaştırmasını ve çalışan bir Gateway'e bağlı olmadan sapmaları onarmaya yardımcı olmasını istediğinizde yerel modu kullanın.

`openclaw config validate` zaten başarısız oluyorsa önce `openclaw configure` veya `openclaw doctor --fix` ile başlayın; `openclaw chat` başlatılmak için yine de yüklenebilir bir yapılandırma gerektirir.

Tipik döngü:

1. Yerel modu başlatın:

```bash
openclaw chat
```

2. Ajana neyi denetlemek istediğinizi sorun, örneğin:

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
- `openclaw config validate --json`, yapılandırılmış şema ve SecretRef/çözümlenebilirlik hataları istediğinizde kullanışlıdır.

## Araç çıktısı

- Araç çağrıları, bağımsız değişkenler + sonuçlar içeren kartlar olarak gösterilir.
- Ctrl+O, daraltılmış/genişletilmiş görünümler arasında geçiş yapar.
- Araçlar çalışırken kısmi güncellemeler aynı karta aktarılır.

## Terminal renkleri

- TUI, asistan gövde metnini terminalinizin varsayılan ön plan renginde tutar; böylece hem koyu hem açık terminaller okunabilir kalır.
- Terminaliniz açık renkli bir arka plan kullanıyorsa ve otomatik algılama yanlışsa `openclaw tui` başlatılmadan önce `OPENCLAW_THEME=light` ayarlayın.
- Bunun yerine özgün koyu paleti zorlamak için `OPENCLAW_THEME=dark` ayarlayın.

## Geçmiş + akış

- Bağlantı kurulduğunda TUI en son geçmişi yükler (varsayılan 200 mesaj).
- Akış yanıtları tamamlanana kadar yerinde güncellenir.
- TUI, daha zengin araç kartları için ajan aracı olaylarını da dinler.

## Bağlantı ayrıntıları

- TUI, Gateway politikası için Control UI ve WebChat'in kullandığı modla aynı olan genel `ui` istemci modu altında `openclaw-tui` istemci kimliğiyle bağlanır.
- Yeniden bağlantılar bir sistem mesajıyla gösterilir; olay boşlukları günlükte belirtilir.

## Seçenekler

- `--local`: Yerel gömülü agent çalışma zamanında çalıştır
- `--url <url>`: Gateway WebSocket URL'si (varsayılan olarak yapılandırmadaki `gateway.remote.url` veya geri döngüde `ws://127.0.0.1:<port>`)
- `--token <token>`: Gateway token'ı (gerekiyorsa)
- `--password <password>`: Gateway parolası (gerekiyorsa)
- `--tls-fingerprint <sha256>`: Sabitlenmiş bir `wss://` Gateway için beklenen TLS sertifikası parmak izi
- `--session <key>`: Oturum anahtarı (varsayılan: `main`; kapsam genelse `global`)
- `--deliver`: Asistan yanıtlarını sağlayıcıya ilet (varsayılan olarak kapalı)
- `--thinking <level>`: Gönderimler için düşünme düzeyini geçersiz kıl
- `--message <text>`: Bağlandıktan sonra ilk mesajı gönder
- `--timeout-ms <ms>`: Milisaniye cinsinden agent zaman aşımı (varsayılan olarak `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Yüklenecek geçmiş girdileri (varsayılan `200`)

<Warning>
`--url` ayarlandığında TUI, yapılandırmadaki veya ortam değişkenlerindeki kimlik bilgilerine geri dönmez. `--token` veya `--password` değerini ve hedef sabitlenmiş bir sertifika kullanıyorsa ayrıca `--tls-fingerprint` değerini açıkça iletin. Açık kimlik bilgilerinin eksik olması bir hatadır. Yerel modda `--url`, `--token`, `--password` veya `--tls-fingerprint` değerlerini iletmeyin.
</Warning>

## Sorun giderme

Mesaj gönderdikten sonra çıktı yoksa:

- Gateway'in bağlı ve boşta/meşgul olduğunu doğrulamak için TUI'da `/status` komutunu çalıştırın.
- Gateway günlüklerini kontrol edin: `openclaw logs --follow`.
- Agent'ın çalışabildiğini doğrulayın: `openclaw status` ve `openclaw models status`.
- Mesajların bir sohbet kanalına gelmesini bekliyorsanız TUI'ın `--deliver` ile başlatıldığını doğrulayın (bu özellik daha sonra yeniden başlatmadan etkinleştirilemez).

## Bağlantı sorunlarını giderme

- `disconnected`: Gateway'in çalıştığından ve `--url/--token/--password` değerlerinizin doğru olduğundan emin olun.
- Seçicide agent yoksa `openclaw agents list` değerini ve yönlendirme yapılandırmanızı kontrol edin.
- Oturum seçici boşsa genel kapsamda olabilirsiniz veya henüz hiç oturumunuz olmayabilir.

## İlgili içerikler

- [Kontrol Arayüzü](/tr/web/control-ui) — web tabanlı kontrol arayüzü
- [Yapılandırma](/tr/cli/config) — `openclaw.json` öğesini inceleyin, doğrulayın ve düzenleyin
- [Doctor](/tr/cli/doctor) — yönlendirmeli onarım ve geçiş denetimleri
- [CLI Referansı](/tr/cli) — eksiksiz CLI komut referansı
