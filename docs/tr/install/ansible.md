---
read_when:
    - Güvenlik sıkılaştırmalı otomatik sunucu dağıtımı istiyorsunuz
    - VPN erişimiyle güvenlik duvarıyla izole edilmiş bir kuruluma ihtiyacınız var
    - Uzak Debian/Ubuntu sunucularına dağıtım yapıyorsunuz
summary: Ansible, Tailscale VPN ve güvenlik duvarı yalıtımı ile otomatik, sıkılaştırılmış OpenClaw kurulumu
title: Ansible
x-i18n:
    generated_at: "2026-05-02T08:58:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 789763c82483f4eec0963f4dccb06f2daa22d470a5e69e275f38c70a00a10ba4
    source_path: install/ansible.md
    workflow: 16
---

# Ansible Kurulumu

OpenClaw'ı **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** ile üretim sunucularına dağıtın -- güvenlik öncelikli mimariye sahip otomatik bir kurucu.

<Info>
[openclaw-ansible](https://github.com/openclaw/openclaw-ansible) deposu, Ansible dağıtımı için doğruluk kaynağıdır. Bu sayfa hızlı bir genel bakıştır.
</Info>

## Önkoşullar

| Gereksinim  | Ayrıntılar                                                |
| ----------- | --------------------------------------------------------- |
| **İşletim Sistemi** | Debian 11+ veya Ubuntu 20.04+                    |
| **Erişim**  | Root veya sudo ayrıcalıkları                              |
| **Ağ**      | Paket kurulumu için internet bağlantısı                   |
| **Ansible** | 2.14+ (hızlı başlangıç betiği tarafından otomatik kurulur) |

## Neler elde edersiniz

- **Önce güvenlik duvarı güvenliği** -- UFW + Docker izolasyonu (yalnızca SSH + Tailscale erişilebilir)
- **Tailscale VPN** -- hizmetleri herkese açık hale getirmeden güvenli uzaktan erişim
- **Docker** -- izole sandbox kapsayıcıları, yalnızca localhost bağlamaları
- **Derinlemesine savunma** -- 4 katmanlı güvenlik mimarisi
- **Systemd entegrasyonu** -- sıkılaştırma ile açılışta otomatik başlatma
- **Tek komutla kurulum** -- dakikalar içinde eksiksiz dağıtım

## Hızlı başlangıç

Tek komutla kurulum:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Neler kurulur

Ansible playbook şunları kurar ve yapılandırır:

1. **Tailscale** -- güvenli uzaktan erişim için mesh VPN
2. **UFW güvenlik duvarı** -- yalnızca SSH + Tailscale bağlantı noktaları
3. **Docker CE + Compose V2** -- varsayılan aracı sandbox arka ucu için
4. **Node.js 24 + pnpm** -- çalışma zamanı bağımlılıkları (Node 22 LTS, şu anda `22.14+`, desteklenmeye devam eder)
5. **OpenClaw** -- ana makine tabanlı, kapsayıcılaştırılmamış
6. **Systemd hizmeti** -- güvenlik sıkılaştırmasıyla otomatik başlatma

<Note>
Gateway doğrudan ana makinede çalışır (Docker içinde değil). Aracı sandbox kullanımı
isteğe bağlıdır; bu playbook Docker'ı varsayılan sandbox arka ucu olduğu için
kurar. Ayrıntılar ve diğer arka uçlar için [Sandboxing](/tr/gateway/sandboxing) bölümüne bakın.
</Note>

## Kurulum Sonrası Ayarlar

<Steps>
  <Step title="openclaw kullanıcısına geçin">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="İlk kurulum sihirbazını çalıştırın">
    Kurulum sonrası betiği, OpenClaw ayarlarını yapılandırmanızda size rehberlik eder.
  </Step>
  <Step title="Mesajlaşma sağlayıcılarını bağlayın">
    WhatsApp, Telegram, Discord veya Signal'de oturum açın:
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
    Güvenli uzaktan erişim için VPN mesh'inize katılın.
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

1. **Güvenlik duvarı (UFW)** -- yalnızca SSH (22) + Tailscale (41641/udp) herkese açık
2. **VPN (Tailscale)** -- Gateway yalnızca VPN mesh üzerinden erişilebilir
3. **Docker izolasyonu** -- DOCKER-USER iptables zinciri harici bağlantı noktası açılmasını engeller
4. **Systemd sıkılaştırması** -- NoNewPrivileges, PrivateTmp, ayrıcalıksız kullanıcı

Harici saldırı yüzeyinizi doğrulamak için:

```bash
nmap -p- YOUR_SERVER_IP
```

Yalnızca bağlantı noktası 22 (SSH) açık olmalıdır. Diğer tüm hizmetler (Gateway, Docker) kilitlenmiştir.

Docker, Gateway'in kendisini çalıştırmak için değil, aracı sandbox'ları (izole araç yürütme) için kurulur. Sandbox yapılandırması için [Çok Aracılı Sandbox ve Araçlar](/tr/tools/multi-agent-sandbox-tools) bölümüne bakın.

## Manuel kurulum

Otomasyon yerine manuel denetimi tercih ediyorsanız:

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
  <Step title="Playbook'u çalıştırın">
    ```bash
    ./run-playbook.sh
    ```

    Alternatif olarak doğrudan çalıştırın ve ardından kurulum betiğini sonradan manuel olarak yürütün:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Güncelleme

Ansible kurucusu, OpenClaw'ı manuel güncellemeler için hazırlar. Standart güncelleme akışı için [Güncelleme](/tr/install/updating) bölümüne bakın.

Ansible playbook'u yeniden çalıştırmak için (örneğin, yapılandırma değişiklikleri için):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Bu işlem idempotenttir ve birden çok kez çalıştırmak güvenlidir.

## Sorun giderme

<AccordionGroup>
  <Accordion title="Güvenlik duvarı bağlantımı engelliyor">
    - Önce Tailscale VPN üzerinden erişebildiğinizden emin olun
    - SSH erişimine (bağlantı noktası 22) her zaman izin verilir
    - Gateway tasarım gereği yalnızca Tailscale üzerinden erişilebilir

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

    # Build sandbox image if missing (requires source checkout)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # For npm installs without a source checkout, see
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="Sağlayıcı oturumu açılamıyor">
    `openclaw` kullanıcısı olarak çalıştırdığınızdan emin olun:
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

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- tam dağıtım kılavuzu
- [Docker](/tr/install/docker) -- kapsayıcılaştırılmış Gateway kurulumu
- [Sandboxing](/tr/gateway/sandboxing) -- aracı sandbox yapılandırması
- [Çok Aracılı Sandbox ve Araçlar](/tr/tools/multi-agent-sandbox-tools) -- aracı başına izolasyon
