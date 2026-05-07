---
read_when:
    - Güvenlik sıkılaştırmasıyla otomatik sunucu dağıtımı istiyorsunuz
    - VPN erişimi olan güvenlik duvarıyla yalıtılmış bir kurulum gerekir
    - Uzak Debian/Ubuntu sunucularına dağıtım yapıyorsunuz
summary: Ansible, Tailscale VPN ve güvenlik duvarı yalıtımı ile otomatik, güçlendirilmiş OpenClaw kurulumu
title: Ansible
x-i18n:
    generated_at: "2026-05-07T13:20:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f7a2a0c575529fd45804e160299239339100ec37979a17162cee9537ddb4653
    source_path: install/ansible.md
    workflow: 16
---

OpenClaw'ı **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** ile üretim sunucularına dağıtın -- güvenlik öncelikli mimariye sahip otomatik bir kurulum aracı.

<Info>
[openclaw-ansible](https://github.com/openclaw/openclaw-ansible) deposu, Ansible dağıtımı için doğruluk kaynağıdır. Bu sayfa kısa bir genel bakıştır.
</Info>

## Önkoşullar

| Gereksinim  | Ayrıntılar                                                |
| ----------- | --------------------------------------------------------- |
| **İS**      | Debian 11+ veya Ubuntu 20.04+                             |
| **Erişim**  | Root veya sudo ayrıcalıkları                              |
| **Ağ**      | Paket kurulumu için internet bağlantısı                   |
| **Ansible** | 2.14+ (hızlı başlangıç betiği tarafından otomatik kurulur) |

## Ne elde edersiniz

- **Önce güvenlik duvarı güvenliği** -- UFW + Docker izolasyonu (yalnızca SSH + Tailscale erişilebilir)
- **Tailscale VPN** -- hizmetleri herkese açık şekilde dışa açmadan güvenli uzaktan erişim
- **Docker** -- izole sandbox kapsayıcıları, yalnızca localhost bağlamaları
- **Derinlemesine savunma** -- 4 katmanlı güvenlik mimarisi
- **Systemd entegrasyonu** -- güçlendirme ile açılışta otomatik başlatma
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
3. **Docker CE + Compose V2** -- varsayılan ajan sandbox arka ucu için
4. **Node.js 24 + pnpm** -- çalışma zamanı bağımlılıkları (Node 22 LTS, şu anda `22.16+`, desteklenmeye devam eder)
5. **OpenClaw** -- ana makine tabanlı, kapsayıcılaştırılmamış
6. **Systemd hizmeti** -- güvenlik güçlendirmesiyle otomatik başlatma

<Note>
Gateway doğrudan ana makinede çalışır (Docker içinde değil). Ajan sandbox kullanımı
isteğe bağlıdır; bu playbook Docker'ı varsayılan sandbox arka ucu olduğu için kurar.
Ayrıntılar ve diğer arka uçlar için [Sandboxing](/tr/gateway/sandboxing) sayfasına bakın.
</Note>

## Kurulum Sonrası Ayarlar

<Steps>
  <Step title="openclaw kullanıcısına geçin">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Onboarding sihirbazını çalıştırın">
    Kurulum sonrası betiği, OpenClaw ayarlarını yapılandırmanız için size rehberlik eder.
  </Step>
  <Step title="Mesajlaşma sağlayıcılarını bağlayın">
    WhatsApp, Telegram, Discord veya Signal ile oturum açın:
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
    Güvenli uzaktan erişim için VPN mesh ağınıza katılın.
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

1. **Güvenlik duvarı (UFW)** -- yalnızca SSH (22) + Tailscale (41641/udp) herkese açık şekilde dışa açıktır
2. **VPN (Tailscale)** -- Gateway yalnızca VPN mesh üzerinden erişilebilir
3. **Docker izolasyonu** -- DOCKER-USER iptables zinciri harici bağlantı noktası açılmasını önler
4. **Systemd güçlendirmesi** -- NoNewPrivileges, PrivateTmp, ayrıcalıksız kullanıcı

Harici saldırı yüzeyinizi doğrulamak için:

```bash
nmap -p- YOUR_SERVER_IP
```

Yalnızca 22 numaralı bağlantı noktası (SSH) açık olmalıdır. Diğer tüm hizmetler (Gateway, Docker) kilitlenmiştir.

Docker, Gateway'in kendisini çalıştırmak için değil, ajan sandbox'ları (izole araç yürütme) için kurulur. Sandbox yapılandırması için [Multi-Agent Sandbox and Tools](/tr/tools/multi-agent-sandbox-tools) sayfasına bakın.

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
  <Step title="Playbook'u çalıştırın">
    ```bash
    ./run-playbook.sh
    ```

    Alternatif olarak, doğrudan çalıştırıp ardından kurulum betiğini daha sonra manuel olarak yürütün:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Güncelleme

Ansible kurulum aracı, OpenClaw'ı manuel güncellemeler için ayarlar. Standart güncelleme akışı için [Güncelleme](/tr/install/updating) sayfasına bakın.

Ansible playbook'u yeniden çalıştırmak için (örneğin yapılandırma değişiklikleri için):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Bu işlem idempotenttir ve birden çok kez güvenle çalıştırılabilir.

## Sorun giderme

<AccordionGroup>
  <Accordion title="Güvenlik duvarı bağlantımı engelliyor">
    - Önce Tailscale VPN üzerinden erişebildiğinizden emin olun
    - SSH erişimine (22 numaralı bağlantı noktası) her zaman izin verilir
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

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- tam dağıtım kılavuzu
- [Docker](/tr/install/docker) -- kapsayıcılaştırılmış Gateway kurulumu
- [Sandboxing](/tr/gateway/sandboxing) -- ajan sandbox yapılandırması
- [Multi-Agent Sandbox and Tools](/tr/tools/multi-agent-sandbox-tools) -- ajan başına izolasyon
