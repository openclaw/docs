---
read_when:
    - OpenClaw'ı Windows'a kurma
    - Yerel Windows ile WSL2 arasında seçim yapma
    - Windows yardımcı uygulamasının durumunu öğrenme
summary: 'Windows desteği: yerel ve WSL2 kurulum yolları, daemon ve mevcut uyarılar'
title: Windows
x-i18n:
    generated_at: "2026-04-05T14:01:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d9819206bdd65cf03519c1bc73ed0c7889b0ab842215ea94343262300adfd14
    source_path: platforms/windows.md
    workflow: 15
---

# Windows

OpenClaw hem **yerel Windows** hem de **WSL2** destekler. WSL2 daha
kararlı yoldur ve tam deneyim için önerilir — CLI, Gateway ve
araçlar Linux içinde tam uyumlulukla çalışır. Yerel Windows, temel CLI ve Gateway kullanımı için çalışır; aşağıda belirtilen bazı uyarılar vardır.

Yerel Windows yardımcı uygulamaları planlanmaktadır.

## WSL2 (önerilen)

- [Başlangıç](/start/getting-started) (WSL içinde kullanın)
- [Kurulum ve güncellemeler](/tr/install/updating)
- Resmi WSL2 kılavuzu (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Yerel Windows durumu

Yerel Windows CLI akışları gelişiyor, ancak WSL2 hâlâ önerilen yoldur.

Bugün yerel Windows'ta iyi çalışanlar:

- `install.ps1` aracılığıyla web sitesi yükleyicisi
- `openclaw --version`, `openclaw doctor` ve `openclaw plugins list --json` gibi yerel CLI kullanımı
- aşağıdaki gibi gömülü local-agent/provider smoke çalıştırmaları:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Mevcut uyarılar:

- `openclaw onboard --non-interactive`, `--skip-health` geçmediğiniz sürece hâlâ erişilebilir bir yerel gateway bekler
- `openclaw onboard --non-interactive --install-daemon` ve `openclaw gateway install` önce Windows Zamanlanmış Görevler'i dener
- Zamanlanmış Görev oluşturma reddedilirse, OpenClaw kullanıcı başına Startup klasörü oturum açma öğesine geri döner ve gateway'i hemen başlatır
- `schtasks` kilitlenirse veya yanıt vermeyi durdurursa, OpenClaw artık sonsuza kadar takılmak yerine bu yolu hızla iptal eder ve geri dönüş yolunu kullanır
- Zamanlanmış Görevler, daha iyi supervisor durumu sağladıkları için mevcut olduğunda hâlâ tercih edilir

Yalnızca yerel CLI istiyorsanız ve gateway hizmeti kurmak istemiyorsanız, şunlardan birini kullanın:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Yerel Windows'ta yönetilen başlangıç istiyorsanız:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Zamanlanmış Görev oluşturma engellenirse, geri dönüş hizmet modu yine de mevcut kullanıcının Startup klasörü üzerinden oturum açtıktan sonra otomatik başlar.

## Gateway

- [Gateway çalışma kılavuzu](/tr/gateway)
- [Yapılandırma](/tr/gateway/configuration)

## Gateway hizmeti kurulumu (CLI)

WSL2 içinde:

```
openclaw onboard --install-daemon
```

Veya:

```
openclaw gateway install
```

Veya:

```
openclaw configure
```

İstendiğinde **Gateway service** seçin.

Onarma/taşıma:

```
openclaw doctor
```

## Windows oturum açılmadan önce Gateway otomatik başlatma

Başsız kurulumlar için, tam önyükleme zincirinin Windows'ta
kimse oturum açmasa bile çalıştığından emin olun.

### 1) Oturum açmadan kullanıcı hizmetlerini çalışır tutun

WSL içinde:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) OpenClaw gateway kullanıcı hizmetini kurun

WSL içinde:

```bash
openclaw gateway install
```

### 3) Windows önyüklemesinde WSL'yi otomatik başlatın

PowerShell'de Yönetici olarak:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

`Ubuntu` değerini şu komuttan aldığınız dağıtım adıyla değiştirin:

```powershell
wsl --list --verbose
```

### Başlangıç zincirini doğrulayın

Yeniden başlatmadan sonra (Windows oturumu açılmadan önce), WSL içinden kontrol edin:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Gelişmiş: WSL hizmetlerini LAN üzerinden açma (portproxy)

WSL kendi sanal ağına sahiptir. Başka bir makinenin **WSL içinde**
çalışan bir hizmete (SSH, yerel bir TTS sunucusu veya Gateway) erişmesi gerekiyorsa,
bir Windows portunu mevcut WSL IP'sine yönlendirmeniz gerekir. WSL IP'si yeniden başlatmalardan sonra değişir,
bu nedenle yönlendirme kuralını yenilemeniz gerekebilir.

Örnek (PowerShell'de **Yönetici olarak**):

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

Portun Windows Güvenlik Duvarı'ndan geçmesine izin verin (bir kerelik):

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

WSL yeniden başladıktan sonra portproxy'yi yenileyin:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

Notlar:

- Başka bir makineden SSH, **Windows ana makine IP'sini** hedefler (örnek: `ssh user@windows-host -p 2222`).
- Uzak düğümler **erişilebilir** bir Gateway URL'sini hedeflemelidir (`127.0.0.1` değil); doğrulamak için
  `openclaw status --all` kullanın.
- LAN erişimi için `listenaddress=0.0.0.0` kullanın; `127.0.0.1` bunu yalnızca yerel tutar.
- Bunu otomatik yapmak istiyorsanız, oturum açıldığında yenileme
  adımını çalıştıracak bir Zamanlanmış Görev kaydedin.

## Adım adım WSL2 kurulumu

### 1) WSL2 + Ubuntu kurun

PowerShell'i açın (Yönetici):

```powershell
wsl --install
# Veya bir dağıtımı açıkça seçin:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Windows isterse yeniden başlatın.

### 2) systemd'yi etkinleştirin (gateway kurulumu için gereklidir)

WSL terminalinizde:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Ardından PowerShell'den:

```powershell
wsl --shutdown
```

Ubuntu'yu yeniden açın, sonra doğrulayın:

```bash
systemctl --user status
```

### 3) OpenClaw'ı kurun (WSL içinde)

WSL içinde Linux Başlangıç akışını izleyin:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build # ilk çalıştırmada UI bağımlılıklarını otomatik kurar
pnpm build
openclaw onboard
```

Tam kılavuz: [Başlangıç](/start/getting-started)

## Windows yardımcı uygulaması

Henüz bir Windows yardımcı uygulamamız yok. Bunu gerçekleştirmek için katkıda
bulunmak isterseniz katkılar memnuniyetle karşılanır.
