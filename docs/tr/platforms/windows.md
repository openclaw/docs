---
read_when:
    - Windows'ta OpenClaw Kurulumu
    - Windows Hub, yerel Windows ve WSL2 arasında seçim yapma
    - Windows eşlikçi uygulamasını veya Windows node modunu ayarlama
summary: 'Windows desteği: Windows Hub, yerel CLI ve Gateway, WSL2 gateway kurulumu, node modu ve sorun giderme'
title: Windows
x-i18n:
    generated_at: "2026-06-28T00:49:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7c7bde33f27bce6c1136ccf688547ee82750d317a997c4a45b354c52ae1b690
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw, yerel bir **Windows Hub** yardımcı uygulamasıyla birlikte Windows CLI desteği sunar.
Kurulum, tepsi durumu, sohbet, Komut Merkezi tanılamaları ve Windows düğüm
yetenekleri içeren bir masaüstü uygulaması istediğinizde Windows Hub'ı kullanın.
CLI/Gateway'i doğrudan istediğinizde PowerShell yükleyicisini kullanın. En
Linux uyumlu Gateway çalışma zamanını istediğinizde WSL2 kullanın.

## Önerilen: Windows Hub

Windows Hub, Windows 10 20H2+ ve Windows 11 için yerel WinUI yardımcı
uygulamasıdır. Yönetici ayrıcalıkları olmadan kurulur ve OpenClaw sürümlerinde
imzalı x64 ve ARM64 yükleyicilerle yayımlanır.

En son kararlı yükleyiciyi [OpenClaw sürümleri sayfasından](https://github.com/openclaw/openclaw/releases) indirin:

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-arm64.exe)
- [Sağlama toplamları](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-SHA256SUMS.txt)

