---
read_when:
    - Chcesz automatycznego wdrożenia serwera z utwardzeniem zabezpieczeń
    - Potrzebujesz konfiguracji izolowanej zaporą sieciową z dostępem przez VPN
    - Wdrażasz na zdalnych serwerach Debian/Ubuntu
summary: Zautomatyzowana, utwardzona instalacja OpenClaw z Ansible, VPN Tailscale i izolacją zapory sieciowej
title: Ansible
x-i18n:
    generated_at: "2026-04-30T09:59:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbe42e3f83b02e436f0dc5111dda1e069c573b32fdde23ad50dbb2b147c6dd72
    source_path: install/ansible.md
    workflow: 16
---

# Instalacja Ansible

Wdróż OpenClaw na serwerach produkcyjnych z **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- zautomatyzowanym instalatorem o architekturze projektowanej z myślą o bezpieczeństwie.

<Info>
Repozytorium [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) jest źródłem prawdy dla wdrożeń Ansible. Ta strona to krótki przegląd.
</Info>

## Wymagania wstępne

| Wymaganie  | Szczegóły                                                 |
| ---------- | --------------------------------------------------------- |
| **System** | Debian 11+ lub Ubuntu 20.04+                              |
| **Dostęp** | Uprawnienia root lub sudo                                 |
| **Sieć**   | Połączenie internetowe do instalacji pakietów             |
| **Ansible** | 2.14+ (instalowane automatycznie przez skrypt szybkiego startu) |

## Co otrzymujesz

- **Bezpieczeństwo oparte najpierw na zaporze** -- UFW + izolacja Docker (dostępne tylko SSH + Tailscale)
- **VPN Tailscale** -- bezpieczny dostęp zdalny bez publicznego wystawiania usług
- **Docker** -- izolowane kontenery sandbox, powiązania tylko z localhost
- **Obrona warstwowa** -- 4-warstwowa architektura bezpieczeństwa
- **Integracja z systemd** -- automatyczne uruchamianie przy starcie z utwardzeniem zabezpieczeń
- **Konfiguracja jednym poleceniem** -- pełne wdrożenie w kilka minut

## Szybki start

Instalacja jednym poleceniem:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Co jest instalowane

Playbook Ansible instaluje i konfiguruje:

1. **Tailscale** -- mesh VPN do bezpiecznego dostępu zdalnego
2. **Zapora UFW** -- tylko porty SSH + Tailscale
3. **Docker CE + Compose V2** -- dla domyślnego backendu sandboxa agenta
4. **Node.js 24 + pnpm** -- zależności środowiska uruchomieniowego (Node 22 LTS, obecnie `22.14+`, pozostaje obsługiwany)
5. **OpenClaw** -- uruchamiany na hoście, nie w kontenerze
6. **Usługa systemd** -- automatyczne uruchamianie z utwardzeniem zabezpieczeń

<Note>
Gateway działa bezpośrednio na hoście (nie w Docker). Sandboxing agentów jest
opcjonalny; ten playbook instaluje Docker, ponieważ jest on domyślnym backendem
sandboxa. Zobacz [Sandboxing](/pl/gateway/sandboxing), aby poznać szczegóły i inne backendy.
</Note>

## Konfiguracja po instalacji

<Steps>
  <Step title="Przełącz się na użytkownika openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Uruchom kreator wdrażania">
    Skrypt po instalacji przeprowadzi Cię przez konfigurowanie ustawień OpenClaw.
  </Step>
  <Step title="Połącz dostawców komunikacji">
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
    Dołącz do swojej siatki VPN, aby uzyskać bezpieczny dostęp zdalny.
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
3. **Izolacja Docker** -- łańcuch iptables DOCKER-USER zapobiega zewnętrznemu wystawianiu portów
4. **Utwardzenie systemd** -- NoNewPrivileges, PrivateTmp, użytkownik nieuprzywilejowany

Aby zweryfikować zewnętrzną powierzchnię ataku:

```bash
nmap -p- YOUR_SERVER_IP
```

Otwarty powinien być tylko port 22 (SSH). Wszystkie pozostałe usługi (Gateway, Docker) są zablokowane.

Docker jest instalowany dla sandboxów agentów (izolowanego wykonywania narzędzi), a nie do uruchamiania samego Gateway. Zobacz [Wieloagentowy sandbox i narzędzia](/pl/tools/multi-agent-sandbox-tools), aby skonfigurować sandbox.

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

    Alternatywnie uruchom bezpośrednio, a potem ręcznie wykonaj skrypt konfiguracyjny:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Aktualizowanie

Instalator Ansible konfiguruje OpenClaw do aktualizacji ręcznych. Zobacz [Aktualizowanie](/pl/install/updating), aby poznać standardowy przepływ aktualizacji.

Aby ponownie uruchomić playbook Ansible (na przykład w celu zmian konfiguracji):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Jest to idempotentne i bezpieczne do wielokrotnego uruchamiania.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Zapora blokuje moje połączenie">
    - Najpierw upewnij się, że możesz uzyskać dostęp przez VPN Tailscale
    - Dostęp SSH (port 22) jest zawsze dozwolony
    - Gateway jest z założenia dostępny tylko przez Tailscale

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
  <Accordion title="Problemy z sandboxem Docker">
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
  <Accordion title="Logowanie do dostawcy kończy się niepowodzeniem">
    Upewnij się, że działasz jako użytkownik `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Konfiguracja zaawansowana

Szczegółową architekturę bezpieczeństwa i informacje o rozwiązywaniu problemów znajdziesz w repozytorium openclaw-ansible:

- [Architektura bezpieczeństwa](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Szczegóły techniczne](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Przewodnik rozwiązywania problemów](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Powiązane

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- pełny przewodnik wdrożenia
- [Docker](/pl/install/docker) -- konfiguracja konteneryzowanego Gateway
- [Sandboxing](/pl/gateway/sandboxing) -- konfiguracja sandboxa agenta
- [Wieloagentowy sandbox i narzędzia](/pl/tools/multi-agent-sandbox-tools) -- izolacja per agent
