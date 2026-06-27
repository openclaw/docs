---
read_when:
    - Chcesz zautomatyzowanego wdrażania serwera z utwardzeniem zabezpieczeń
    - Potrzebujesz konfiguracji odizolowanej zaporą sieciową z dostępem VPN
    - Wdrażasz na zdalne serwery Debian/Ubuntu
summary: Zautomatyzowana, wzmocniona instalacja OpenClaw z Ansible, VPN Tailscale i izolacją zapory sieciowej
title: Ansible
x-i18n:
    generated_at: "2026-06-27T17:41:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03eb6f40139d7e154eee92a7a1a67471da90b128cc90daf86fbc87e383a5297c
    source_path: install/ansible.md
    workflow: 16
---

Wdróż OpenClaw na serwerach produkcyjnych za pomocą **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- zautomatyzowanego instalatora o architekturze nastawionej przede wszystkim na bezpieczeństwo.

<Info>
Repozytorium [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) jest źródłem prawdy dla wdrożeń Ansible. Ta strona to krótki przegląd.
</Info>

## Wymagania wstępne

| Wymaganie   | Szczegóły                                                 |
| ----------- | --------------------------------------------------------- |
| **OS**      | Debian 11+ lub Ubuntu 20.04+                              |
| **Dostęp**  | Uprawnienia root lub sudo                                 |
| **Sieć**    | Połączenie z internetem do instalacji pakietów            |
| **Ansible** | 2.14+ (instalowany automatycznie przez skrypt szybkiego startu) |

## Co otrzymujesz

- **Bezpieczeństwo z priorytetem zapory** -- izolacja UFW + Docker (dostępne tylko SSH + Tailscale)
- **VPN Tailscale** -- bezpieczny zdalny dostęp bez publicznego wystawiania usług
- **Docker** -- izolowane kontenery piaskownicy, powiązania tylko z localhost
- **Obrona wielowarstwowa** -- 4-warstwowa architektura bezpieczeństwa
- **Integracja z Systemd** -- automatyczne uruchamianie przy starcie z utwardzeniem
- **Konfiguracja jednym poleceniem** -- pełne wdrożenie w kilka minut

## Szybki start

Instalacja jednym poleceniem:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Co zostanie zainstalowane

Playbook Ansible instaluje i konfiguruje:

1. **Tailscale** -- mesh VPN do bezpiecznego zdalnego dostępu
2. **Zapora UFW** -- tylko porty SSH + Tailscale
3. **Docker CE + Compose V2** -- dla domyślnego backendu piaskownicy agenta
4. **Node.js 24 + pnpm** -- zależności środowiska uruchomieniowego (Node 22 LTS, obecnie `22.19+`, nadal jest obsługiwany)
5. **OpenClaw** -- uruchamiany na hoście, nie w kontenerze
6. **Usługa Systemd** -- automatyczny start z utwardzeniem bezpieczeństwa

<Note>
Gateway działa bezpośrednio na hoście (nie w Docker). Piaskownica agentów jest
opcjonalna; ten playbook instaluje Docker, ponieważ jest on domyślnym
backendem piaskownicy. Zobacz [Piaskownica](/pl/gateway/sandboxing), aby uzyskać szczegóły i poznać inne backendy.
</Note>

## Konfiguracja po instalacji

<Steps>
  <Step title="Switch to the openclaw user">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Run the onboarding wizard">
    Skrypt poinstalacyjny przeprowadzi Cię przez konfigurację ustawień OpenClaw.
  </Step>
  <Step title="Connect messaging providers">
    Zaloguj się do WhatsApp, Telegram, Discord lub Signal:
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="Verify the installation">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Connect to Tailscale">
    Dołącz do swojej siatki VPN, aby uzyskać bezpieczny zdalny dostęp.
  </Step>
</Steps>

### Szybkie polecenia

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

## Architektura bezpieczeństwa

Wdrożenie używa 4-warstwowego modelu obrony:

1. **Zapora (UFW)** -- publicznie wystawione tylko SSH (22) + Tailscale (41641/udp)
2. **VPN (Tailscale)** -- Gateway dostępny tylko przez siatkę VPN
3. **Izolacja Docker** -- łańcuch iptables DOCKER-USER zapobiega zewnętrznemu wystawieniu portów
4. **Utwardzenie Systemd** -- NoNewPrivileges, PrivateTmp, użytkownik bez podwyższonych uprawnień

Aby zweryfikować zewnętrzną powierzchnię ataku:

```bash
nmap -p- YOUR_SERVER_IP
```

Otwarty powinien być tylko port 22 (SSH). Wszystkie inne usługi (Gateway, Docker) są zablokowane.

Docker jest instalowany dla piaskownic agentów (izolowane wykonywanie narzędzi), a nie do uruchamiania samego Gateway. Zobacz [Piaskownica i narzędzia dla wielu agentów](/pl/tools/multi-agent-sandbox-tools), aby skonfigurować piaskownicę.

## Instalacja ręczna

Jeśli wolisz ręczną kontrolę zamiast automatyzacji:

<Steps>
  <Step title="Install prerequisites">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Clone the repository">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Install Ansible collections">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Run the playbook">
    ```bash
    ./run-playbook.sh
    ```

    Alternatywnie uruchom bezpośrednio, a następnie ręcznie wykonaj skrypt konfiguracji:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Aktualizacja

Instalator Ansible konfiguruje OpenClaw pod ręczne aktualizacje. Zobacz [Aktualizacja](/pl/install/updating), aby poznać standardowy przepływ aktualizacji.

Aby ponownie uruchomić playbook Ansible (na przykład przy zmianach konfiguracji):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Jest to idempotentne i można bezpiecznie uruchamiać wielokrotnie.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Firewall blocks my connection">
    - Najpierw upewnij się, że możesz uzyskać dostęp przez VPN Tailscale
    - Dostęp SSH (port 22) jest zawsze dozwolony
    - Gateway jest z założenia dostępny tylko przez Tailscale

  </Accordion>
  <Accordion title="Service will not start">
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
  <Accordion title="Docker sandbox issues">
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
  <Accordion title="Provider login fails">
    Upewnij się, że działasz jako użytkownik `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Konfiguracja zaawansowana

Aby uzyskać szczegółowe informacje o architekturze bezpieczeństwa i rozwiązywaniu problemów, zobacz repozytorium openclaw-ansible:

- [Architektura bezpieczeństwa](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Szczegóły techniczne](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Przewodnik rozwiązywania problemów](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Powiązane

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- pełny przewodnik wdrożenia
- [Docker](/pl/install/docker) -- konfiguracja konteneryzowanego Gateway
- [Piaskownica](/pl/gateway/sandboxing) -- konfiguracja piaskownicy agenta
- [Piaskownica i narzędzia dla wielu agentów](/pl/tools/multi-agent-sandbox-tools) -- izolacja per agent
