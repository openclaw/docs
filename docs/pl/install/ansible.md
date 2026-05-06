---
read_when:
    - Chcesz zautomatyzowanego wdrożenia serwera z utwardzeniem zabezpieczeń
    - Potrzebujesz konfiguracji izolowanej zaporą sieciową z dostępem przez VPN
    - Wdrażasz na zdalnych serwerach Debian/Ubuntu
summary: Zautomatyzowana, utwardzona instalacja OpenClaw z Ansible, VPN Tailscale i izolacją zapory sieciowej
title: Ansible
x-i18n:
    generated_at: "2026-05-06T09:16:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7424e766619096f50fa0c83aa4e85e46adba11515b1871e58cf2406b7c8f815
    source_path: install/ansible.md
    workflow: 16
---

Wdrażaj OpenClaw na serwerach produkcyjnych za pomocą **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- zautomatyzowanego instalatora z architekturą stawiającą bezpieczeństwo na pierwszym miejscu.

<Info>
Repozytorium [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) jest źródłem prawdy dla wdrożeń Ansible. Ta strona to krótki przegląd.
</Info>

## Wymagania wstępne

| Wymaganie  | Szczegóły                                                 |
| ---------- | --------------------------------------------------------- |
| **OS**     | Debian 11+ lub Ubuntu 20.04+                              |
| **Dostęp** | Uprawnienia root lub sudo                                 |
| **Sieć**   | Połączenie z Internetem do instalacji pakietów            |
| **Ansible** | 2.14+ (instalowany automatycznie przez skrypt szybkiego startu) |

## Co otrzymujesz

- **Bezpieczeństwo najpierw od firewalla** -- UFW + izolacja Docker (dostępne tylko SSH + Tailscale)
- **Tailscale VPN** -- bezpieczny zdalny dostęp bez publicznego wystawiania usług
- **Docker** -- izolowane kontenery sandbox, powiązania tylko z localhost
- **Wielowarstwowa ochrona** -- 4-warstwowa architektura bezpieczeństwa
- **Integracja z Systemd** -- automatyczny start przy uruchomieniu systemu z utwardzeniem
- **Konfiguracja jedną komendą** -- kompletne wdrożenie w kilka minut

## Szybki start

Instalacja jedną komendą:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Co zostanie zainstalowane

Playbook Ansible instaluje i konfiguruje:

1. **Tailscale** -- mesh VPN do bezpiecznego zdalnego dostępu
2. **Firewall UFW** -- tylko porty SSH + Tailscale
3. **Docker CE + Compose V2** -- dla domyślnego backendu sandbox agenta
4. **Node.js 24 + pnpm** -- zależności uruchomieniowe (Node 22 LTS, obecnie `22.14+`, pozostaje obsługiwany)
5. **OpenClaw** -- działający na hoście, nie w kontenerze
6. **Usługa Systemd** -- automatyczny start z utwardzeniem bezpieczeństwa

<Note>
Gateway działa bezpośrednio na hoście (nie w Docker). Sandbox agenta jest
opcjonalny; ten playbook instaluje Docker, ponieważ jest on domyślnym backendem
sandbox. Zobacz [Sandboxing](/pl/gateway/sandboxing), aby poznać szczegóły i inne backendy.
</Note>

## Konfiguracja po instalacji

<Steps>
  <Step title="Przełącz się na użytkownika openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Uruchom kreator wdrożenia">
    Skrypt poinstalacyjny przeprowadzi Cię przez konfigurację ustawień OpenClaw.
  </Step>
  <Step title="Połącz dostawców wiadomości">
    Zaloguj się do WhatsApp, Telegram, Discord lub Signal:
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="Zweryfikuj instalację">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Połącz z Tailscale">
    Dołącz do swojej siatki VPN, aby uzyskać bezpieczny zdalny dostęp.
  </Step>
</Steps>

### Szybkie komendy

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

Wdrożenie używa 4-warstwowego modelu ochrony:

1. **Firewall (UFW)** -- publicznie wystawione tylko SSH (22) + Tailscale (41641/udp)
2. **VPN (Tailscale)** -- Gateway dostępny tylko przez siatkę VPN
3. **Izolacja Docker** -- łańcuch iptables DOCKER-USER zapobiega zewnętrznemu wystawianiu portów
4. **Utwardzenie Systemd** -- NoNewPrivileges, PrivateTmp, użytkownik bez uprawnień uprzywilejowanych

Aby zweryfikować zewnętrzną powierzchnię ataku:

```bash
nmap -p- YOUR_SERVER_IP
```

Otwarty powinien być tylko port 22 (SSH). Wszystkie pozostałe usługi (Gateway, Docker) są zablokowane.

Docker jest instalowany dla sandboxów agentów (izolowane wykonywanie narzędzi), a nie do uruchamiania samego Gateway. Zobacz [Multi-Agent Sandbox and Tools](/pl/tools/multi-agent-sandbox-tools), aby skonfigurować sandbox.

## Instalacja ręczna

Jeśli wolisz ręcznie kontrolować automatyzację:

<Steps>
  <Step title="Zainstaluj wymagania wstępne">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Sklonuj repozytorium">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Zainstaluj kolekcje Ansible">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Uruchom playbook">
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

## Aktualizowanie

Instalator Ansible konfiguruje OpenClaw pod ręczne aktualizacje. Zobacz [Updating](/pl/install/updating), aby poznać standardowy przepływ aktualizacji.

Aby ponownie uruchomić playbook Ansible (na przykład przy zmianach konfiguracji):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Jest to idempotentne i można bezpiecznie uruchamiać wiele razy.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Firewall blokuje moje połączenie">
    - Najpierw upewnij się, że masz dostęp przez Tailscale VPN
    - Dostęp SSH (port 22) jest zawsze dozwolony
    - Gateway jest zgodnie z projektem dostępny tylko przez Tailscale

  </Accordion>
  <Accordion title="Usługa nie uruchamia się">
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
  <Accordion title="Problemy z sandbox Docker">
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
  <Accordion title="Logowanie dostawcy kończy się niepowodzeniem">
    Upewnij się, że działasz jako użytkownik `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Konfiguracja zaawansowana

Szczegółową architekturę bezpieczeństwa i rozwiązywanie problemów znajdziesz w repozytorium openclaw-ansible:

- [Architektura bezpieczeństwa](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Szczegóły techniczne](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Przewodnik rozwiązywania problemów](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Powiązane

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- pełny przewodnik wdrożenia
- [Docker](/pl/install/docker) -- konfiguracja konteneryzowanego Gateway
- [Sandboxing](/pl/gateway/sandboxing) -- konfiguracja sandbox agenta
- [Multi-Agent Sandbox and Tools](/pl/tools/multi-agent-sandbox-tools) -- izolacja per agent
