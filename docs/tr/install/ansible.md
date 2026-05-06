---
read_when:
    - Güvenlik sıkılaştırmasıyla otomatik sunucu dağıtımı istiyorsunuz
    - VPN erişimi olan güvenlik duvarıyla yalıtılmış bir kuruluma ihtiyacınız var
    - Uzak Debian/Ubuntu sunucularına dağıtım yapıyorsunuz
summary: Ansible, Tailscale VPN ve güvenlik duvarı izolasyonu ile otomatikleştirilmiş, güçlendirilmiş OpenClaw kurulumu
title: Ansible
x-i18n:
    generated_at: "2026-05-06T09:17:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7424e766619096f50fa0c83aa4e85e46adba11515b1871e58cf2406b7c8f815
    source_path: install/ansible.md
    workflow: 16
---

OpenClaw'ı **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** ile üretim sunucularına dağıtın -- güvenliği önceleyen mimariye sahip otomatik bir kurulum aracı.

<Info>
[openclaw-ansible](https://github.com/openclaw/openclaw-ansible) reposu, Ansible dağıtımı için doğruluk kaynağıdır. Bu sayfa hızlı bir genel bakıştır.
</Info>

## Ön Koşullar

| Gereksinim | Ayrıntılar                                                |
| ---------- | --------------------------------------------------------- |
| **İS**     | Debian 11+ veya Ubuntu 20.04+                             |
| **Erişim** | Root veya sudo ayrıcalıkları                              |
| **Ağ**     | Paket kurulumu için internet bağlantısı                   |
| **Ansible** | 2.14+ (hızlı başlangıç betiği tarafından otomatik kurulur) |

## Neler elde edersiniz

- **Güvenlik duvarı öncelikli güvenlik** -- UFW + Docker izolasyonu (yalnızca SSH + Tailscale erişilebilir)
- **Tailscale VPN** -- hizmetleri herkese açık şekilde göstermeden güvenli uzaktan erişim
- **Docker** -- izole sandbox container'ları, yalnızca localhost bağlamaları
- **Derinlemesine savunma** -- 4 katmanlı güvenlik mimarisi
- **Systemd entegrasyonu** -- sertleştirme ile açılışta otomatik başlatma
- **Tek komutla kurulum** -- dakikalar içinde tam dağıtım

## Hızlı başlangıç

Tek komutla kurulum:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Neler kurulur

Ansible playbook şunları kurar ve yapılandırır:

1. **Tailscale** -- güvenli uzaktan erişim için mesh VPN
2. **UFW güvenlik duvarı** -- yalnızca SSH + Tailscale portları
3. **Docker CE + Compose V2** -- varsayılan agent sandbox backend'i için
4. **Node.js 24 + pnpm** -- çalışma zamanı bağımlılıkları (Node 22 LTS, şu anda `22.14+`, desteklenmeye devam eder)
5. **OpenClaw** -- host tabanlı, container içinde değil
6. **Systemd hizmeti** -- güvenlik sertleştirmesiyle otomatik başlatma

<Note>
Gateway doğrudan host üzerinde çalışır (Docker içinde değil). Agent sandboxing
isteğe bağlıdır; bu playbook Docker'ı varsayılan sandbox backend'i olduğu için
kurar. Ayrıntılar ve diğer backend'ler için [Sandboxing](/tr/gateway/sandboxing) bölümüne bakın.
</Note>

## Kurulum Sonrası Ayarlar

<Steps>
  <Step title="openclaw kullanıcısına geçin">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Onboarding sihirbazını çalıştırın">
    Kurulum sonrası betiği, OpenClaw ayarlarını yapılandırmanızda size rehberlik eder.
  </Step>
  <Step title="Mesajlaşma sağlayıcılarını bağlayın">
    WhatsApp, Telegram, Discord veya Signal hesabınıza giriş yapın:
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

1. **Güvenlik duvarı (UFW)** -- herkese açık olarak yalnızca SSH (22) + Tailscale (41641/udp) gösterilir
2. **VPN (Tailscale)** -- Gateway yalnızca VPN mesh üzerinden erişilebilir
3. **Docker izolasyonu** -- DOCKER-USER iptables zinciri harici port gösterimini engeller
4. **Systemd sertleştirmesi** -- NoNewPrivileges, PrivateTmp, ayrıcalıksız kullanıcı

Harici saldırı yüzeyinizi doğrulamak için:

```bash
nmap -p- YOUR_SERVER_IP
```

Yalnızca port 22 (SSH) açık olmalıdır. Diğer tüm hizmetler (Gateway, Docker) kilitlenmiştir.

Docker, Gateway'in kendisini çalıştırmak için değil, agent sandbox'ları (izole araç yürütme) için kurulur. Sandbox yapılandırması için [Multi-Agent Sandbox and Tools](/tr/tools/multi-agent-sandbox-tools) bölümüne bakın.

## Manuel kurulum

Otomasyon yerine manuel denetimi tercih ediyorsanız:

<Steps>
  <Step title="Ön koşulları kurun">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Repoyu klonlayın">
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

    Alternatif olarak doğrudan çalıştırın ve ardından kurulum betiğini daha sonra manuel olarak yürütün:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Güncelleme

Ansible kurulum aracı, OpenClaw'ı manuel güncellemeler için ayarlar. Standart güncelleme akışı için [Updating](/tr/install/updating) bölümüne bakın.

Ansible playbook'u yeniden çalıştırmak için (örneğin yapılandırma değişiklikleri için):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Bu işlem idempotenttir ve birden çok kez çalıştırmak güvenlidir.

## Sorun giderme

<AccordionGroup>
  <Accordion title="Güvenlik duvarı bağlantımı engelliyor">
    - Önce Tailscale VPN üzerinden erişebildiğinizden emin olun
    - SSH erişimine (port 22) her zaman izin verilir
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
  <Accordion title="Sağlayıcı girişi başarısız oluyor">
    `openclaw` kullanıcısı olarak çalıştırdığınızdan emin olun:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Gelişmiş yapılandırma

Ayrıntılı güvenlik mimarisi ve sorun giderme için openclaw-ansible reposuna bakın:

- [Güvenlik Mimarisi](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Teknik Ayrıntılar](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Sorun Giderme Kılavuzu](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## İlgili

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- tam dağıtım kılavuzu
- [Docker](/tr/install/docker) -- container içinde Gateway kurulumu
- [Sandboxing](/tr/gateway/sandboxing) -- agent sandbox yapılandırması
- [Multi-Agent Sandbox and Tools](/tr/tools/multi-agent-sandbox-tools) -- agent başına izolasyon
