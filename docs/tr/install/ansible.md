---
read_when:
    - Güvenlik sıkılaştırmasıyla otomatik sunucu dağıtımı istiyorsunuz
    - VPN erişimine sahip, güvenlik duvarıyla yalıtılmış bir kurulum gereklidir
    - Uzak Debian/Ubuntu sunucularına dağıtım yapıyorsunuz
summary: Ansible, Tailscale VPN ve güvenlik duvarı yalıtımıyla otomatikleştirilmiş, güçlendirilmiş OpenClaw kurulumu
title: Ansible
x-i18n:
    generated_at: "2026-07-12T12:21:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d3626ab364169609f92f636cb6b86cb980dca2b235500e748296128765444ae
    source_path: install/ansible.md
    workflow: 16
---

OpenClaw'u, güvenliği önceliklendiren mimariye sahip otomatik bir yükleyici olan **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** ile üretim sunucularına dağıtın.

<Info>
Ansible dağıtımı için doğruluk kaynağı [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) deposudur. Bu sayfa hızlı bir genel bakış sunar.
</Info>

## Ön koşullar

| Gereksinim | Ayrıntılar                                               |
| ----------- | -------------------------------------------------------- |
| İşletim sistemi | Debian 11+ veya Ubuntu 20.04+                        |
| Erişim      | Root veya sudo ayrıcalıkları                             |
| Ağ          | Paket kurulumu için internet bağlantısı                  |
| Ansible     | 2.14+ (hızlı başlangıç betiği tarafından otomatik kurulur) |

## Neler elde edersiniz

- Güvenlik duvarını önceleyen güvenlik: UFW + Docker yalıtımı (yalnızca SSH + Tailscale erişilebilir)
- Hizmetleri herkese açık hâle getirmeden uzaktan erişim için Tailscale VPN
- Yalnızca localhost'a bağlanan yalıtılmış korumalı alan konteynerleri için Docker
- Güvenlik sıkılaştırması ve sistem açılışında otomatik başlatma özellikli systemd entegrasyonu
- Tek komutla kurulum

## Hızlı başlangıç

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Neler kurulur

1. Tailscale (güvenli uzaktan erişim için örgü VPN)
2. UFW güvenlik duvarı (yalnızca SSH + Tailscale portları)
3. Docker CE + Compose V2 (varsayılan ajan korumalı alan arka ucu)
4. Node.js ve pnpm (OpenClaw, Node 22.19+ veya 23.11+ gerektirir; Node 24 önerilir)
5. Konteynerleştirilmeden, ana makine tabanlı olarak kurulan OpenClaw
6. Güvenlik sıkılaştırmasına sahip bir systemd hizmeti

<Note>
Gateway, Docker içinde değil doğrudan ana makinede çalışır. Ajan korumalı alanı isteğe bağlıdır; bu playbook, varsayılan korumalı alan arka ucu olduğu için Docker'ı kurar. Diğer arka uçlar için [Korumalı Alan](/tr/gateway/sandboxing) bölümüne bakın.
</Note>

## Kurulum sonrası yapılandırma

<Steps>
  <Step title="openclaw kullanıcısına geçin">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="İlk kullanım sihirbazını çalıştırın">
    Kurulum sonrası betik, OpenClaw yapılandırması boyunca size rehberlik eder.
  </Step>
  <Step title="Mesajlaşma kanallarını bağlayın">
    WhatsApp, Telegram, Discord veya Signal'de oturum açın:
    ```bash
    openclaw channels login --channel <name>
    ```
  </Step>
  <Step title="Kurulumu doğrulayın">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Tailscale'e bağlanın">
    Güvenli uzaktan erişim için VPN örgünüze katılın.
  </Step>
</Steps>

### Hızlı komutlar

```bash
# Hizmet durumunu kontrol edin
sudo systemctl status openclaw

# Canlı günlükleri görüntüleyin
sudo journalctl -u openclaw -f

# Gateway'i yeniden başlatın
sudo systemctl restart openclaw

# Kanalda oturum açma (openclaw kullanıcısı olarak çalıştırın)
sudo -i -u openclaw
openclaw channels login --channel <name>
```

