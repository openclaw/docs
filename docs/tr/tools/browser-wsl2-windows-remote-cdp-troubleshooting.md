---
read_when:
    - OpenClaw Gateway'i WSL2 içinde çalıştırırken Chrome Windows'ta çalışıyorsa
    - WSL2 ve Windows genelinde çakışan tarayıcı/control-ui hataları görüyorsanız
    - Bölünmüş ana makine kurulumlarında host-local Chrome MCP ile ham uzak CDP arasında karar veriyorsanız
summary: WSL2 Gateway + Windows Chrome uzak CDP sorunlarını katmanlar hâlinde giderme
title: WSL2 + Windows + uzak Chrome CDP sorun giderme
x-i18n:
    generated_at: "2026-04-05T14:10:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99df2988d3c6cf36a8c2124d5b724228d095a60b2d2b552f3810709b5086127d
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 15
---

# WSL2 + Windows + uzak Chrome CDP sorun giderme

Bu kılavuz, şu yaygın bölünmüş ana makine kurulumunu kapsar:

- OpenClaw Gateway WSL2 içinde çalışır
- Chrome Windows'ta çalışır
- tarayıcı denetiminin WSL2/Windows sınırını aşması gerekir

Ayrıca [issue #39369](https://github.com/openclaw/openclaw/issues/39369) içindeki katmanlı arıza örüntüsünü de kapsar: aynı anda birden fazla bağımsız sorun ortaya çıkabilir ve bu da önce yanlış katmanın bozuk görünmesine neden olur.

## Önce doğru tarayıcı modunu seçin

İki geçerli kalıp vardır:

### Seçenek 1: WSL2'den Windows'a ham uzak CDP

WSL2'den Windows Chrome CDP uç noktasına işaret eden bir uzak tarayıcı profili kullanın.

Bunu şu durumlarda seçin:

- Gateway WSL2 içinde kalıyorsa
- Chrome Windows'ta çalışıyorsa
- tarayıcı denetiminin WSL2/Windows sınırını aşması gerekiyorsa

### Seçenek 2: Host-local Chrome MCP

`existing-session` / `user` seçeneğini yalnızca Gateway'in kendisi Chrome ile aynı ana makinede çalıştığında kullanın.

Bunu şu durumlarda seçin:

- OpenClaw ve Chrome aynı makinede çalışıyorsa
- yerel olarak oturum açılmış tarayıcı durumunu istiyorsanız
- ana makineler arası tarayıcı taşımasına ihtiyacınız yoksa
- `responsebody`, PDF
  dışa aktarma, indirme yakalama veya toplu işlemler gibi gelişmiş yönetilen/yalnızca ham CDP rotalarına ihtiyacınız yoksa

WSL2 Gateway + Windows Chrome için ham uzak CDP'yi tercih edin. Chrome MCP host-local'dır; WSL2'den Windows'a bir köprü değildir.

## Çalışan mimari

Başvuru şekli:

- WSL2, Gateway'i `127.0.0.1:18789` üzerinde çalıştırır
- Windows, Control UI'ı normal bir tarayıcıda `http://127.0.0.1:18789/` adresinde açar
- Windows Chrome, `9222` portunda bir CDP uç noktası sunar
- WSL2 bu Windows CDP uç noktasına erişebilir
- OpenClaw, WSL2'den erişilebilen adrese bir tarayıcı profili işaret eder

## Bu kurulum neden kafa karıştırıcıdır

Birden fazla hata çakışabilir:

- WSL2, Windows CDP uç noktasına erişemeyebilir
- Control UI güvenli olmayan bir origin'den açılmış olabilir
- `gateway.controlUi.allowedOrigins`, sayfa origin'iyle eşleşmiyor olabilir
- token veya eşleme eksik olabilir
- tarayıcı profili yanlış adresi gösteriyor olabilir

Bu nedenle, bir katmanı düzeltmek yine de farklı bir hatanın görünür kalmasına yol açabilir.

## Control UI için kritik kural

UI Windows'tan açıldığında, bilinçli bir HTTPS kurulumunuz yoksa Windows localhost kullanın.

Şunu kullanın:

`http://127.0.0.1:18789/`

Control UI için varsayılan olarak bir LAN IP'si kullanmayın. Bir LAN veya tailnet adresinde düz HTTP, CDP'nin kendisiyle ilgisiz güvenli olmayan origin/cihaz kimlik doğrulaması davranışını tetikleyebilir. Bkz. [Control UI](/web/control-ui).

## Katmanlar hâlinde doğrulayın

Yukarıdan aşağı çalışın. İleri atlamayın.

### Katman 1: Chrome'un Windows'ta CDP sunduğunu doğrulayın

Windows'ta Chrome'u uzak hata ayıklama etkin olacak şekilde başlatın:

```powershell
chrome.exe --remote-debugging-port=9222
```

Windows'tan önce Chrome'un kendisini doğrulayın:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

Bu işlem Windows'ta başarısız oluyorsa sorun henüz OpenClaw değildir.

### Katman 2: WSL2'nin bu Windows uç noktasına erişebildiğini doğrulayın

WSL2'den, `cdpUrl` içinde kullanmayı planladığınız tam adresi test edin:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

İyi sonuç:

- `/json/version`, Browser / Protocol-Version meta verileriyle JSON döndürür
- `/json/list`, JSON döndürür (hiç sayfa açık değilse boş dizi sorun değildir)

Bu başarısız olursa:

- Windows henüz portu WSL2'ye açmıyordur
- adres WSL2 tarafı için yanlıştır
- güvenlik duvarı / port yönlendirme / yerel proxy işlemi hâlâ eksiktir

OpenClaw yapılandırmasına dokunmadan önce bunu düzeltin.

### Katman 3: Doğru tarayıcı profilini yapılandırın

Ham uzak CDP için OpenClaw'ı WSL2'den erişilebilen adrese yönlendirin:

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

- yalnızca Windows'ta çalışan değil, WSL2'den erişilebilen adresi kullanın
- harici olarak yönetilen tarayıcılar için `attachOnly: true` değerini koruyun
- `cdpUrl`, `http://`, `https://`, `ws://` veya `wss://` olabilir
- OpenClaw'ın `/json/version` keşfetmesini istediğinizde HTTP(S) kullanın
- yalnızca tarayıcı sağlayıcısı size doğrudan bir DevTools soket URL'si veriyorsa WS(S) kullanın
- OpenClaw'ın başarılı olmasını beklemeden önce aynı URL'yi `curl` ile test edin

### Katman 4: Control UI katmanını ayrı olarak doğrulayın

UI'ı Windows'tan açın:

`http://127.0.0.1:18789/`

Ardından şunları doğrulayın:

- sayfa origin'i, `gateway.controlUi.allowedOrigins` değerinin beklediği şeyle eşleşiyor mu
- token kimlik doğrulaması veya eşleme doğru yapılandırılmış mı
- Control UI kimlik doğrulama sorununu tarayıcı sorunu sanarak hata ayıklamıyor musunuz

Yararlı sayfa:

- [Control UI](/web/control-ui)

### Katman 5: Uçtan uca tarayıcı denetimini doğrulayın

WSL2'den:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

İyi sonuç:

- sekme Windows Chrome'da açılır
- `openclaw browser tabs` hedefi döndürür
- sonraki işlemler (`snapshot`, `screenshot`, `navigate`) aynı profilden çalışır

## Yaygın yanıltıcı hatalar

Her iletiyi katmana özgü bir ipucu olarak değerlendirin:

- `control-ui-insecure-auth`
  - CDP taşıma sorunu değil, UI origin'i / güvenli bağlam sorunu
- `token_missing`
  - kimlik doğrulama yapılandırması sorunu
- `pairing required`
  - cihaz onayı sorunu
- `Remote CDP for profile "remote" is not reachable`
  - WSL2, yapılandırılmış `cdpUrl` değerine erişemiyor
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - HTTP uç noktası yanıt verdi, ancak DevTools WebSocket yine de açılamadı
- uzak oturumdan sonra bayat viewport / dark-mode / locale / offline geçersiz kılmaları
  - `openclaw browser stop --browser-profile remote` çalıştırın
  - bu, gateway'i veya harici tarayıcıyı yeniden başlatmadan etkin denetim oturumunu kapatır ve Playwright/CDP öykünme durumunu serbest bırakır
- `gateway timeout after 1500ms`
  - çoğu zaman yine CDP erişilebilirliği veya yavaş/erişilemeyen bir uzak uç nokta sorunudur
- `No Chrome tabs found for profile="user"`
  - host-local sekmelerin mevcut olmadığı yerde yerel Chrome MCP profili seçildi

## Hızlı ön değerlendirme kontrol listesi

1. Windows: `curl http://127.0.0.1:9222/json/version` çalışıyor mu?
2. WSL2: `curl http://WINDOWS_HOST_OR_IP:9222/json/version` çalışıyor mu?
3. OpenClaw yapılandırması: `browser.profiles.<name>.cdpUrl` tam olarak WSL2'den erişilebilen bu adresi mi kullanıyor?
4. Control UI: LAN IP'si yerine `http://127.0.0.1:18789/` mı açıyorsunuz?
5. WSL2 ve Windows arasında ham uzak CDP yerine `existing-session` kullanmaya mı çalışıyorsunuz?

## Pratik sonuç

Bu kurulum genellikle uygulanabilir durumdadır. Zor kısım, tarayıcı taşımasının, Control UI origin güvenliğinin ve token/eşlemenin kullanıcı tarafında benzer görünürken bağımsız olarak başarısız olabilmesidir.

Emin değilseniz:

- önce Windows Chrome uç noktasını yerelde doğrulayın
- sonra aynı uç noktayı WSL2'den doğrulayın
- ancak bundan sonra OpenClaw yapılandırmasını veya Control UI kimlik doğrulamasını hata ayıklayın
