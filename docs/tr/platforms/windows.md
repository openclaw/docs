---
read_when:
    - OpenClaw'ı Windows'a yükleme
    - Yerel Windows ile WSL2 arasında seçim yapma
    - Windows yardımcı uygulamasının durumu aranıyor
summary: 'Windows desteği: yerel ve WSL2 kurulum yolları, arka plan hizmeti ve mevcut dikkat edilmesi gerekenler'
title: Windows
x-i18n:
    generated_at: "2026-05-05T06:18:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: adf885747e3a897cb4ee57f6494805468d38c4595c0ab7582b063153a1134d18
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw hem **yerel Windows** hem de **WSL2** destekler. WSL2 daha
kararlı yoldur ve tam deneyim için önerilir; CLI, Gateway ve
araçlar Linux içinde tam uyumlulukla çalışır. Yerel Windows, aşağıda belirtilen
bazı sınırlamalarla temel CLI ve Gateway kullanımı için çalışır.

Yerel Windows eşlikçi uygulamaları planlanmaktadır.

## WSL2 (önerilir)

- [Başlarken](/tr/start/getting-started) (WSL içinde kullanın)
- [Kurulum ve güncellemeler](/tr/install/updating)
- Resmi WSL2 kılavuzu (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Yerel Windows durumu

Yerel Windows CLI akışları gelişiyor, ancak WSL2 hâlâ önerilen yoldur.

Bugün yerel Windows üzerinde iyi çalışanlar:

- `install.ps1` üzerinden web sitesi yükleyicisi
- `openclaw --version`, `openclaw doctor` ve `openclaw plugins list --json` gibi yerel CLI kullanımı
- aşağıdaki gibi gömülü local-agent/provider duman testi:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Mevcut sınırlamalar:

- `openclaw onboard --non-interactive`, `--skip-health` geçmediğiniz sürece hâlâ erişilebilir bir yerel gateway bekler
- `openclaw onboard --non-interactive --install-daemon` ve `openclaw gateway install` önce Windows Zamanlanmış Görevleri dener
- Zamanlanmış Görev oluşturma reddedilirse, OpenClaw kullanıcı başına Başlangıç klasöründe bir oturum açma öğesine geri döner ve gateway’i hemen başlatır
- `schtasks` kendisi takılır veya yanıt vermeyi bırakırsa, OpenClaw artık bu yolu hızlıca iptal eder ve sonsuza kadar takılı kalmak yerine geri dönüş yolunu kullanır
- Zamanlanmış Görevler, daha iyi gözetici durumu sağladıkları için mevcut olduklarında hâlâ tercih edilir

Gateway hizmeti kurulumu olmadan yalnızca yerel CLI istiyorsanız şunlardan birini kullanın:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Yerel Windows üzerinde yönetilen başlangıç istiyorsanız:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Zamanlanmış Görev oluşturma engellenirse, geri dönüş hizmet modu yine de mevcut kullanıcının Başlangıç klasörü aracılığıyla oturum açıldıktan sonra otomatik başlar.

## Gateway

- [Gateway çalıştırma kılavuzu](/tr/gateway)
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

İstendiğinde **Gateway hizmeti** seçeneğini belirleyin.

Onar/taşı:

```
openclaw doctor
```

## Windows oturum açmadan önce Gateway otomatik başlatma

Ekransız kurulumlarda, Windows’ta kimse oturum açmasa bile tam önyükleme
zincirinin çalıştığından emin olun.

### 1) Kullanıcı hizmetlerini oturum açmadan çalışır tutun

WSL içinde:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) OpenClaw gateway kullanıcı hizmetini kurun

WSL içinde:

```bash
openclaw gateway install
```

### 3) Windows önyüklemesinde WSL’yi otomatik başlatın

Yönetici olarak PowerShell’de:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

`Ubuntu` değerini şuradan aldığınız dağıtım adınızla değiştirin:

```powershell
wsl --list --verbose
```

### Başlangıç zincirini doğrulayın