Yukarıdaki indirme bağlantılarından biri 404 döndürürse [sürümler sayfasını](https://github.com/openclaw/openclaw/releases) ziyaret edin ve en son sürümde `OpenClawCompanion-Setup-*` varlıklarını arayın.

Kurulumdan sonra Başlat menüsünden veya sistem tepsisinden **OpenClaw Companion**'ı
başlatın. Yükleyici ayrıca Gateway Kurulumu, Sohbet, Ayarlar, Güncellemeleri
Denetle ve kaldırma için kısayollar ekler.

### Windows Hub neler içerir

- sistem tepsisi durumu ve oturum açılışında başlatma
- yerel, uygulamaya ait WSL Gateway için ilk çalıştırma kurulumu
- yerel, uzak ve SSH tünelli Gateway'ler için bağlantı ayarları
- yerel sohbet penceresi ve tarayıcı Control UI erişimi
- oturumlar, kullanım, kanallar, düğümler, eşleştirme ve onarım komutları için
  Komut Merkezi tanılamaları
- aracı denetimli tuval, ekran, kamera, bildirimler, cihaz durumu, metinden
  sese, konuşmadan metne ve denetimli `system.run` için Windows düğüm modu
- Claude Desktop, Claude Code ve Cursor gibi MCP istemcileri için yerel MCP
  sunucu modu

### İlk başlatma

İlk başlatmada, kullanılabilir kaydedilmiş Gateway yoksa Windows Hub kurulumu
açar. En hızlı yol, uygulamaya ait bir `OpenClawGateway` WSL dağıtımı hazırlayan,
Gateway'i bunun içine kuran ve uygulamayı eşleştiren **Yerel olarak kur** seçeneğidir.
Bu, mevcut Ubuntu dağıtımınızı dışa aktarmaz veya değiştirmez.

Zaten bir Gateway'iniz varsa **Gelişmiş kurulum**'u seçin veya Bağlantılar
sekmesini açın. Şunlara bağlanabilirsiniz:

- bu bilgisayardaki yerel Gateway
- bu bilgisayardaki WSL Gateway
- URL ve token veya kurulum koduyla uzak Gateway
- SSH tüneli üzerinden erişilen Gateway

Kurulum tamamlandığında tepsi simgesi yeşile döner. Bağlantıyı, eşleştirmeyi,
düğüm durumunu ve kanal sağlığını doğrulamak için tepsiden **Komut Merkezi**'ni
açın.

## Windows düğüm modu

Windows Hub, birinci sınıf OpenClaw düğümü olarak kaydolabilir. Aracı daha sonra
Gateway üzerinden bildirilen Windows yerel yeteneklerini kullanabilir.

Yaygın komutlar şunları içerir:

- `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`,
  `canvas.snapshot`
- `screen.snapshot` ve açıkça etkinleştirmeyle `screen.record`
- `camera.list` ve açıkça etkinleştirmeyle `camera.snap`, `camera.clip`
- `system.notify`, `system.run`, `system.run.prepare`, `system.which`
- `location.get`, `device.info`, `device.status`
- `stt.transcribe`, `tts.speak`

Düğüm modu Gateway eşleştirmesi gerektirir. Uygulama bir eşleştirme isteği
gösterirse bunu Gateway ana makinesinden onaylayın:

```powershell
openclaw devices list
openclaw devices approve <request-id>
openclaw nodes status
```

Gateway yalnızca düğümün bildirdiği ve sunucu politikasının izin verdiği
komutları iletir. `screen.record`, `camera.snap` ve `camera.clip` gibi gizlilik
açısından hassas komutlar açık `gateway.nodes.allowCommands` etkinleştirmesi
gerektirir.

## Yerel MCP modu

Windows Hub, aynı Windows yerel yetenek kayıt defterini loopback üzerinde yerel
MCP sunucusu olarak sunabilir. Bu, çalışan bir OpenClaw Gateway olmadan yerel
MCP istemcilerinin Windows yeteneklerini kullanmasını istediğinizde yararlıdır.

Bunu Windows Hub Ayarları'ndaki geliştirici/gelişmiş bölümünden etkinleştirin.
Sunucu etkinleştirildikten sonra uygulama loopback uç noktasını ve bearer
token'ı gösterir.

Mod matrisi:

| Düğüm modu | MCP sunucusu | Davranış                         |
| ---------- | ------------ | -------------------------------- |
| kapalı     | kapalı       | Yalnızca operatör masaüstü uygulaması |
| açık       | kapalı       | Gateway bağlantılı Windows düğümü |
| kapalı     | açık         | Yalnızca yerel MCP sunucusu      |
| açık       | açık         | Gateway düğümü ve yerel MCP sunucusu |

## Yerel Windows CLI ve Gateway

Terminal öncelikli kullanım için OpenClaw'ı PowerShell'den yükleyin:

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

Doğrulayın:

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

Yerel Windows CLI ve Gateway akışları desteklenir ve gelişmeye devam eder.
Yönetilen başlangıç, kullanılabildiğinde Windows Scheduled Tasks kullanır. Görev,
okunabilir `gateway.cmd` betiğini OpenClaw durum dizininde tutar, ancak arka
plan Gateway'in görünür bir konsol penceresi açmaması için bunu oluşturulmuş bir
`gateway.vbs` WScript sarmalayıcısı üzerinden başlatır. Görev oluşturma
reddedilirse OpenClaw, kullanıcı başına Startup klasörü oturum açma öğesine
geri döner.

Gateway hizmetini kurmak için:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Yönetilen Gateway hizmeti olmadan yalnızca CLI kullanımı istiyorsanız:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## WSL2 Gateway

WSL2, Windows'ta en Linux uyumlu Gateway çalışma zamanı olmaya devam eder.
Windows Hub sizin için uygulamaya ait bir WSL Gateway kurabilir veya kendi
dağıtımınızın içine elle kurabilirsiniz.

Elle kurulum:

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

WSL içinde systemd'yi etkinleştirin:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

PowerShell'den WSL'yi yeniden başlatın:

```powershell
wsl --shutdown
```

Ardından Linux hızlı başlangıcıyla OpenClaw'ı WSL içine kurun:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## Windows oturum açmadan önce Gateway otomatik başlatma

Başsız WSL kurulumları için, Windows'ta kimse oturum açmasa bile tam önyükleme
zincirinin çalıştığından emin olun.

WSL içinde:

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

PowerShell'de Yönetici olarak:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

`Ubuntu` yerine şu komuttan aldığınız dağıtım adını yazın:

```powershell
wsl --list --verbose
```

> **Not:** Eski tariflere göre iki değişiklik:
>
> - **`/bin/true` yerine `dbus-launch true`** — WSL ≥ 2.6.1.0 üzerinde bir regresyon ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416)), linger etkin olsa bile son istemci çıktıktan 15-20 saniye sonra dağıtımın boşta sonlandırılmasına neden olur. `dbus-launch true`, geçici çözüm olarak bir child-of-init sürecini canlı tutar ([topluluk tartışması, microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)).
> - **`/ru SYSTEM` yerine `/ru "$env:USERNAME"`** — Kullanıcı başına WSL dağıtımları (varsayılan kurulum) SYSTEM hesabı tarafından görülemez; görev çalışıyor gibi görünür ama dağıtım hiçbir zaman başlatılmaz. Kendi hesabınızla çalıştırmak bunu önler. Görev oluşturulurken Windows parolanızı ister.

