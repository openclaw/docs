---
read_when:
    - Güvenlik sertleştirmesiyle otomatik sunucu dağıtımı istediğinizde
    - VPN erişimine sahip güvenlik duvarı ile yalıtılmış kurulum gerektiğinde
    - Uzak Debian/Ubuntu sunucularına dağıtım yaptığınızda
summary: Ansible, Tailscale VPN ve güvenlik duvarı yalıtımı ile otomatikleştirilmiş, sertleştirilmiş OpenClaw kurulumu
title: Ansible
x-i18n:
    generated_at: "2026-04-05T13:55:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 27433c3b4afa09406052e428be7b1990476067e47ab8abf7145ff9547b37909a
    source_path: install/ansible.md
    workflow: 15
---

# Ansible Kurulumu

OpenClaw'ı **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** ile üretim sunucularına dağıtın — güvenlik öncelikli mimariye sahip otomatik bir kurulum aracı.

<Info>
[openclaw-ansible](https://github.com/openclaw/openclaw-ansible) deposu Ansible dağıtımı için doğruluk kaynağıdır. Bu sayfa kısa bir genel bakıştır.
</Info>

## Ön koşullar

| Gereksinim | Ayrıntılar                                                |
| ---------- | --------------------------------------------------------- |
| **OS**     | Debian 11+ veya Ubuntu 20.04+                             |
| **Erişim** | Root veya sudo ayrıcalıkları                              |
| **Ağ**     | Paket kurulumu için internet bağlantısı                   |
| **Ansible** | 2.14+ (hızlı başlangıç betiği tarafından otomatik kurulur) |

## Elde Edecekleriniz

- **Güvenlik duvarı öncelikli güvenlik** — UFW + Docker yalıtımı (yalnızca SSH + Tailscale erişilebilir)
- **Tailscale VPN** — hizmetleri herkese açık hale getirmeden güvenli uzak erişim
- **Docker** — yalıtılmış sandbox kapsayıcıları, yalnızca localhost bağlamaları
- **Katmanlı savunma** — 4 katmanlı güvenlik mimarisi
- **Systemd entegrasyonu** — sertleştirme ile açılışta otomatik başlatma
- **Tek komutla kurulum** — dakikalar içinde tam dağıtım

## Hızlı Başlangıç

Tek komutla kurulum:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Neler Kurulur

Ansible playbook'u şunları kurar ve yapılandırır:

1. **Tailscale** — güvenli uzak erişim için mesh VPN
2. **UFW firewall** — yalnızca SSH + Tailscale bağlantı noktaları
3. **Docker CE + Compose V2** — agent sandbox'ları için
4. **Node.js 24 + pnpm** — çalışma zamanı bağımlılıkları (Node 22 LTS, şu anda `22.14+`, desteklenmeye devam ediyor)
5. **OpenClaw** — kapsayıcı içinde değil, ana makine tabanlı
6. **Systemd service** — güvenlik sertleştirmesi ile otomatik başlatma

<Note>
Gateway doğrudan ana makinede çalışır (Docker içinde değil), ancak agent sandbox'ları yalıtım için Docker kullanır. Ayrıntılar için [Sandboxing](/gateway/sandboxing) bölümüne bakın.
</Note>

## Kurulum Sonrası Ayarlar

<Steps>
  <Step title="openclaw kullanıcısına geçin">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Onboarding sihirbazını çalıştırın">
    Kurulum sonrası betik OpenClaw ayarlarını yapılandırmanız için size rehberlik eder.
  </Step>
  <Step title="Mesajlaşma sağlayıcılarını bağlayın">
    WhatsApp, Telegram, Discord veya Signal için oturum açın:
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
  <Step title="Tailscale'e bağlanın">
    Güvenli uzak erişim için VPN mesh'inize katılın.
  </Step>
</Steps>

### Hızlı Komutlar

```bash
# Hizmet durumunu denetle
sudo systemctl status openclaw

# Canlı günlükleri görüntüle
sudo journalctl -u openclaw -f

# Gateway'i yeniden başlat
sudo systemctl restart openclaw

# Sağlayıcı oturum açma (openclaw kullanıcısı olarak çalıştırın)
sudo -i -u openclaw
openclaw channels login
```

## Güvenlik Mimarisi

Dağıtım 4 katmanlı bir savunma modeli kullanır:

1. **Güvenlik duvarı (UFW)** — herkese açık olarak yalnızca SSH (22) + Tailscale (41641/udp) açığa çıkarılır
2. **VPN (Tailscale)** — gateway'e yalnızca VPN mesh üzerinden erişilebilir
3. **Docker yalıtımı** — DOCKER-USER iptables zinciri harici bağlantı noktası açığa çıkmasını engeller
4. **Systemd sertleştirmesi** — NoNewPrivileges, PrivateTmp, ayrıcalıksız kullanıcı

Harici saldırı yüzeyinizi doğrulamak için:

```bash
nmap -p- YOUR_SERVER_IP
```

Yalnızca 22 numaralı bağlantı noktası (SSH) açık olmalıdır. Diğer tüm hizmetler (gateway, Docker) kilitlenmiştir.

Docker, gateway'in kendisini çalıştırmak için değil, agent sandbox'ları (yalıtılmış araç yürütme) için kurulur. Sandbox yapılandırması için [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) bölümüne bakın.

## El ile Kurulum

Otomasyon üzerinde el ile denetimi tercih ediyorsanız:

<Steps>
  <Step title="Ön koşulları kurun">
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
  <Step title="Playbook'u çalıştırın">
    ```bash
    ./run-playbook.sh
    ```

    Alternatif olarak doğrudan çalıştırın ve ardından kurulum betiğini el ile yürütün:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Sonra şunu çalıştırın: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Güncelleme

Ansible kurucusu, OpenClaw'ı el ile güncellemeler için hazırlar. Standart güncelleme akışı için [Updating](/install/updating) bölümüne bakın.

Ansible playbook'unu yeniden çalıştırmak için (örneğin config değişiklikleri için):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Bu işlem idempotenttir ve birden fazla kez güvenle çalıştırılabilir.

## Sorun Giderme

<AccordionGroup>
  <Accordion title="Güvenlik duvarı bağlantımı engelliyor">
    - Önce Tailscale VPN üzerinden erişebildiğinizden emin olun
    - SSH erişimine (22 numaralı bağlantı noktası) her zaman izin verilir
    - Gateway tasarım gereği yalnızca Tailscale üzerinden erişilebilir
  </Accordion>
  <Accordion title="Hizmet başlamıyor">
    ```bash
    # Günlükleri denetle
    sudo journalctl -u openclaw -n 100

    # İzinleri doğrula
    sudo ls -la /opt/openclaw

    # El ile başlatmayı test et
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Docker sandbox sorunları">
    ```bash
    # Docker'ın çalıştığını doğrula
    sudo systemctl status docker

    # Sandbox görüntüsünü denetle
    sudo docker images | grep openclaw-sandbox

    # Eksikse sandbox görüntüsünü oluştur
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    ```

  </Accordion>
  <Accordion title="Sağlayıcı oturum açma başarısız oluyor">
    `openclaw` kullanıcısı olarak çalıştırdığınızdan emin olun:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Gelişmiş Yapılandırma

Ayrıntılı güvenlik mimarisi ve sorun giderme için openclaw-ansible deposuna bakın:

- [Security Architecture](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Technical Details](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Troubleshooting Guide](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## İlgili

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) — tam dağıtım kılavuzu
- [Docker](/install/docker) — kapsayıcılaştırılmış gateway kurulumu
- [Sandboxing](/gateway/sandboxing) — agent sandbox yapılandırması
- [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) — agent başına yalıtım