## Güvenlik mimarisi

Dört katmanlı savunma modeli:

1. Güvenlik duvarı (UFW): yalnızca SSH (22) ve Tailscale (41641/udp) herkese açıktır
2. VPN (Tailscale): Gateway'e yalnızca VPN örgüsü üzerinden erişilebilir
3. Docker yalıtımı: `DOCKER-USER` iptables zinciri, portların dışarıya açılmasını önler
4. Systemd güvenlik sıkılaştırması: `NoNewPrivileges`, `PrivateTmp`, ayrıcalıksız kullanıcı

Dış saldırı yüzeyinizi doğrulayın:

```bash
nmap -p- YOUR_SERVER_IP
```

Yalnızca 22 numaralı port (SSH) açık olmalıdır. Gateway ve Docker dış erişime kapalı kalır.

Docker, Gateway'i çalıştırmak için değil, ajan korumalı alanları (yalıtılmış araç yürütme) için kurulur. Korumalı alan yapılandırması için [Çok Ajanlı Korumalı Alan ve Araçlar](/tr/tools/multi-agent-sandbox-tools) bölümüne bakın.

## Elle kurulum

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

    Alternatif olarak playbook'u doğrudan çalıştırın ve ardından kurulum betiğini elle çalıştırın:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Ardından çalıştırın: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Güncelleme

Ansible yükleyicisi, OpenClaw'u elle güncellemelere uygun şekilde yapılandırır; standart süreç için [Güncelleme](/tr/install/updating) bölümüne bakın.

Playbook'u yeniden çalıştırmak için (örneğin yapılandırma değişikliklerinden sonra):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Bu işlem eşgüçlüdür ve birden çok kez güvenle çalıştırılabilir.

## Sorun giderme

<AccordionGroup>
  <Accordion title="Güvenlik duvarı bağlantımı engelliyor">
    - Önce Tailscale VPN üzerinden bağlanın; Gateway'e tasarım gereği yalnızca bu şekilde erişilebilir.
    - SSH'ye (port 22) her zaman izin verilir.

  </Accordion>
  <Accordion title="Hizmet başlatılamıyor">
    ```bash
    # Günlükleri kontrol edin
    sudo journalctl -u openclaw -n 100

    # İzinleri doğrulayın
    sudo ls -la /opt/openclaw

    # Elle başlatmayı sınayın
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Docker korumalı alan sorunları">
    ```bash
    # Docker'ın çalıştığını doğrulayın
    sudo systemctl status docker

    # Korumalı alan imajını kontrol edin
    sudo docker images | grep openclaw-sandbox

    # Eksikse korumalı alan imajını oluşturun (kaynak kod çalışma kopyası gerektirir)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # Kaynak kod çalışma kopyası olmadan yapılan npm kurulumları için bkz.
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="Kanal oturumu açılamıyor">
    `openclaw` kullanıcısı olarak çalıştırdığınızdan emin olun:
    ```bash
    sudo -i -u openclaw
    openclaw channels login --channel <name>
    ```
  </Accordion>
</AccordionGroup>

## Gelişmiş yapılandırma

Ayrıntılı güvenlik mimarisi ve sorun giderme bilgileri için openclaw-ansible deposuna bakın:

- [Güvenlik Mimarisi](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Teknik Ayrıntılar](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Sorun Giderme Kılavuzu](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## İlgili kaynaklar

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible): tam dağıtım kılavuzu
- [Docker](/tr/install/docker): konteynerleştirilmiş Gateway kurulumu
- [Korumalı Alan](/tr/gateway/sandboxing): ajan korumalı alanı yapılandırması
- [Çok Ajanlı Korumalı Alan ve Araçlar](/tr/tools/multi-agent-sandbox-tools): ajan başına yalıtım
