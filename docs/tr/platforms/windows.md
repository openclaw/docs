---
read_when:
    - OpenClaw'ı Windows'a Yükleme
    - Windows Hub, yerel Windows ve WSL2 arasında seçim yapma
    - Windows yardımcı uygulamasını veya Windows Node modunu ayarlama
summary: 'Windows desteği: Windows Hub, yerel CLI ve Gateway, WSL2 Gateway kurulumu, Node modu ve sorun giderme'
title: Windows
x-i18n:
    generated_at: "2026-07-16T17:19:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f1a756d3af3898f211c27c34e16bbcc08f71e214ca1e0d5680c15a091ae1c2ca
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw, yerel bir **Windows Hub** yardımcı uygulamasının yanı sıra Windows CLI desteğiyle birlikte sunulur.
Kurulum, sistem tepsisi durumu, sohbet, Komuta Merkezi tanılamaları ve Windows
Node yeteneklerini içeren bir masaüstü uygulaması için Windows Hub'ı kullanın. CLI/Gateway'i
doğrudan kullanmak için PowerShell yükleyicisini kullanın. Linux ile en
uyumlu Gateway çalışma zamanı için WSL2'yi kullanın.

## Önerilen: Windows Hub

Windows Hub, Windows 10 20H2+ ve Windows 11 için yerel WinUI yardımcı
uygulamasıdır. Yönetici ayrıcalıkları olmadan yüklenir ve kendi sürüm
sayfasında imzalı x64 ve ARM64 yükleyicileri sunulur.

Windows Hub, OpenClaw CLI ve Gateway'den bağımsız olarak yayımlanır. En son
kararlı Hub yükleyicisini
[Windows Hub sürümleri sayfasından](https://github.com/openclaw/openclaw-windows-node/releases/latest)
veya doğrudan `releases/latest/download` aracılığıyla indirin:

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-arm64.exe)