Yeniden başlatmadan sonra WSL'den doğrulayın:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## WSL hizmetlerini LAN üzerinden açığa çıkarma

WSL'nin kendi sanal ağı vardır. Başka bir makinenin WSL içindeki bir hizmete
erişmesi gerekiyorsa bir Windows bağlantı noktasını geçerli WSL IP'sine iletin.
WSL IP'si yeniden başlatmalardan sonra değişebilir, bu nedenle gerektiğinde
iletim kuralını yenileyin.

PowerShell'de Yönetici olarak örnek:

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort

New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Notlar:

- Başka bir makineden SSH, Windows ana makine IP'sini hedefler; örneğin
  `ssh user@windows-host -p 2222`.
- Uzak düğümler `127.0.0.1` değil, erişilebilir bir Gateway URL'sini göstermelidir.
- LAN erişimi için `listenaddress=0.0.0.0` kullanın. Yalnızca yerel erişim için
  `127.0.0.1` kullanın.

## Sorun giderme

### Tepsi simgesi görünmüyor

Görev Yöneticisi'nde `OpenClaw.Tray.WinUI.exe` olup olmadığını denetleyin.
Çalışıyorsa gizli tepsi simgeleri alanını açıp sabitleyin. Çalışmıyorsa Başlat
menüsünden **OpenClaw Companion**'ı başlatın.

### Yerel kurulum başarısız oluyor

Kurulum günlüğünü Windows Hub'dan açın veya şunu inceleyin:

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

Yaygın nedenler WSL'nin devre dışı olması, sanallaştırmanın engellenmesi,
uygulamaya ait eski WSL durumu veya Gateway paketini yüklerken yaşanan ağ
hatasıdır.

### Uygulama eşleştirme gerektiğini söylüyor

Operatör veya düğüm isteğini Gateway'den onaylayın:

```powershell
openclaw devices list
openclaw devices approve <request-id>
```

Cihazın zaten token'ı varsa onaydan sonra Bağlantılar sekmesinden yeniden
bağlanın.

### Web sohbeti uzak Gateway'e erişemiyor

Uzak web sohbeti HTTPS veya localhost gerektirir. Kendinden imzalı sertifikalar
için sertifikaya Windows'ta güvenin veya localhost URL'sine SSH tüneli kullanın.

### `screen.snapshot`, kamera veya ses komutları başarısız oluyor

Kamera, mikrofon, ekran yakalama ve bildirimler için Windows izinlerini doğrulayın.
Paketli kurulumlar korumalı yetenekleri bildirir, ancak Windows bir komut bunları
ilk kez kullandığında yine de istem gösterebilir.

### Git veya GitHub bağlantısı başarısız oluyor

Bazı ağlar GitHub'a HTTPS erişimini engeller veya yavaşlatır. `git clone` veya
`gh auth login` başarısız olursa başka bir ağ, VPN veya HTTP/HTTPS proxy deneyin.

Geçerli oturumda token tabanlı `gh` kimlik doğrulaması için:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

Token'ları asla commit etmeyin veya issue'lara ya da pull request'lere yapıştırmayın.

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Node.js kurulumu](/tr/install/node)
- [Düğümler](/tr/nodes)
- [Control UI](/tr/web/control-ui)
- [Gateway yapılandırması](/tr/gateway/configuration)
