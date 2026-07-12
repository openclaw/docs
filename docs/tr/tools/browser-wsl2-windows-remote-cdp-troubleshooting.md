---
read_when:
    - Chrome Windows'ta çalışırken OpenClaw Gateway'i WSL2'de çalıştırma
    - WSL2 ve Windows genelinde çakışan tarayıcı/kontrol kullanıcı arayüzü hataları görülmesi
    - Bölünmüş ana makine kurulumlarında ana makine yerelindeki Chrome MCP ile ham uzak CDP arasında karar verme
summary: WSL2 Gateway + Windows Chrome uzak CDP sorunlarını katmanlar hâlinde giderme
title: WSL2 + Windows + uzak Chrome CDP sorun giderme
x-i18n:
    generated_at: "2026-07-12T12:51:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be6d9af2b3efb23be22a5ed6e6645348ddc53e6f997280410fa3e00bb44d8b6d
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

Yaygın bölünmüş ana bilgisayar kurulumunda OpenClaw Gateway WSL2 içinde, Chrome ise
Windows üzerinde çalışır ve tarayıcı denetiminin WSL2/Windows sınırını aşması gerekir. Birkaç
bağımsız sorun aynı anda ortaya çıkabilir (bkz.
[issue #39369](https://github.com/openclaw/openclaw/issues/39369)): CDP
taşıması, Control UI kaynak güvenliği ve belirteç/eşleştirme ayrı ayrı
başarısız olabilir ve benzer görünen hatalar üretebilir. Hangisinin bozuk olduğunu
tahmin etmek yerine aşağıdaki katmanları sırayla inceleyin.

## Önce doğru tarayıcı modunu seçin

### Seçenek 1: WSL2'den Windows'a ham uzak CDP

WSL2'den bir Windows Chrome CDP uç noktasına işaret eden uzak tarayıcı profili
kullanın. Gateway WSL2 içinde kalırken Chrome Windows üzerinde çalışıyorsa ve
tarayıcı denetiminin WSL2/Windows sınırını aşması gerekiyorsa bunu seçin.

### Seçenek 2: ana bilgisayar yerelinde Chrome MCP

`existing-session` sürücüsünü (`user` profili) yalnızca Gateway Chrome ile
aynı ana bilgisayarda çalışıyorsa, yerel olarak oturum açılmış tarayıcı durumunu
kullanmak istiyorsanız, ana bilgisayarlar arası tarayıcı taşımasına ihtiyacınız yoksa
ve `responsebody`, PDF dışa aktarma, indirme yakalama veya toplu eylemlere
ihtiyacınız yoksa kullanın (Chrome MCP profilleri bunları desteklemez).

WSL2 Gateway + Windows Chrome için ham uzak CDP kullanın. Chrome MCP,
ana bilgisayar yerelindedir; WSL2 ile Windows arasında bir köprü değildir.

## Çalışan mimari

- WSL2, Gateway'i `127.0.0.1:18789` üzerinde çalıştırır
- Windows, Control UI'ı normal bir tarayıcıda `http://127.0.0.1:18789/` adresinde açar
- Windows Chrome, `9222` numaralı bağlantı noktasında bir CDP uç noktası sunar
- WSL2 bu Windows CDP uç noktasına erişebilir
- OpenClaw, bir tarayıcı profilini WSL2'den erişilebilen adrese yönlendirir

## Control UI için kritik kural

UI Windows'tan açıldığında, bilinçli olarak yapılandırılmış bir HTTPS kurulumunuz
yoksa Windows localhost'u kullanın:

```text
http://127.0.0.1:18789/
```

Varsayılan olarak bir LAN IP'si kullanmayın. LAN veya tailnet adresinde düz HTTP,
CDP'nin kendisiyle ilgisi olmayan güvenli olmayan kaynak/cihaz kimlik doğrulama
davranışını tetikleyebilir. Bkz.
[Control UI](/tr/web/control-ui).

## Katmanlar hâlinde doğrulayın

Yukarıdan aşağıya ilerleyin; adımları atlamayın. Bir katmanı düzeltmek, daha
aşağıdaki başka bir katmandan kaynaklanan farklı bir hatanın görünmeye devam
etmesine neden olabilir.

### Katman 1: Chrome'un Windows'ta CDP sunduğunu doğrulayın

```powershell
chrome.exe --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\OpenClaw\ChromeCDP"
```

Chrome 136 ve sonraki sürümler, varsayılan Chrome veri dizini için uzaktan hata
ayıklama komut satırı anahtarlarını yok sayar. Yukarıda gösterildiği gibi ayrı,
varsayılan olmayan bir veri dizini kullanın. Chrome'un
[uzaktan hata ayıklama güvenlik değişikliğine](https://developer.chrome.com/blog/remote-debugging-port)
bakın. Bu, oturum açılmış normal Chrome profilini uzaktan denetlenebilir hâle
getirmez.

Windows'tan önce Chrome'un kendisini doğrulayın:

```powershell
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://127.0.0.1:9222/json/list
```

Bu başarısız olursa aşağıdaki Windows dinleyicilerini teşhis edin. Henüz sorun
OpenClaw değildir.

#### portproxy'yi değiştirmeden önce IPv4 ve IPv6'yı teşhis edin

Chromium, uzaktan hata ayıklamayı önce `127.0.0.1` adresine bağlamayı dener ve
yalnızca IPv4 bağlama işlemi başarısız olursa `[::1]` adresine geri döner.
`127.0.0.1:9222` üzerinde dinleyen kalıcı bir `v4tov4` kuralı, Chrome başlamadan
önce bu uç noktayı işgal edebilir. Chrome daha sonra `[::1]:9222` adresine geri
dönerken eski kural IPv4 trafiğini kendi dinleyicisine geri yönlendirir ve boş
yanıt döndürür.

Chrome sürümünden çıkarım yapmak yerine Windows'tan gerçek dinleyicileri ve
proxy kurallarını denetleyin:

```powershell
netstat -ano | findstr :9222
netsh interface portproxy show all
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://[::1]:9222/json/version
```

`netstat` çıktısındaki her PID için `tasklist /fi "PID eq <PID>"` kullanın.

- `chrome.exe`, `127.0.0.1` üzerinde yanıt veriyorsa aynı zamanda
  `127.0.0.1:9222` üzerinde dinleyen tüm portproxy kurallarını kaldırın. Yalnızca
  WSL2'den erişilebilen Windows bağdaştırıcı adresini `127.0.0.1` adresine yönlendirin.
- `chrome.exe` yalnızca `[::1]` üzerinde yanıt veriyorsa WSL2'den erişilebilen
  dinleyiciyi kullanılmayan bir IPv4 adresine yönlendirmek yerine `v4tov6` ile
  `::1` adresine yönlendirin:

  ```powershell
  netsh interface portproxy add v4tov6 listenaddress=WINDOWS_HOST_OR_IP listenport=9222 connectaddress=::1 connectport=9222
  ```

Dinleyiciyi WSL2'nin ihtiyaç duyduğu bağdaştırıcı adresine bağlayın. CDP
bağlantı noktasını `0.0.0.0`, bir LAN adresi veya bir tailnet adresi üzerinde
açığa çıkarmayın: CDP, tarayıcı oturumunun denetimini sağlar.

### Katman 2: WSL2'nin bu Windows uç noktasına erişebildiğini doğrulayın

WSL2'den, `cdpUrl` içinde kullanmayı planladığınız tam adresi sınayın:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Başarılı sonuç:

- `/json/version`, Browser / Protocol-Version meta verilerini içeren JSON döndürür
- `/json/list` JSON döndürür (açık sayfa yoksa boş bir dizi kabul edilebilir)

Bu başarısız olursa Windows henüz bağlantı noktasını WSL2'ye açmıyordur,
adres WSL2 tarafı için yanlıştır veya güvenlik duvarı/bağlantı noktası
yönlendirme/proxy yapılandırması eksiktir. OpenClaw yapılandırmasına dokunmadan
önce bunu düzeltin.

### Katman 3: doğru tarayıcı profilini yapılandırın

OpenClaw'u WSL2'den erişilebilen adrese yönlendirin:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "remote",
    profiles: {
      remote: {
        cdpUrl: "http://WINDOWS_HOST_OR_IP:9222",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

Notlar:

- yalnızca Windows'ta çalışan adresi değil, WSL2'den erişilebilen adresi kullanın
- haricen yönetilen tarayıcılar için `attachOnly: true` değerini koruyun
- `cdpUrl`, `http://`, `https://`, `ws://` veya `wss://` olabilir
- OpenClaw'un `/json/version` uç noktasını keşfetmesini istediğinizde HTTP(S) kullanın
- yalnızca tarayıcı sağlayıcısı size doğrudan bir DevTools yuva URL'si verdiğinde
  WS(S) kullanın
- OpenClaw'un başarılı olmasını beklemeden önce aynı URL'yi `curl` ile sınayın

### Katman 4: Control UI katmanını ayrı olarak doğrulayın

Windows'tan `http://127.0.0.1:18789/` adresini açın, ardından şunları doğrulayın:

- sayfa kaynağı, `gateway.controlUi.allowedOrigins` tarafından beklenen değerle eşleşiyor
- belirteç kimlik doğrulaması veya eşleştirme doğru yapılandırılmış
- bir Control UI kimlik doğrulama sorununu tarayıcı sorunuymuş gibi ayıklamıyorsunuz

Yararlı sayfa: [Control UI](/tr/web/control-ui).

### Katman 5: uçtan uca tarayıcı denetimini doğrulayın

WSL2'den:

```bash
openclaw browser --browser-profile remote open https://example.com
openclaw browser --browser-profile remote tabs
```

Başarılı sonuç:

- sekme Windows Chrome'da açılır
- `browser tabs` hedefi döndürür
- sonraki eylemler (`snapshot`, `screenshot`, `navigate`) aynı profilden çalışır

## Yanıltıcı olabilen yaygın hatalar

| İleti                                                                                   | Anlamı                                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `control-ui-insecure-auth`                                                              | CDP taşıma sorunu değil, UI kaynağı/güvenli bağlam sorunu                                                                                                                                               |
| `token_missing`                                                                         | kimlik doğrulama yapılandırması sorunu                                                                                                                                                                  |
| `pairing required`                                                                      | cihaz onayı sorunu                                                                                                                                                                                      |
| `Remote CDP for profile "remote" is not reachable`                                      | WSL2, yapılandırılmış `cdpUrl` adresine erişemiyor                                                                                                                                                       |
| portproxy üzerinden boş CDP yanıtı / `other side closed`                                | Windows dinleyici uyuşmazlığı veya kendi üzerine dönen döngü; her iki geri döngü ailesini ve `netsh interface portproxy show all` çıktısını inceleyin                                                    |
| `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable` | HTTP uç noktası yanıt verdi ancak DevTools WebSocket açılamadı                                                                                                                                          |
| uzak oturumdan sonra eski görünüm alanı / koyu mod / yerel ayar / çevrimdışı geçersiz kılmaları | Gateway'i veya harici tarayıcıyı yeniden başlatmadan oturumu kapatmak ve önbelleğe alınmış Playwright/CDP bağlantısını serbest bırakmak için `openclaw browser --browser-profile remote stop` komutunu çalıştırın |
| `remoteCdpTimeoutMs` çevresinde zaman aşımı (varsayılan 1500 ms)                         | genellikle hâlâ CDP erişilebilirliği veya yavaş/erişilemeyen uzak uç nokta                                                                                                                              |
| `Playwright page enumeration timed out after 3000ms`                                    | uzak CDP bağlandı ancak kalıcı sekme okuması takıldı; son tarih `remoteCdpTimeoutMs` ile `remoteCdpHandshakeTimeoutMs` değerlerinden büyük olanıdır                                                       |
| `No Chrome tabs found for profile="user"`                                               | ana bilgisayar yerelinde kullanılabilir sekme bulunmadığı hâlde yerel Chrome MCP profili seçildi                                                                                                        |

## Hızlı triyaj denetim listesi

1. Windows: `/json/version` üzerinde `127.0.0.1` veya `[::1]` adreslerinden
   hangisi yanıt veriyor ve bu dinleyici `chrome.exe` işlemine mi ait?
2. WSL2: `curl http://WINDOWS_HOST_OR_IP:9222/json/version` çalışıyor mu?
3. OpenClaw yapılandırması: `browser.profiles.<name>.cdpUrl`, WSL2'den
   erişilebilen bu tam adresi mi kullanıyor?
4. Control UI: bir LAN IP'si yerine `http://127.0.0.1:18789/` adresini mi açıyorsunuz?
5. Ham uzak CDP yerine WSL2 ile Windows arasında `existing-session` kullanmaya
   mı çalışıyorsunuz?

Önce Windows Chrome uç noktasını yerel olarak, ardından aynı uç noktayı
WSL2'den doğrulayın ve ancak bundan sonra OpenClaw yapılandırmasında veya
Control UI kimlik doğrulamasında hata ayıklayın.

## İlgili

- [Tarayıcı](/tr/tools/browser)
- [Tarayıcıda oturum açma](/tr/tools/browser-login)
- [Tarayıcı Linux sorun giderme](/tr/tools/browser-linux-troubleshooting)