Yukarıdaki bir bağlantı 404 hatası verirse [Windows Hub sürümleri sayfasını](https://github.com/openclaw/openclaw-windows-node/releases)
ziyaret edin ve en yeni kararlı Windows Hub sürümünü açın. Normal kararlı OpenClaw
sürümleri de sabitlenmiş ve sürüm için doğrulanmış bir Windows Hub derlemesini
yansıtır; bu yansı, daha yeni bağımsız bir Hub sürümünün gerisinde kalabilir.

Yüklemeden sonra Başlat menüsünden veya sistem tepsisinden **OpenClaw Companion**
uygulamasını başlatın. Yükleyici ayrıca Gateway Setup, Chat, Settings,
Check for Updates ve kaldırma için kısayollar ekler.

### Windows Hub'ın içerdikleri

- Sistem tepsisi durumu ve oturum açıldığında başlatma.
- Uygulamanın sahip olduğu yerel bir WSL Gateway için ilk çalıştırma kurulumu.
- Yerel, uzak ve SSH tünelli Gateway'ler için bağlantı ayarları.
- Yerel sohbet penceresi ve tarayıcıdaki Control UI'a erişim.
- Oturumlar, kullanım, kanallar, Node'lar, eşleştirme ve
  onarım komutları için Komuta Merkezi tanılamaları.
- Aracı tarafından denetlenen tuval, ekran, kamera, bildirimler,
  cihaz durumu, konuşma ve denetimli `system.run` için Windows Node modu.
- Claude Desktop, Claude Code ve Cursor gibi MCP istemcileri için
  yerel MCP sunucusu modu.

### İlk başlatma

İlk başlatmada, kullanılabilir kayıtlı bir Gateway yoksa Windows Hub kurulumu
açar. En hızlı yol, uygulamanın sahip olduğu bir `OpenClawGateway` WSL dağıtımını
hazırlayan, Gateway'i bunun içine yükleyen ve uygulamayı eşleştiren **Set up locally**
seçeneğidir. Bu işlem mevcut Ubuntu dağıtımınızı dışa aktarmaz veya değiştirmez.

Zaten bir Gateway'iniz varsa **Advanced setup** seçeneğini belirleyin veya
Connections sekmesini açın. Şunlara bağlanabilirsiniz:

- bu bilgisayardaki yerel bir Gateway
- bu bilgisayardaki bir WSL Gateway
- URL ve belirteç ya da kurulum koduyla uzak bir Gateway
- SSH tüneli üzerinden erişilen bir Gateway

Kurulum tamamlandığında tepsi simgesi yeşile döner. Bağlantıyı, eşleştirmeyi,
Node durumunu ve kanal sağlığını doğrulamak için tepsiden **Command Center**
öğesini açın.

## Windows Node modu

Windows Hub, aracının bildirilen Windows'a özgü yetenekleri Gateway üzerinden
kullanabilmesi için bir OpenClaw Node'u olarak kaydolabilir. Node komutlarının
çalıştırılmadan önce Node tarafından bildirilmesi ve Gateway politikası
tarafından izin verilmesi gerekir; tam izin verme/reddetme modeli için
[Node'lar](/tr/nodes#command-policy) bölümüne bakın.

Yaygın komutlar:

| Aile | Komutlar                                                                             |
| ------ | ------------------------------------------------------------------------------------ |
| Tuval | `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot` |
| Ekran | `screen.snapshot`; `screen.record` açıkça kabul edilmeyi gerektirir                          |
| Kamera | `camera.list`; `camera.snap`, `camera.clip` açıkça kabul edilmeyi gerektirir                  |
| Sistem | `system.notify`, `system.run`, `system.run.prepare`, `system.which`                  |
| Cihaz | `location.get`, `device.info`, `device.status`                                       |
| Konuşma   | `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`, `talk.speak`  |

Node modu Gateway eşleştirmesi gerektirir. Uygulama bir eşleştirme isteği
gösterirse bunu Gateway ana makinesinden onaylayın:

```powershell
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Gateway yalnızca Node'un bildirdiği ve sunucu politikasının izin verdiği
komutları iletir. `screen.record`, `camera.snap` ve
`camera.clip` gibi gizliliğe duyarlı komutlar açıkça
`gateway.nodes.allowCommands` kabulü gerektirir.

## Yerel MCP modu

Windows Hub, aynı Windows'a özgü yetenek kayıt defterini geri döngü üzerinde
yerel bir MCP sunucusu olarak kullanıma sunabilir; böylece yerel MCP istemcileri,
çalışan bir OpenClaw Gateway olmadan Windows yeteneklerini denetleyebilir.

Bunu Windows Hub Settings içinde geliştirici/gelişmiş bölümünden etkinleştirin.
Sunucu etkinleştirildiğinde uygulama geri döngü uç noktasını ve taşıyıcı belirtecini
gösterir.

Mod matrisi:

| Node modu | MCP sunucusu | Davranış                           |
| --------- | ---------- | ---------------------------------- |
| kapalı       | kapalı        | Yalnızca operatör tarafından kullanılan masaüstü uygulaması          |
| açık        | kapalı        | Gateway'e bağlı Windows Node'u     |
| kapalı       | açık         | Yalnızca yerel MCP sunucusu              |
| açık        | açık         | Gateway Node'u ve yerel MCP sunucusu |

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

Yönetilen başlatma, kullanılabilir olduğunda Windows Zamanlanmış Görevleri'ni
kullanır. Görev, okunabilir `gateway.cmd` betiğini OpenClaw durum
dizininde tutar ancak arka plandaki Gateway'in görünür bir konsol penceresi
açmaması için bunu oluşturulan bir `gateway.vbs` WScript sarmalayıcısı
üzerinden başlatır. Görev oluşturmaya izin verilmezse OpenClaw, kullanıcı
başına Başlangıç klasörü oturum açma öğesine geri döner.

Gateway hizmetini yükleyin:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Yönetilen Gateway hizmeti olmadan yalnızca CLI kullanımı için:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## WSL2 Gateway

WSL2, Windows'ta Linux ile en uyumlu Gateway çalışma zamanı olmaya devam eder.
Windows Hub sizin için uygulamanın sahip olduğu bir WSL Gateway kurabilir veya
kendi dağıtımınızın içine elle yükleyebilirsiniz.

Elle kurulum:

```powershell
wsl --install
# Veya açıkça bir dağıtım seçin:
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

WSL'yi PowerShell'den yeniden başlatın:

```powershell
wsl --shutdown
```

Ardından Linux hızlı başlangıcını kullanarak OpenClaw'ı WSL içine yükleyin:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## Windows oturum açma işleminden önce Gateway'i otomatik başlatma

Ekransız WSL kurulumlarında, Windows'ta kimse oturum açmasa bile tüm önyükleme
zincirinin çalıştığından emin olun.

WSL içinde:

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

PowerShell'i Yönetici olarak açın:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

`Ubuntu` değerini şuradan aldığınız dağıtım adıyla değiştirin:

```powershell
wsl --list --verbose
```

<Note>
Eski tariflere göre iki değişiklik vardır:

- **`/bin/true` yerine `dbus-launch true`**: WSL >= 2.6.1.0 sürümünde
  bir gerileme ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416)),
  kalıcı oturum etkin olsa bile son istemci çıktıktan 15-20 saniye sonra
  dağıtımı boşta olduğu için sonlandırır. `dbus-launch true`, geçici bir çözüm
  olarak init'in alt sürecini çalışır durumda tutar (topluluk tartışması,
  [microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)).
