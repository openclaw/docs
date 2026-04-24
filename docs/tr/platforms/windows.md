---
read_when:
    - OpenClaw'ı Windows'a kurma
    - Yerel Windows ile WSL2 arasında seçim yapma
    - Windows yardımcı uygulamasının durumunu arıyorsunuz
summary: 'Windows desteği: yerel ve WSL2 kurulum yolları, daemon ve mevcut dikkat edilmesi gerekenler'
title: Windows
x-i18n:
    generated_at: "2026-04-24T09:20:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc147a9da97ab911ba7529c2170526c50c86711efe6fdf4854e6e0370e4d64ea
    source_path: platforms/windows.md
    workflow: 15
---

OpenClaw hem **yerel Windows** hem de **WSL2** destekler. WSL2 daha
kararlı yoldur ve tam deneyim için önerilir — CLI, Gateway ve
araçlar Linux içinde tam uyumlulukla çalışır. Yerel Windows, temel CLI ve Gateway kullanımı için çalışır; aşağıda belirtilen bazı dikkat edilmesi gereken noktalar vardır.

Yerel Windows yardımcı uygulamaları planlanmaktadır.

## WSL2 (önerilen)

- [Başlangıç](/tr/start/getting-started) (WSL içinde kullanın)
- [Kurulum ve güncellemeler](/tr/install/updating)
- Resmî WSL2 kılavuzu (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Yerel Windows durumu

Yerel Windows CLI akışları gelişiyor, ancak önerilen yol hâlâ WSL2'dir.

Bugün yerel Windows üzerinde iyi çalışanlar:

- `install.ps1` üzerinden web sitesi kurucusu
- `openclaw --version`, `openclaw doctor` ve `openclaw plugins list --json` gibi yerel CLI kullanımı
- aşağıdaki gibi gömülü yerel agent/sağlayıcı smoke testleri:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Mevcut dikkat edilmesi gerekenler:

- `openclaw onboard --non-interactive`, `--skip-health` vermezseniz hâlâ erişilebilir bir yerel gateway bekler
- `openclaw onboard --non-interactive --install-daemon` ve `openclaw gateway install` önce Windows Scheduled Tasks kullanmayı dener
- Scheduled Task oluşturma reddedilirse OpenClaw, kullanıcı başına Startup klasörü oturum açma öğesine geri döner ve gateway'i hemen başlatır
- `schtasks` kendisi takılırsa veya yanıt vermeyi bırakırsa OpenClaw artık sonsuza kadar takılmak yerine bu yolu hızla sonlandırır ve geri dönüşe geçer
- Scheduled Tasks, daha iyi supervisor durumu sağladıkları için kullanılabildiğinde hâlâ tercih edilir

Yalnızca yerel CLI istiyorsanız, gateway hizmeti kurulumu olmadan şu seçeneklerden birini kullanın:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Yerel Windows'ta yönetilen başlangıç da istiyorsanız:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Scheduled Task oluşturma engellenirse, geri dönüş hizmet modu yine de mevcut kullanıcının Startup klasörü üzerinden oturum açtıktan sonra otomatik başlar.

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

## Windows oturum açmadan önce Gateway otomatik başlatma

Başsız kurulumlar için, hiç kimse Windows'ta oturum açmasa bile tam önyükleme zincirinin çalıştığından emin olun.

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

### 3) Windows açılışında WSL'yi otomatik başlatın

Yönetici olarak PowerShell içinde:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

`Ubuntu` yerine şu komuttan aldığınız dağıtım adını yazın:

```powershell
wsl --list --verbose
```

### Başlatma zincirini doğrulayın

Yeniden başlatmadan sonra (Windows oturum açmadan önce), WSL içinden şunu denetleyin:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Gelişmiş: WSL hizmetlerini LAN üzerinden açığa çıkarma (portproxy)

WSL'nin kendi sanal ağı vardır. Başka bir makinenin **WSL içinde**
çalışan bir hizmete (SSH, yerel bir TTS sunucusu veya Gateway) ulaşması gerekiyorsa,
bir Windows portunu mevcut WSL IP'sine yönlendirmeniz gerekir. WSL IP'si yeniden başlatmalardan sonra değişir,
bu nedenle yönlendirme kuralını yenilemeniz gerekebilir.

Örnek (PowerShell **Yönetici olarak**):

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

Portu Windows Güvenlik Duvarı üzerinden izinli hâle getirin (bir kez):

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
- Uzak node'lar **erişilebilir** bir Gateway URL'sini göstermelidir (`127.0.0.1` değil); doğrulamak için
  `openclaw status --all` kullanın.
- LAN erişimi için `listenaddress=0.0.0.0` kullanın; `127.0.0.1` bunu yalnızca yerel tutar.
- Bunu otomatik yapmak istiyorsanız, yenileme
  adımını oturum açıldığında çalıştıracak bir Scheduled Task kaydedin.

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

WSL içinde normal bir ilk kurulum için Linux Başlangıç akışını izleyin:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

İlk kez kullanım akışını yapmak yerine kaynaktan geliştiriyorsanız,
[Setup](/tr/start/setup) içindeki kaynak geliştirme döngüsünü kullanın:

```bash
pnpm install
# Yalnızca ilk çalıştırmada (veya yerel OpenClaw config/workspace sıfırlandıktan sonra)
pnpm openclaw setup
pnpm gateway:watch
```

Tam kılavuz: [Başlangıç](/tr/start/getting-started)

## Windows yardımcı uygulaması

Henüz bir Windows yardımcı uygulamamız yok. Bunu gerçeğe dönüştürmek için
katkıda bulunmak isterseniz katkılar memnuniyetle karşılanır.

## İlgili

- [Kuruluma genel bakış](/tr/install)
- [Platformlar](/tr/platforms)
