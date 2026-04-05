---
read_when:
    - Chcesz zautomatyzowanego wdrożenia serwera z utwardzaniem bezpieczeństwa
    - Potrzebujesz konfiguracji izolowanej zaporą z dostępem przez VPN
    - Wdrażasz na zdalnych serwerach Debian/Ubuntu
summary: Zautomatyzowana, utwardzona instalacja OpenClaw z Ansible, VPN Tailscale i izolacją zaporą sieciową
title: Ansible
x-i18n:
    generated_at: "2026-04-05T13:56:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 27433c3b4afa09406052e428be7b1990476067e47ab8abf7145ff9547b37909a
    source_path: install/ansible.md
    workflow: 15
---

# Instalacja Ansible

Wdróż OpenClaw na serwery produkcyjne za pomocą **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** — zautomatyzowanego instalatora z architekturą stawiającą bezpieczeństwo na pierwszym miejscu.

<Info>
Repozytorium [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) jest źródłem prawdy dla wdrożeń Ansible. Ta strona to krótki przegląd.
</Info>

## Wymagania wstępne

| Wymaganie | Szczegóły                                                 |
| --------- | --------------------------------------------------------- |
| **OS**    | Debian 11+ lub Ubuntu 20.04+                              |
| **Dostęp** | Uprawnienia root lub sudo                                 |
| **Sieć**  | Połączenie z internetem do instalacji pakietów            |
| **Ansible** | 2.14+ (instalowany automatycznie przez skrypt szybkiego startu) |

## Co otrzymujesz

- **Bezpieczeństwo stawiające na zaporę** — UFW + izolacja Docker (publicznie dostępne tylko SSH + Tailscale)
- **VPN Tailscale** — bezpieczny zdalny dostęp bez publicznego wystawiania usług
- **Docker** — izolowane kontenery sandbox, powiązania tylko z localhost
- **Defence in depth** — 4-warstwowa architektura bezpieczeństwa
- **Integracja z Systemd** — automatyczny start przy uruchomieniu z utwardzaniem
- **Konfiguracja jednym poleceniem** — pełne wdrożenie w kilka minut

## Szybki start

Instalacja jednym poleceniem:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Co zostanie zainstalowane

Playbook Ansible instaluje i konfiguruje:

1. **Tailscale** — mesh VPN do bezpiecznego zdalnego dostępu
2. **Zapora UFW** — tylko porty SSH + Tailscale
3. **Docker CE + Compose V2** — dla sandboxów agentów
4. **Node.js 24 + pnpm** — zależności środowiska uruchomieniowego (Node 22 LTS, obecnie `22.14+`, nadal jest obsługiwany)
5. **OpenClaw** — hostowane bezpośrednio, bez konteneryzacji
6. **Usługa Systemd** — automatyczny start z utwardzaniem bezpieczeństwa

<Note>
Gateway działa bezpośrednio na hoście (nie w Docker), ale sandboxy agentów używają Docker do izolacji. Szczegóły znajdziesz w [Sandboxing](/gateway/sandboxing).
</Note>

## Konfiguracja po instalacji

<Steps>
  <Step title="Przełącz się na użytkownika openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Uruchom kreator onboardingu">
    Skrypt po instalacji przeprowadzi Cię przez konfigurację ustawień OpenClaw.
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
  <Step title="Połącz się z Tailscale">
    Dołącz do swojej siatki VPN, aby uzyskać bezpieczny zdalny dostęp.
  </Step>
</Steps>

### Szybkie polecenia

```bash
# Sprawdź stan usługi
sudo systemctl status openclaw

# Wyświetl logi na żywo
sudo journalctl -u openclaw -f

# Zrestartuj gateway
sudo systemctl restart openclaw

# Logowanie dostawcy (uruchom jako użytkownik openclaw)
sudo -i -u openclaw
openclaw channels login
```

## Architektura bezpieczeństwa

Wdrożenie wykorzystuje 4-warstwowy model obrony:

1. **Zapora (UFW)** — publicznie wystawione tylko SSH (22) + Tailscale (41641/udp)
2. **VPN (Tailscale)** — gateway dostępny tylko przez siatkę VPN
3. **Izolacja Docker** — łańcuch iptables DOCKER-USER zapobiega zewnętrznemu wystawieniu portów
4. **Utwardzanie Systemd** — NoNewPrivileges, PrivateTmp, użytkownik bez uprawnień

Aby zweryfikować zewnętrzną powierzchnię ataku:

```bash
nmap -p- YOUR_SERVER_IP
```

Otwarty powinien być tylko port 22 (SSH). Wszystkie pozostałe usługi (gateway, Docker) są zablokowane.

Docker jest instalowany dla sandboxów agentów (izolowane wykonywanie narzędzi), a nie do uruchamiania samego gateway. Zobacz [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools), aby poznać konfigurację sandboxa.

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

    Alternatywnie uruchom go bezpośrednio, a potem ręcznie wykonaj skrypt konfiguracji:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Następnie uruchom: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Aktualizowanie

Instalator Ansible konfiguruje OpenClaw do ręcznych aktualizacji. Standardowy przepływ aktualizacji znajdziesz w [Updating](/install/updating).

Aby ponownie uruchomić playbook Ansible (na przykład przy zmianach konfiguracji):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Jest to idempotentne i bezpieczne do wielokrotnego uruchamiania.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Zapora blokuje moje połączenie">
    - Najpierw upewnij się, że masz dostęp przez VPN Tailscale
    - Dostęp SSH (port 22) jest zawsze dozwolony
    - Gateway jest celowo dostępny tylko przez Tailscale
  </Accordion>
  <Accordion title="Usługa nie chce się uruchomić">
    ```bash
    # Sprawdź logi
    sudo journalctl -u openclaw -n 100

    # Zweryfikuj uprawnienia
    sudo ls -la /opt/openclaw

    # Przetestuj ręczny start
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Problemy z sandboxem Docker">
    ```bash
    # Zweryfikuj, że Docker działa
    sudo systemctl status docker

    # Sprawdź obraz sandboxa
    sudo docker images | grep openclaw-sandbox

    # Zbuduj obraz sandboxa, jeśli go brakuje
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
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

Szczegółową architekturę bezpieczeństwa i informacje o rozwiązywaniu problemów znajdziesz w repozytorium openclaw-ansible:

- [Security Architecture](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Technical Details](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Troubleshooting Guide](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Powiązane

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) — pełny przewodnik wdrożeniowy
- [Docker](/install/docker) — konfiguracja gateway konteneryzowanego
- [Sandboxing](/gateway/sandboxing) — konfiguracja sandboxa agentów
- [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) — izolacja per agent