Yeniden başlatmadan sonra (Windows oturum açmadan önce), WSL’den kontrol edin:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Gelişmiş: WSL hizmetlerini LAN üzerinden açığa çıkarma (portproxy)

WSL’nin kendi sanal ağı vardır. Başka bir makinenin **WSL içinde** çalışan bir hizmete
(SSH, yerel bir TTS sunucusu veya Gateway) erişmesi gerekiyorsa, bir Windows portunu
mevcut WSL IP’sine yönlendirmeniz gerekir. WSL IP’si yeniden başlatmalardan sonra
değişir, bu yüzden yönlendirme kuralını yenilemeniz gerekebilir.

Örnek (PowerShell’de **Yönetici olarak**):

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

Porta Windows Güvenlik Duvarı üzerinden izin verin (bir kez):

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

WSL yeniden başladıktan sonra portproxy’yi yenileyin:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

Notlar:

- Başka bir makineden SSH, **Windows ana makine IP’sini** hedefler (örnek: `ssh user@windows-host -p 2222`).
- Uzak düğümler **erişilebilir** bir Gateway URL’sini işaret etmelidir (`127.0.0.1` değil); doğrulamak için
  `openclaw status --all` kullanın.
- LAN erişimi için `listenaddress=0.0.0.0` kullanın; `127.0.0.1` yalnızca yerel tutar.
- Bunun otomatik olmasını istiyorsanız, yenileme adımını oturum açıldığında çalıştıracak
  bir Zamanlanmış Görev kaydedin.

## Adım adım WSL2 kurulumu

### 1) WSL2 + Ubuntu kurun

PowerShell’i açın (Yönetici):

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Windows isterse yeniden başlatın.

### 2) systemd’yi etkinleştirin (gateway kurulumu için gereklidir)

WSL terminalinizde:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Ardından PowerShell’den:

```powershell
wsl --shutdown
```

Ubuntu’yu yeniden açın, ardından doğrulayın:

```bash
systemctl --user status
```

### 3) OpenClaw’u kurun (WSL içinde)

WSL içinde normal bir ilk kurulum için Linux Başlarken akışını izleyin:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

İlk katılım yerine kaynaktan geliştirme yapıyorsanız,
[Kurulum](/tr/start/setup) bölümündeki kaynak geliştirme döngüsünü kullanın:

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

Tam kılavuz: [Başlarken](/tr/start/getting-started)

## Windows eşlikçi uygulaması

Henüz bir Windows eşlikçi uygulamamız yok. Bunun gerçekleşmesine yardımcı olmak
isterseniz katkılar memnuniyetle karşılanır.

## Git ve GitHub bağlantısı (katkıda bulunanlar)

Bazı ağlar GitHub’a HTTPS erişimini engeller veya kısıtlar. `git clone` zaman aşımı
veya bağlantı sıfırlamalarıyla başarısız olursa, başka bir ağ, VPN veya kuruluşunuzun
sağladığı bir HTTP/HTTPS proxy deneyin.

`gh auth login`, tarayıcı cihaz akışı sırasında başarısız olursa (örneğin
`github.com:443` erişiminde zaman aşımı), bunun yerine kişisel erişim belirteciyle kimlik doğrulayın:

1. En az `repo` kapsamına (klasik PAT) veya eşdeğer ayrıntılı erişime sahip bir belirteç oluşturun.
2. Geçerli oturum için PowerShell’de:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

3. `gh auth status` eksik `read:org` hakkında uyarı verirse, bu kapsamı içeren
   bir belirteç oluşturun ve değişkeni yeniden atayın:

```powershell
$env:GH_TOKEN="<your-token-with-repo-and-read:org>"
gh auth status
```

`gh auth refresh -s read:org` yalnızca `gh auth login` ile kimlik doğruladıysanız
ve yenilenecek saklanmış kimlik bilgileriniz varsa geçerlidir (`GH_TOKEN` kullanırken değil).

Belirteçleri asla commit etmeyin veya issue’lara ya da pull request’lere yapıştırmayın.

## İlgili

- [Kurulum özeti](/tr/install)
- [Platformlar](/tr/platforms)
