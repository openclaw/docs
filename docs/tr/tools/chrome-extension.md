---
read_when:
    - Telefonunuzdan bir ajanın oturum açtığınız gerçek Chrome'u kontrol etmesini istiyorsunuz
    - Masanın başında kimse yokken Chrome'un "Allow remote debugging?" istemiyle sürekli karşılaşıyorsunuz
    - Uzantı aracılığıyla tarayıcı denetimini ele geçirmenin güvenlik modelini anlamak istiyorsunuz
summary: 'Chrome uzantısı: OpenClaw''ın uzaktan hata ayıklama istemi olmadan oturum açtığınız Chrome''u denetlemesini sağlayın'
title: Chrome Uzantısı
x-i18n:
    generated_at: "2026-07-12T12:47:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb3f7d4bd9d933e0e876d21a1edf07bafbdc18d0196ce636981bd11ad5f2facd
    source_path: tools/chrome-extension.md
    workflow: 16
---

# Chrome uzantısı

OpenClaw Chrome uzantısı, bir aracının ayrı bir yönetilen tarayıcı başlatmadan ve Chrome'un engelleyici "Allow remote debugging?" istemi **olmadan** **oturum açtığınız Chrome sekmelerini** denetlemesini sağlar.

OpenClaw'ı bir telefondan (Telegram, WhatsApp vb.) kullandığınızda bu önemlidir: [`user` profili](/tr/tools/browser#profiles-openclaw-user-chrome), Chrome'un uzaktan hata ayıklama bağlantı noktası üzerinden bağlanır; bu da siz uzaktayken kimsenin tıklayamayacağı bir masaüstü onay iletişim kutusu açar. Uzantı bunun yerine `chrome.debugger` API'sini kullanır; dolayısıyla sayfadaki tek bildirim, Chrome'un kapatılabilir "OpenClaw started debugging this browser" başlığıdır.

Bu, Anthropic'in Claude in Chrome ve OpenAI'ın Codex Chrome uzantılarında kullanılan yapıyla aynıdır.

## Nasıl çalışır?

Üç bölümden oluşur:

- **Tarayıcı denetim hizmeti** (Gateway veya node ana makinesi): `browser` aracının çağırdığı API.
- **Uzantı aktarım hizmeti** (local loopback WebSocket): denetim hizmetinin `127.0.0.1` üzerinde başlattığı küçük bir sunucu. OpenClaw'a bir Chrome DevTools Protocol uç noktası sunar ve uzantıyla iletişim kurar. Her iki taraf da ana makineye özgü yerel bir token ile kimlik doğrular (aşağıya bakın).
- **OpenClaw Chrome uzantısı** (MV3): `chrome.debugger` ile sekmelere bağlanır, CDP trafiğini iletir ve **OpenClaw sekme grubunu** yönetir.

OpenClaw yalnızca **OpenClaw sekme grubundaki** sekmeleri görür ve denetler. Grup, onay sınırıdır: paylaşmak için bir sekmeyi gruba sürükleyin; erişimi anında iptal etmek için gruptan dışarı sürükleyin (veya araç çubuğu düğmesine tıklayın).

## Yükleme ve eşleştirme

1. Paketlenmemiş uzantının yolunu yazdırın:

   ```bash
   openclaw browser extension path
   ```

2. `chrome://extensions` sayfasını açın, **Developer mode** seçeneğini etkinleştirin, **Load unpacked** öğesine tıklayın ve yazdırılan dizini seçin.

3. Eşleştirme dizesini yazdırın:

   ```bash
   openclaw browser extension pair
   ```

4. OpenClaw araç çubuğu simgesine tıklayın ve eşleştirme dizesini açılır pencereye yapıştırın.
   Uzantı aktarım hizmetine bağlandığında rozet **ON** durumuna geçer.

Eşleştirme token'ı, ilk kullanımda oluşturulan ve durum dizininde `credentials/` altında (`0600` moduyla) saklanan **ana makineye özgü yerel bir gizli değerdir**. Tarayıcı çalıştıran her makine (Gateway ana makinesi ve her tarayıcı node ana makinesi) kendi token'ına sahiptir; dolayısıyla kimlik bilgilerinin makineler arasında taşınması gerekmez. Token'ı yenilemek için `browser-extension-relay.secret` dosyasını silin ve yeniden eşleştirin.

## Kullanım

Bir `browser` aracı çağrısında yerleşik `chrome` profilini seçin veya varsayılan yapın:

