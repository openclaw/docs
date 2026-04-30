---
read_when:
    - Chrome Windows'ta çalışırken OpenClaw Gateway'i WSL2'de çalıştırma
    - WSL2 ve Windows'ta örtüşen tarayıcı/control-ui hataları görülüyor
    - Bölünmüş ana makine kurulumlarında ana makineye yerel Chrome MCP ile ham uzak CDP arasında karar verme
summary: WSL2 Gateway + Windows Chrome uzaktan CDP sorunlarını katmanlar halinde giderme
title: WSL2 + Windows + uzak Chrome CDP sorun giderme
x-i18n:
    generated_at: "2026-04-30T09:47:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7532c672f7e829b851d175d93354fc586baecea4af5f2555f57908780cedfd02
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

Yaygın bölünmüş ana makine kurulumunda OpenClaw Gateway WSL2 içinde çalışır, Chrome Windows üzerinde çalışır ve tarayıcı denetimi WSL2 ile Windows sınırını geçmelidir. [issue #39369](https://github.com/openclaw/openclaw/issues/39369) kaynaklı katmanlı hata örüntüsü, birkaç bağımsız sorunun aynı anda ortaya çıkabileceği anlamına gelir; bu da önce yanlış katmanın bozuk görünmesine neden olur.

## Önce doğru tarayıcı modunu seçin

İki geçerli örüntünüz vardır:

### Seçenek 1: WSL2'den Windows'a ham uzak CDP

WSL2'den bir Windows Chrome CDP uç noktasına işaret eden uzak bir tarayıcı profili kullanın.

Şu durumlarda bunu seçin:

- Gateway WSL2 içinde kalıyorsa
- Chrome Windows üzerinde çalışıyorsa
- tarayıcı denetiminin WSL2/Windows sınırını geçmesi gerekiyorsa

### Seçenek 2: Ana makine yerelinde Chrome MCP

`existing-session` / `user` yalnızca Gateway'in kendisi Chrome ile aynı ana makinede çalıştığında kullanın.

Şu durumlarda bunu seçin:

- OpenClaw ve Chrome aynı makinedeyse
- yerel oturum açılmış tarayıcı durumunu istiyorsanız
- ana makineler arası tarayıcı aktarımına ihtiyacınız yoksa
- `responsebody`, PDF
  dışa aktarma, indirme yakalama veya toplu eylemler gibi gelişmiş yönetilen/yalnızca ham CDP rotalarına ihtiyacınız yoksa

WSL2 Gateway + Windows Chrome için ham uzak CDP'yi tercih edin. Chrome MCP ana makine yerelindedir, WSL2'den Windows'a bir köprü değildir.

## Çalışan mimari

Referans yapı:

- WSL2, Gateway'i `127.0.0.1:18789` üzerinde çalıştırır
- Windows, Denetim UI'ını normal bir tarayıcıda `http://127.0.0.1:18789/` adresinde açar
- Windows Chrome, `9222` bağlantı noktasında bir CDP uç noktası sunar
- WSL2 bu Windows CDP uç noktasına erişebilir
- OpenClaw, bir tarayıcı profilini WSL2'den erişilebilen adrese yönlendirir

## Bu kurulum neden kafa karıştırıcıdır

Birkaç hata çakışabilir:

- WSL2, Windows CDP uç noktasına erişemeyebilir
- Denetim UI güvenli olmayan bir kökenden açılmış olabilir
- `gateway.controlUi.allowedOrigins` sayfa kökeniyle eşleşmeyebilir
- token veya eşleme eksik olabilir
- tarayıcı profili yanlış adrese işaret ediyor olabilir

Bu nedenle bir katmanı düzeltmek, farklı bir hatanın hâlâ görünür kalmasına yol açabilir.

## Denetim UI için kritik kural

UI Windows'tan açıldığında, bilinçli bir HTTPS kurulumunuz yoksa Windows localhost kullanın.

Kullanın:

`http://127.0.0.1:18789/`

Denetim UI için varsayılan olarak bir LAN IP'si kullanmayın. LAN veya tailnet adresinde düz HTTP, CDP'nin kendisiyle ilgisiz güvenli olmayan köken/cihaz kimlik doğrulaması davranışını tetikleyebilir. Bkz. [Denetim UI](/tr/web/control-ui).

## Katmanlar halinde doğrulayın

Yukarıdan aşağıya çalışın. İleri atlamayın.

### Katman 1: Chrome'un Windows üzerinde CDP sunduğunu doğrulayın

Windows'ta Chrome'u uzak hata ayıklama etkin olacak şekilde başlatın:

```powershell
chrome.exe --remote-debugging-port=9222
```

Windows'tan önce Chrome'un kendisini doğrulayın:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

Bu Windows'ta başarısız olursa, sorun henüz OpenClaw değildir.

### Katman 2: WSL2'nin bu Windows uç noktasına erişebildiğini doğrulayın

WSL2'den, `cdpUrl` içinde kullanmayı planladığınız tam adresi test edin:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

İyi sonuç:

- `/json/version`, Browser / Protocol-Version meta verileri içeren JSON döndürür
- `/json/list`, JSON döndürür (açık sayfa yoksa boş dizi de uygundur)

Bu başarısız olursa:

- Windows bağlantı noktasını henüz WSL2'ye açmıyordur
- adres WSL2 tarafı için yanlıştır
- güvenlik duvarı / bağlantı noktası yönlendirme / yerel proxy hâlâ eksiktir

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

- yalnızca Windows'ta çalışan adresi değil, WSL2'den erişilebilen adresi kullanın
- harici olarak yönetilen tarayıcılar için `attachOnly: true` değerini koruyun
- `cdpUrl`, `http://`, `https://`, `ws://` veya `wss://` olabilir
- OpenClaw'ın `/json/version` keşfetmesini istediğinizde HTTP(S) kullanın
- WS(S)'yi yalnızca tarayıcı sağlayıcısı size doğrudan DevTools soket URL'si verdiğinde kullanın
- OpenClaw'ın başarılı olmasını beklemeden önce aynı URL'yi `curl` ile test edin

### Katman 4: Denetim UI katmanını ayrı doğrulayın

UI'ı Windows'tan açın:

`http://127.0.0.1:18789/`

Ardından şunları doğrulayın:

- sayfa kökeni `gateway.controlUi.allowedOrigins` değerinin beklediğiyle eşleşiyor
- token kimlik doğrulaması veya eşleme doğru yapılandırılmış
- bir Denetim UI kimlik doğrulaması sorununu tarayıcı sorunuymuş gibi ayıklamıyorsunuz

Yararlı sayfa:

- [Denetim UI](/tr/web/control-ui)

### Katman 5: Uçtan uca tarayıcı denetimini doğrulayın

WSL2'den:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

İyi sonuç:

- sekme Windows Chrome'da açılır
- `openclaw browser tabs` hedefi döndürür
- sonraki eylemler (`snapshot`, `screenshot`, `navigate`) aynı profilden çalışır

## Yaygın yanıltıcı hatalar

Her iletiyi katmana özgü bir ipucu olarak ele alın:

- `control-ui-insecure-auth`
  - UI kökeni / güvenli bağlam sorunu, CDP aktarım sorunu değil
- `token_missing`
  - kimlik doğrulama yapılandırması sorunu
- `pairing required`
  - cihaz onayı sorunu
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 yapılandırılmış `cdpUrl` adresine erişemiyor
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - HTTP uç noktası yanıt verdi, ancak DevTools WebSocket hâlâ açılamadı
- uzak bir oturumdan sonra eski görünüm alanı / koyu mod / yerel ayar / çevrimdışı geçersiz kılmaları
  - `openclaw browser stop --browser-profile remote` çalıştırın
  - bu, Gateway'i veya harici tarayıcıyı yeniden başlatmadan etkin denetim oturumunu kapatır ve Playwright/CDP emülasyon durumunu serbest bırakır
- `gateway timeout after 1500ms`
  - çoğu zaman hâlâ CDP erişilebilirliği veya yavaş/erişilemeyen uzak uç nokta sorunudur
- `No Chrome tabs found for profile="user"`
  - ana makine yerelinde kullanılabilir sekme yokken yerel Chrome MCP profili seçilmiştir

## Hızlı triyaj kontrol listesi

1. Windows: `curl http://127.0.0.1:9222/json/version` çalışıyor mu?
2. WSL2: `curl http://WINDOWS_HOST_OR_IP:9222/json/version` çalışıyor mu?
3. OpenClaw yapılandırması: `browser.profiles.<name>.cdpUrl` tam olarak bu WSL2'den erişilebilen adresi mi kullanıyor?
4. Denetim UI: LAN IP'si yerine `http://127.0.0.1:18789/` adresini mi açıyorsunuz?
5. Ham uzak CDP yerine WSL2 ile Windows arasında `existing-session` kullanmaya mı çalışıyorsunuz?

## Pratik çıkarım

Kurulum genellikle uygulanabilirdir. Zor olan kısım, tarayıcı aktarımı, Denetim UI köken güvenliği ve token/eşlemenin her birinin bağımsız olarak başarısız olabilmesi ve kullanıcı tarafında benzer görünebilmesidir.

Şüphe duyduğunuzda:

- önce Windows Chrome uç noktasını yerelde doğrulayın
- ardından aynı uç noktayı WSL2'den doğrulayın
- ancak bundan sonra OpenClaw yapılandırmasını veya Denetim UI kimlik doğrulamasını ayıklayın

## İlgili

- [Tarayıcı](/tr/tools/browser)
- [Tarayıcı oturum açma](/tr/tools/browser-login)
- [Tarayıcı Linux sorun giderme](/tr/tools/browser-linux-troubleshooting)
