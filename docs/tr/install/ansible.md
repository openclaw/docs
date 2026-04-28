---
read_when:
    - Güvenlik sertleştirmesiyle otomatik sunucu dağıtımı istiyorsunuz
    - VPN erişimi olan güvenlik duvarı ile yalıtılmış bir kurulum istiyorsunuz
    - Uzak Debian/Ubuntu sunucularına dağıtım yapıyorsunuz
summary: Ansible, Tailscale VPN ve güvenlik duvarı yalıtımı ile otomatikleştirilmiş, sertleştirilmiş OpenClaw kurulumu
title: Ansible
x-i18n:
    generated_at: "2026-04-21T09:00:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2a23374c971a1f3163dd18c32e553ebaad55b2542c1f25f49bcc9ae464d679e8
    source_path: install/ansible.md
    workflow: 15
---

# Ansible Kurulumu

OpenClaw’ı üretim sunucularına **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** ile dağıtın — güvenlik öncelikli mimariye sahip otomatik bir kurulum aracı.

<Info>
Ansible dağıtımı için doğruluk kaynağı [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) deposudur. Bu sayfa kısa bir genel bakıştır.
</Info>

## Önkoşullar

| Gereksinim | Ayrıntılar                                               |
| ---------- | -------------------------------------------------------- |
| **OS**     | Debian 11+ veya Ubuntu 20.04+                            |
| **Erişim** | Root veya sudo ayrıcalıkları                             |
| **Ağ**     | Paket kurulumu için internet bağlantısı                  |
| **Ansible** | 2.14+ (quick-start betiği tarafından otomatik kurulur)  |

## Elde edecekleriniz

- **Önce güvenlik duvarı güvenliği** — UFW + Docker yalıtımı (yalnızca SSH + Tailscale erişilebilir)
- **Tailscale VPN** — hizmetleri herkese açık etmeden güvenli uzak erişim
- **Docker** — yalıtılmış sandbox container’ları, yalnızca localhost bağlamaları
- **Katmanlı savunma** — 4 katmanlı güvenlik mimarisi
- **Systemd entegrasyonu** — sertleştirme ile açılışta otomatik başlatma
- **Tek komutla kurulum** — dakikalar içinde tam dağıtım

## Hızlı başlangıç

Tek komutla kurulum:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Neler kurulur

Ansible playbook şunları kurar ve yapılandırır:

1. **Tailscale** — güvenli uzak erişim için mesh VPN
2. **UFW firewall** — yalnızca SSH + Tailscale portları
3. **Docker CE + Compose V2** — varsayılan aracı sandbox arka ucu için
4. **Node.js 24 + pnpm** — çalışma zamanı bağımlılıkları (Node 22 LTS, şu anda `22.14+`, desteklenmeye devam ediyor)
5. **OpenClaw** — host tabanlı, container içinde değil
6. **Systemd hizmeti** — güvenlik sertleştirmesiyle otomatik başlatma

<Note>
Gateway doğrudan host üzerinde çalışır (Docker içinde değil). Aracı sandboxing
isteğe bağlıdır; bu playbook Docker’ı varsayılan sandbox
arka ucu olduğu için kurar. Ayrıntılar ve diğer arka uçlar için bkz. [Sandboxing](/tr/gateway/sandboxing).
</Note>

## Kurulum sonrası ayarlar

<Steps>
  <Step title="openclaw kullanıcısına geçin">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Onboarding sihirbazını çalıştırın">
    Kurulum sonrası betik, OpenClaw ayarlarını yapılandırmanızda size rehberlik eder.
  </Step>
  <Step title="Mesajlaşma sağlayıcılarını bağlayın">
    WhatsApp, Telegram, Discord veya Signal hesabında oturum açın:
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="Kurulumu doğrulayın">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Tailscale’e bağlanın">
    Güvenli uzak erişim için VPN mesh ağınıza katılın.
  </Step>
</Steps>