```bash
openclaw config set browser.defaultProfile chrome
```

```json5
{
  browser: {
    profiles: {
      chrome: { driver: "extension", color: "#FF4500" },
    },
  },
}
```

- Bir sekmeyi paylaşma: ilgili sekmede OpenClaw araç çubuğu düğmesine tıklayın (sekme, OpenClaw sekme grubuna katılır) veya herhangi bir sekmeyi gruba sürükleyin.
- Aracı ayrıca yeni sekmeler açabilir; bunlar otomatik olarak gruba eklenir.
- Erişimi iptal etme: düğmeye tekrar tıklayın, sekmeyi gruptan dışarı sürükleyin veya Chrome'un hata ayıklama başlığını kapatın. Aracı, o sekmeye erişimini anında kaybeder.

## Uzak / makineler arası

Chrome'un Gateway ana makinesinde çalışması gerekmez. Üç topoloji desteklenir:

- **Aynı ana makine** (Gateway ve Chrome tek bir makinede): o makinede `openclaw browser extension pair` komutuyla eşleştirin. Aktarım hizmetine yalnızca local loopback üzerinden erişilebilir.
- **Uzak bir Gateway'e doğrudan bağlantı** (Chrome dizüstü bilgisayarınızda, Gateway bir VPS'de ve **dizüstü bilgisayarda başka hiçbir şey yok**): Gateway üzerinde `openclaw browser extension pair --gateway-url wss://your-gateway.example.com` komutunu çalıştırın. Komut bir `wss://…/browser/extension#<secret>` dizesi yazdırır; uzantıyı dizüstü bilgisayara yükleyip eşleştirin. Uzantı `wss://` üzerinden **doğrudan Gateway'e** bağlanır; dizüstü bilgisayarda OpenClaw kurulumu, Node, CLI veya açık bir gelen bağlantı noktası gerekmez. Bu, yönetilen barındırma yoludur.
- **Bir tarayıcı node ana makinesi üzerinden** (Chrome, hâlihazırda bir OpenClaw node'u çalıştıran makinede): node üzerinde `pair` komutunu çalıştırıp yerel olarak eşleştirin; Gateway, tarayıcı eylemlerini mevcut kimliği doğrulanmış node bağlantısı üzerinden node'a vekâleten iletir.

Eşleştirme gizli değeri ana makine başınadır (doğrudan bağlantıda Gateway'e aittir) ve Gateway'in `/browser/extension` rotası tarafından doğrulanır. Doğrudan bağlantı yolu için Gateway'i TLS (`wss://`) üzerinden sunarak eşleştirme gizli değerinin ve CDP trafiğinin şifrelenmesini sağlayın.
Gizli değer, eşleştirme dizesinin URL parçasında kalır ve WebSocket el sıkışması sırasında bir alt protokol kimlik bilgisi olarak sunulur; böylece normal proxy erişim günlükleri bu değeri istek URL'sinde almaz. Ters proxy'nin standart `Sec-WebSocket-Protocol` üstbilgisini koruduğundan emin olun.

## Tanılama

```bash
openclaw browser status --browser-profile chrome
openclaw browser doctor --browser-profile chrome
```

`doctor`, uzantı açılır penceresinde **Connected** gösterilene kadar **Chrome uzantısı aktarım hizmeti** denetiminin başarısız olduğunu bildirir.

## Güvenlik modeli

- Aktarım hizmeti yalnızca local loopback'e bağlanır; her iki WebSocket tarafının kimliği türetilmiş token ile doğrulanır ve uzantı tarafının kaynağının `chrome-extension://` olduğu denetlenir.
- Doğrudan Gateway eşleştirmesi, aktarım token'ını istek URL'sinde kabul etmez; paketle birlikte gelen uzantı bunun yerine token'ı WebSocket alt protokol listesinde taşır.
- Aracı yalnızca **OpenClaw sekme grubundaki** sekmeleri görebilir ve denetleyebilir. Diğer sekmeleriniz gizli kalır.
- Uzaktan hata ayıklama istemini onayladığınızda oturum açılmış tarayıcınızın tamamını açığa çıkaran `user` (Chrome MCP) profiliyle karşılaştırıldığında uzantı, paylaşılan yüzeyi bir bakışta denetleyebileceğiniz bir sekme grubuyla sınırlar.

Profil modelinin tamamı ile yönetilen `openclaw` ve Chrome MCP `user` profilleri için ayrıca bkz. [Tarayıcı](/tr/tools/browser).
