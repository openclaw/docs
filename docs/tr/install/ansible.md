---
read_when:
    - Güvenlik sıkılaştırmasıyla otomatik sunucu dağıtımı istiyorsunuz
    - VPN erişimli, güvenlik duvarıyla yalıtılmış bir kurulum gerekir
    - Uzak Debian/Ubuntu sunucularına dağıtım yapıyorsunuz
summary: Ansible, Tailscale VPN ve güvenlik duvarı yalıtımı ile otomatikleştirilmiş, güvenliği güçlendirilmiş OpenClaw kurulumu
title: Ansible
x-i18n:
    generated_at: "2026-04-30T09:27:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbe42e3f83b02e436f0dc5111dda1e069c573b32fdde23ad50dbb2b147c6dd72
    source_path: install/ansible.md
    workflow: 16
---

# Ansible Kurulumu

OpenClaw'u güvenlik öncelikli mimariye sahip otomatik bir kurucu olan **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** ile üretim sunucularına dağıtın.

<Info>
[openclaw-ansible](https://github.com/openclaw/openclaw-ansible) reposu, Ansible dağıtımı için doğruluk kaynağıdır. Bu sayfa hızlı bir genel bakıştır.
</Info>

## Önkoşullar

| Gereksinim   | Ayrıntılar                                                 |
| ------------ | ---------------------------------------------------------- |
| **İS**       | Debian 11+ veya Ubuntu 20.04+                              |
| **Erişim**   | Root veya sudo ayrıcalıkları                               |
| **Ağ**       | Paket kurulumu için internet bağlantısı                    |
| **Ansible**  | 2.14+ (hızlı başlangıç betiği tarafından otomatik kurulur) |

## Elde edecekleriniz

- **Önce güvenlik duvarı güvenliği** -- UFW + Docker izolasyonu (yalnızca SSH + Tailscale erişilebilir)
- **Tailscale VPN** -- hizmetleri herkese açık şekilde sunmadan güvenli uzaktan erişim
- **Docker** -- izole sandbox kapsayıcıları, yalnızca localhost bağlamaları
- **Katmanlı savunma** -- 4 katmanlı güvenlik mimarisi
- **Systemd entegrasyonu** -- sertleştirme ile açılışta otomatik başlatma
- **Tek komutla kurulum** -- dakikalar içinde eksiksiz dağıtım

## Hızlı başlangıç

Tek komutla kurulum:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Kurulanlar

Ansible playbook şunları kurar ve yapılandırır:

1. **Tailscale** -- güvenli uzaktan erişim için mesh VPN
2. **UFW güvenlik duvarı** -- yalnızca SSH + Tailscale portları
3. **Docker CE + Compose V2** -- varsayılan ajan sandbox arka ucu için
4. **Node.js 24 + pnpm** -- çalışma zamanı bağımlılıkları (Node 22 LTS, şu anda `22.14+`, desteklenmeye devam eder)
5. **OpenClaw** -- ana makine tabanlı, kapsayıcılaştırılmamış
6. **Systemd hizmeti** -- güvenlik sertleştirmesiyle otomatik başlatma

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
  <Step title="Onboarding sihirbazını çalıştırın">
    Kurulum sonrası betik, OpenClaw ayarlarını yapılandırmanızda size yol gösterir.
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

# Sağlayıcı girişi (openclaw kullanıcısı olarak çalıştırın)
sudo -i -u openclaw
openclaw channels login
```

## Güvenlik mimarisi

Dağıtım 4 katmanlı bir savunma modeli kullanır:

1. **Güvenlik duvarı (UFW)** -- yalnızca SSH (22) + Tailscale (41641/udp) herkese açık
2. **VPN (Tailscale)** -- Gateway yalnızca VPN mesh üzerinden erişilebilir
3. **Docker izolasyonu** -- DOCKER-USER iptables zinciri harici port açılmasını engeller
4. **Systemd sertleştirmesi** -- NoNewPrivileges, PrivateTmp, ayrıcalıksız kullanıcı

Harici saldırı yüzeyinizi doğrulamak için:

```bash
nmap -p- YOUR_SERVER_IP
```

Yalnızca port 22 (SSH) açık olmalıdır. Diğer tüm hizmetler (Gateway, Docker) kilitlenmiştir.

Docker, Gateway'in kendisini çalıştırmak için değil, ajan sandbox'ları (izole araç yürütme) için kurulur. Sandbox yapılandırması için [Çok Ajanlı Sandbox ve Araçlar](/tr/tools/multi-agent-sandbox-tools) bölümüne bakın.

## Manuel kurulum

Otomasyon üzerinde manuel denetimi tercih ediyorsanız:

<Steps>
  <Step title="Önkoşulları kurun">
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

    Alternatif olarak doğrudan çalıştırın ve ardından kurulum betiğini sonrasında manuel olarak yürütün:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Ardından çalıştırın: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Güncelleme

Ansible kurucusu, OpenClaw'u manuel güncellemeler için ayarlar. Standart güncelleme akışı için [Güncelleme](/tr/install/updating) bölümüne bakın.

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

    # Eksikse sandbox imajını oluştur
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
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

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- eksiksiz dağıtım kılavuzu
- [Docker](/tr/install/docker) -- kapsayıcılaştırılmış Gateway kurulumu
- [Sandboxing](/tr/gateway/sandboxing) -- ajan sandbox yapılandırması
- [Çok Ajanlı Sandbox ve Araçlar](/tr/tools/multi-agent-sandbox-tools) -- ajan başına izolasyon
