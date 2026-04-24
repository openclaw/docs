---
read_when:
    - Chrome Windows'ta çalışırken OpenClaw Gateway'i WSL2 içinde çalıştırma
    - WSL2 ve Windows arasında çakışan tarayıcı/control-ui hataları görme
    - Bölünmüş ana makine kurulumlarında ana makine yerel Chrome MCP ile ham uzak CDP arasında karar verme
summary: WSL2 Gateway + Windows Chrome uzak CDP sorunlarını katmanlar halinde giderin
title: WSL2 + Windows + uzak Chrome CDP sorun giderme
x-i18n:
    generated_at: "2026-04-24T09:33:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30c8b94332e74704f85cbce5891b677b264fd155bc180c44044ab600e84018fd
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 15
---

Bu kılavuz, şu yaygın bölünmüş ana makine kurulumunu kapsar:

- OpenClaw Gateway WSL2 içinde çalışır
- Chrome Windows üzerinde çalışır
- tarayıcı denetimi WSL2/Windows sınırını geçmek zorundadır

Ayrıca [issue #39369](https://github.com/openclaw/openclaw/issues/39369) içindeki katmanlı hata düzenini de kapsar: aynı anda birden fazla bağımsız sorun ortaya çıkabilir ve bu da önce yanlış katmanın bozuk görünmesine yol açar.

## Önce doğru tarayıcı modunu seçin

İki geçerli kalıp vardır:

### Seçenek 1: WSL2'den Windows'a ham uzak CDP

WSL2'den Windows Chrome CDP uç noktasına yönelen bir uzak tarayıcı profili kullanın.

Bunu şu durumlarda seçin:

- Gateway WSL2 içinde kalıyorsa
- Chrome Windows üzerinde çalışıyorsa
- tarayıcı denetiminin WSL2/Windows sınırını geçmesi gerekiyorsa

### Seçenek 2: Ana makine yerel Chrome MCP

`existing-session` / `user` seçeneğini yalnızca Gateway'in Chrome ile aynı ana makinede çalıştığı durumda kullanın.

Bunu şu durumlarda seçin:

- OpenClaw ve Chrome aynı makinede çalışıyorsa
- yerel oturum açılmış tarayıcı durumunu istiyorsanız
- ana makineler arası tarayıcı taşımasına ihtiyacınız yoksa
- `responsebody`, PDF
  dışa aktarma, indirme yakalama veya toplu işlemler gibi gelişmiş managed/raw-CDP-only rotalarına ihtiyacınız yoksa

WSL2 Gateway + Windows Chrome için ham uzak CDP'yi tercih edin. Chrome MCP, WSL2'den Windows'a bir köprü değil, ana makine yereldir.

## Çalışan mimari

Başvuru şekli:

- WSL2, Gateway'i `127.0.0.1:18789` üzerinde çalıştırır
- Windows, Control UI'yı normal bir tarayıcıda `http://127.0.0.1:18789/` adresinde açar
- Windows Chrome, 9222 portunda bir CDP uç noktası sunar
- WSL2 bu Windows CDP uç noktasına erişebilir
- OpenClaw, bir tarayıcı profilini WSL2'den erişilebilir adrese yönlendirir

## Bu kurulum neden kafa karıştırıcıdır

Birden fazla hata çakışabilir:

- WSL2, Windows CDP uç noktasına erişemiyor olabilir
- Control UI güvenli olmayan bir origin'den açılmış olabilir
- `gateway.controlUi.allowedOrigins`, sayfa origin'iyle eşleşmiyor olabilir
- token veya eşleme eksik olabilir
- tarayıcı profili yanlış adrese yöneliyor olabilir

Bu nedenle bir katmanı düzeltmek, yine de farklı bir hatayı görünür bırakabilir.

## Control UI için kritik kural

UI Windows'tan açıldığında, bilinçli bir HTTPS kurulumunuz yoksa Windows localhost kullanın.

Şunu kullanın:

`http://127.0.0.1:18789/`

Control UI için varsayılan olarak bir LAN IP'si kullanmayın. Bir LAN veya tailnet adresi üzerindeki düz HTTP, CDP'nin kendisiyle ilgisiz olan güvenli olmayan origin/cihaz kimlik doğrulama davranışını tetikleyebilir. Bkz. [Control UI](/tr/web/control-ui).

## Katmanlar halinde doğrulayın

Yukarıdan aşağıya çalışın. İleri atlamayın.

### Katman 1: Chrome'un Windows üzerinde CDP sunduğunu doğrulayın

Windows üzerinde Chrome'u uzaktan hata ayıklama etkin olarak başlatın:

```powershell
chrome.exe --remote-debugging-port=9222
```

Windows üzerinden önce Chrome'un kendisini doğrulayın:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

Bu Windows'ta başarısız olursa sorun henüz OpenClaw değildir.

### Katman 2: WSL2'nin bu Windows uç noktasına erişebildiğini doğrulayın

WSL2 içinden, `cdpUrl` içinde kullanmayı planladığınız tam adresi test edin:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

İyi sonuç:

- `/json/version`, Browser / Protocol-Version meta verileriyle JSON döndürür
- `/json/list`, JSON döndürür (hiç sayfa açık değilse boş dizi kabul edilir)

Bu başarısız olursa:

- Windows henüz portu WSL2'ye açmıyordur
- adres WSL2 tarafı için yanlıştır
- güvenlik duvarı / port yönlendirme / yerel proxy hâlâ eksiktir

OpenClaw yapılandırmasına dokunmadan önce bunu düzeltin.

### Katman 3: Doğru tarayıcı profilini yapılandırın

Ham uzak CDP için OpenClaw'ı, WSL2'den erişilebilen adrese yönlendirin:

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

- yalnızca Windows üzerinde çalışan değil, WSL2'den erişilebilen adresi kullanın
- haricen yönetilen tarayıcılar için `attachOnly: true` kullanın
- `cdpUrl`, `http://`, `https://`, `ws://` veya `wss://` olabilir
- OpenClaw'ın `/json/version` keşfetmesini istediğinizde HTTP(S) kullanın
- yalnızca tarayıcı sağlayıcısı size doğrudan bir DevTools soket URL'si verdiğinde WS(S) kullanın
- OpenClaw'ın başarılı olmasını beklemeden önce aynı URL'yi `curl` ile test edin

### Katman 4: Control UI katmanını ayrı doğrulayın

UI'yı Windows üzerinden açın:

`http://127.0.0.1:18789/`

Sonra şunları doğrulayın:

- sayfa origin'i, `gateway.controlUi.allowedOrigins` değerinin beklediğiyle eşleşiyor mu
- token kimlik doğrulaması veya eşleme doğru yapılandırılmış mı
- bir tarayıcı sorunuymuş gibi Control UI kimlik doğrulama sorununu hata ayıklamıyor musunuz

Yardımcı sayfa:

- [Control UI](/tr/web/control-ui)

### Katman 5: Uçtan uca tarayıcı denetimini doğrulayın

WSL2 içinden:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

İyi sonuç:

- sekme Windows Chrome içinde açılır
- `openclaw browser tabs`, hedefi döndürür
- sonraki işlemler (`snapshot`, `screenshot`, `navigate`) aynı profilden çalışır

## Yaygın olarak yanıltıcı hatalar

Her mesajı katmana özgü bir ipucu olarak değerlendirin:

- `control-ui-insecure-auth`
  - UI origin / güvenli bağlam sorunu, CDP taşıma sorunu değil
- `token_missing`
  - kimlik doğrulama yapılandırma sorunu
- `pairing required`
  - cihaz onay sorunu
- `Remote CDP for profile "remote" is not reachable`
  - WSL2, yapılandırılmış `cdpUrl` değerine erişemiyor
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - HTTP uç noktası yanıt verdi, ancak DevTools WebSocket yine de açılamadı
- uzak bir oturumdan sonra bayat viewport / dark-mode / locale / offline geçersiz kılmaları
  - `openclaw browser stop --browser-profile remote` çalıştırın
  - bu, Gateway'i veya harici tarayıcıyı yeniden başlatmadan etkin denetim oturumunu kapatır ve Playwright/CDP emülasyon durumunu serbest bırakır
- `gateway timeout after 1500ms`
  - çoğu zaman yine CDP erişilebilirliği veya yavaş/erişilemeyen uzak bir uç nokta sorunudur
- `No Chrome tabs found for profile="user"`
  - ana makine yerel sekmelerin mevcut olmadığı yerde yerel Chrome MCP profili seçilmiş

## Hızlı triyaj kontrol listesi

1. Windows: `curl http://127.0.0.1:9222/json/version` çalışıyor mu?
2. WSL2: `curl http://WINDOWS_HOST_OR_IP:9222/json/version` çalışıyor mu?
3. OpenClaw yapılandırması: `browser.profiles.<name>.cdpUrl`, tam olarak WSL2'den erişilebilen bu adresi kullanıyor mu?
4. Control UI: `http://127.0.0.1:18789/` adresini bir LAN IP'si yerine açıyor musunuz?
5. Ham uzak CDP yerine WSL2 ve Windows arasında `existing-session` kullanmaya mı çalışıyorsunuz?

## Pratik çıkarım

Bu kurulum genellikle uygulanabilirdir. Zor kısmı, tarayıcı taşımasının, Control UI origin güvenliğinin ve token/eşlemenin her birinin kullanıcı tarafında benzer görünürken bağımsız olarak başarısız olabilmesidir.

Şüphe duyduğunuzda:

- önce Windows Chrome uç noktasını yerelde doğrulayın
- ikinci olarak aynı uç noktayı WSL2'den doğrulayın
- ancak ondan sonra OpenClaw yapılandırmasında veya Control UI kimlik doğrulamasında hata ayıklayın

## İlgili

- [Tarayıcı](/tr/tools/browser)
- [Tarayıcı girişi](/tr/tools/browser-login)
- [Tarayıcı Linux sorun giderme](/tr/tools/browser-linux-troubleshooting)