- **`/ru SYSTEM` yerine `/ru "$env:USERNAME"`**: kullanıcı başına WSL
  dağıtımları (varsayılan kurulum) SYSTEM hesabı tarafından görülemez; bu nedenle
  görev çalışıyor gibi görünür ancak dağıtım hiçbir zaman başlatılmaz. Kendi
  hesabınızla çalıştırmak bunu önler; görev oluşturulurken Windows parolanızı ister.

</Note>

Yeniden başlatmanın ardından WSL'den doğrulayın:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## WSL hizmetlerini LAN üzerinden kullanıma sunma

WSL'nin kendi sanal ağı vardır. Başka bir makinenin WSL içindeki bir hizmete
erişmesi gerekiyorsa bir Windows bağlantı noktasını mevcut WSL IP'sine yönlendirin.
WSL IP'si yeniden başlatmalardan sonra değişebilir; bu nedenle gerektiğinde
yönlendirme kuralını yenileyin.

PowerShell'de Yönetici olarak örnek:

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP bulunamadı." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort

New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Notlar:

- Başka bir makineden SSH, Windows ana makine IP'sini hedefler; ör. `ssh user@windows-host -p 2222`.
- Uzak Node'lar `127.0.0.1` adresini değil, erişilebilir bir Gateway URL'sini göstermelidir.
- LAN erişimi için `listenaddress=0.0.0.0`, yalnızca yerel erişim için `127.0.0.1` kullanın.

## Sorun giderme

### Tepsi simgesi görünmüyor

Görev Yöneticisi'nde `OpenClaw.Tray.WinUI.exe` öğesini kontrol edin. Çalışıyorsa
gizli tepsi simgeleri alanını açıp sabitleyin. Çalışmıyorsa Başlat menüsünden
**OpenClaw Companion** uygulamasını başlatın.

### Yerel kurulum başarısız oluyor

Kurulum günlüğünü Windows Hub'dan açın veya şunu inceleyin:

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

Yaygın nedenler: devre dışı WSL, engellenmiş sanallaştırma, uygulamanın sahip
olduğu eskimiş WSL durumu veya Gateway paketi yüklenirken oluşan bir ağ hatası.

### Uygulama eşleştirmenin gerekli olduğunu söylüyor

Operatör veya Node isteğini Gateway'den onaylayın:

```powershell
openclaw devices list
openclaw devices approve <requestId>
```

Cihazın zaten bir belirteci varsa onaydan sonra Connections sekmesinden
yeniden bağlanın.

### Web sohbeti uzak bir Gateway'e erişemiyor

Uzak web sohbeti HTTPS veya localhost gerektirir. Kendinden imzalı sertifikalar
için sertifikaya Windows'ta güvenin veya bir localhost URL'sine SSH tüneli
kullanın.

### `screen.snapshot`, kamera veya ses komutları başarısız oluyor

Kamera, mikrofon, ekran yakalama ve bildirimler için Windows izinlerini
doğrulayın. Paketlenmiş yüklemeler korunan yetenekleri bildirir ancak Windows
bir komut bunları ilk kez kullandığında yine de istem gösterebilir.

### Git veya GitHub bağlantısı başarısız oluyor

Bazı ağlar GitHub'a HTTPS erişimini engeller veya kısıtlar.
`git clone` ya da `gh auth login` başarısız olursa başka bir ağ,
VPN veya HTTP/HTTPS proxy deneyin.

Geçerli oturumda belirteç tabanlı `gh` kimlik doğrulaması için:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

Belirteçleri hiçbir zaman işlemeyin veya sorunlara ya da çekme isteklerine yapıştırmayın.

## İlgili

- [Yüklemeye genel bakış](/tr/install)
- [Node.js kurulumu](/tr/install/node)
- [Node'lar](/tr/nodes)
- [Control UI](/tr/web/control-ui)
- [Gateway yapılandırması](/tr/gateway/configuration)
