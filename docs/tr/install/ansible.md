---
read_when:
    - Otomatik sunucu dağıtımını güvenlik sıkılaştırmasıyla istiyorsunuz
    - VPN erişimli, güvenlik duvarıyla yalıtılmış bir kuruluma ihtiyacınız var
    - Uzak Debian/Ubuntu sunucularına dağıtım yapıyorsunuz
summary: Ansible, Tailscale VPN ve güvenlik duvarı yalıtımı ile otomatikleştirilmiş, güvenliği güçlendirilmiş OpenClaw kurulumu
title: Ansible
x-i18n:
    generated_at: "2026-06-28T00:42:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03eb6f40139d7e154eee92a7a1a67471da90b128cc90daf86fbc87e383a5297c
    source_path: install/ansible.md
    workflow: 16
---

OpenClaw'u güvenlik öncelikli mimariye sahip otomatik bir yükleyici olan **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** ile üretim sunucularına dağıtın.

<Info>
[openclaw-ansible](https://github.com/openclaw/openclaw-ansible) deposu, Ansible dağıtımı için doğruluk kaynağıdır. Bu sayfa hızlı bir genel bakıştır.
</Info>

## Ön koşullar

| Gereksinim | Ayrıntılar                                                |
| ---------- | --------------------------------------------------------- |
| **OS**     | Debian 11+ veya Ubuntu 20.04+                             |
| **Erişim** | Root veya sudo ayrıcalıkları                              |
| **Ağ**     | Paket kurulumu için internet bağlantısı                   |
| **Ansible** | 2.14+ (hızlı başlangıç betiği tarafından otomatik kurulur) |

## Neler elde edersiniz

- **Güvenlik duvarı öncelikli güvenlik** -- UFW + Docker izolasyonu (yalnızca SSH + Tailscale erişilebilir)
- **Tailscale VPN** -- hizmetleri herkese açık olarak göstermeden güvenli uzaktan erişim
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
2. **UFW güvenlik duvarı** -- yalnızca SSH + Tailscale portları
3. **Docker CE + Compose V2** -- varsayılan ajan sandbox arka ucu için
4. **Node.js 24 + pnpm** -- çalışma zamanı bağımlılıkları (Node 22 LTS, şu anda `22.19+`, desteklenmeye devam eder)
5. **OpenClaw** -- ana makine tabanlı, kapsayıcı içinde değil
6. **Systemd hizmeti** -- güvenlik sıkılaştırmasıyla otomatik başlatma

<Note>
Gateway doğrudan ana makinede çalışır (Docker içinde değil). Ajan sandbox kullanımı
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
    Kurulum sonrası betiği, OpenClaw ayarlarını yapılandırmanız için size rehberlik eder.
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
# Hizmet durumunu kontrol et
sudo systemctl status openclaw

# Canlı günlükleri görüntüle
sudo journalctl -u openclaw -f

# Gateway'i yeniden başlat
sudo systemctl restart openclaw

# Sağlayıcı oturumu açma (openclaw kullanıcısı olarak çalıştırın)
sudo -i -u openclaw
openclaw channels login
```

## Güvenlik mimarisi

Dağıtım 4 katmanlı bir savunma modeli kullanır:

1. **Güvenlik duvarı (UFW)** -- yalnızca SSH (22) + Tailscale (41641/udp) herkese açık olarak sunulur
2. **VPN (Tailscale)** -- gateway'e yalnızca VPN mesh üzerinden erişilebilir
3. **Docker izolasyonu** -- DOCKER-USER iptables zinciri harici portların açığa çıkmasını engeller
4. **Systemd sıkılaştırması** -- NoNewPrivileges, PrivateTmp, ayrıcalıksız kullanıcı

Harici saldırı yüzeyinizi doğrulamak için:

```bash
nmap -p- YOUR_SERVER_IP
```

Yalnızca port 22 (SSH) açık olmalıdır. Diğer tüm hizmetler (gateway, Docker) kilitlenmiştir.

Docker, gateway'in kendisini çalıştırmak için değil, ajan sandbox'ları (izole araç yürütme) için kurulur. Sandbox yapılandırması için [Multi-Agent Sandbox and Tools](/tr/tools/multi-agent-sandbox-tools) bölümüne bakın.

## Manuel kurulum

Otomasyon yerine manuel kontrolü tercih ediyorsanız:

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

    Alternatif olarak, doğrudan çalıştırın ve ardından kurulum betiğini elle yürütün:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Ardından çalıştırın: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Güncelleme

Ansible yükleyici, OpenClaw'u manuel güncellemeler için hazırlar. Standart güncelleme akışı için [Güncelleme](/tr/install/updating) bölümüne bakın.

Ansible playbook'u yeniden çalıştırmak için (örneğin, yapılandırma değişiklikleri için):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Bu işlem idempotenttir ve birden çok kez güvenle çalıştırılabilir.

## Sorun giderme

<AccordionGroup>
  <Accordion title="Güvenlik duvarı bağlantımı engelliyor">
    - Önce Tailscale VPN üzerinden erişebildiğinizden emin olun
    - SSH erişimine (port 22) her zaman izin verilir
    - Gateway tasarım gereği yalnızca Tailscale üzerinden erişilebilir

  </Accordion>
  <Accordion title="Hizmet başlamıyor">
    ```bash
    # Günlükleri kontrol et
    sudo journalctl -u openclaw -n 100

    # İzinleri doğrula
    sudo ls -la /opt/openclaw

    # Manuel başlatmayı test et
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Docker sandbox sorunları">
    ```bash
    # Docker'ın çalıştığını doğrula
    sudo systemctl status docker

    # Sandbox imajını kontrol et
    sudo docker images | grep openclaw-sandbox

    # Eksikse sandbox imajını derle (kaynak checkout gerektirir)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # Kaynak checkout olmadan npm kurulumları için bkz.
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="Sağlayıcı oturumu açma başarısız oluyor">
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

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- eksiksiz dağıtım kılavuzu
- [Docker](/tr/install/docker) -- kapsayıcı içinde Gateway kurulumu
- [Sandboxing](/tr/gateway/sandboxing) -- ajan sandbox yapılandırması
- [Multi-Agent Sandbox and Tools](/tr/tools/multi-agent-sandbox-tools) -- ajan başına izolasyon