### Hızlı komutlar

```bash
# Check service status
sudo systemctl status openclaw

# View live logs
sudo journalctl -u openclaw -f

# Restart gateway
sudo systemctl restart openclaw

# Provider login (run as openclaw user)
sudo -i -u openclaw
openclaw channels login
```

## Güvenlik mimarisi

Dağıtım 4 katmanlı bir savunma modeli kullanır:

1. **Firewall (UFW)** — herkese açık olarak yalnızca SSH (22) + Tailscale (41641/udp) açığa çıkarılır
2. **VPN (Tailscale)** — Gateway’e yalnızca VPN mesh üzerinden erişilebilir
3. **Docker yalıtımı** — `DOCKER-USER` iptables zinciri harici port açığa çıkmasını engeller
4. **Systemd sertleştirmesi** — NoNewPrivileges, PrivateTmp, ayrıcalıksız kullanıcı

Harici saldırı yüzeyinizi doğrulamak için:

```bash
nmap -p- YOUR_SERVER_IP
```

Yalnızca 22 numaralı port (SSH) açık olmalıdır. Diğer tüm hizmetler (Gateway, Docker) kilitlidir.

Docker, Gateway’in kendisini çalıştırmak için değil, aracı sandbox’ları (yalıtılmış araç yürütme) için kurulur. Sandbox yapılandırması için bkz. [Çoklu Aracı Sandbox ve Araçlar](/tr/tools/multi-agent-sandbox-tools).

## Manuel kurulum

Otomasyon üzerinde manuel denetimi tercih ediyorsanız:

<Steps>
  <Step title="Önkoşulları kurun">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Depoyu klonlayın">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Ansible koleksiyonlarını kurun">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Playbook’u çalıştırın">
    ```bash
    ./run-playbook.sh
    ```

    Alternatif olarak doğrudan çalıştırın ve ardından kurulum betiğini elle yürütün:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Güncelleme

Ansible kurulum aracı, OpenClaw’ı manuel güncellemeler için hazırlar. Standart güncelleme akışı için bkz. [Güncelleme](/tr/install/updating).

Ansible playbook’unu yeniden çalıştırmak için (örneğin yapılandırma değişiklikleri için):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Bu işlem idempotenttir ve birden fazla kez çalıştırmak güvenlidir.

## Sorun giderme

<AccordionGroup>
  <Accordion title="Güvenlik duvarı bağlantımı engelliyor">
    - Önce Tailscale VPN üzerinden erişebildiğinizden emin olun
    - SSH erişimine (port 22) her zaman izin verilir
    - Gateway’e tasarım gereği yalnızca Tailscale üzerinden erişilebilir

  </Accordion>
  <Accordion title="Hizmet başlamıyor">
    ```bash
    # Check logs
    sudo journalctl -u openclaw -n 100

    # Verify permissions
    sudo ls -la /opt/openclaw

    # Test manual start
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Docker sandbox sorunları">
    ```bash
    # Verify Docker is running
    sudo systemctl status docker

    # Check sandbox image
    sudo docker images | grep openclaw-sandbox

    # Build sandbox image if missing
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    ```

  </Accordion>
  <Accordion title="Sağlayıcı girişi başarısız oluyor">
    `openclaw` kullanıcısı olarak çalıştığınızdan emin olun:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Gelişmiş yapılandırma

Ayrıntılı güvenlik mimarisi ve sorun giderme için openclaw-ansible deposuna bakın:

- [Güvenlik Mimarisi](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Teknik Ayrıntılar](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Sorun Giderme Kılavuzu](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## İlgili

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) — tam dağıtım kılavuzu
- [Docker](/tr/install/docker) — container tabanlı Gateway kurulumu
- [Sandboxing](/tr/gateway/sandboxing) — aracı sandbox yapılandırması
- [Çoklu Aracı Sandbox ve Araçlar](/tr/tools/multi-agent-sandbox-tools) — aracı başına yalıtım
