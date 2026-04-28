---
read_when:
    - Chcesz zautomatyzować wdrożenie serwera z utwardzaniem zabezpieczeń.
    - Potrzebujesz konfiguracji z izolacją zapory sieciowej i dostępem przez VPN.
    - Wdrażasz na zdalnych serwerach Debian/Ubuntu.
summary: Zautomatyzowana, utwardzona instalacja OpenClaw z Ansible, Tailscale VPN i izolacją zapory sieciowej
title: Ansible
x-i18n:
    generated_at: "2026-04-21T09:55:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2a23374c971a1f3163dd18c32e553ebaad55b2542c1f25f49bcc9ae464d679e8
    source_path: install/ansible.md
    workflow: 15
---

# Instalacja z użyciem Ansible

Wdróż OpenClaw na serwerach produkcyjnych za pomocą **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** — zautomatyzowanego instalatora z architekturą stawiającą bezpieczeństwo na pierwszym miejscu.

<Info>
Repozytorium [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) jest źródłem prawdy dla wdrożeń Ansible. Ta strona to krótki przegląd.
</Info>

## Wymagania wstępne

| Wymaganie | Szczegóły                                                |
| --------- | -------------------------------------------------------- |
| **OS**    | Debian 11+ lub Ubuntu 20.04+                             |
| **Dostęp** | Uprawnienia roota lub sudo                              |
| **Sieć**  | Połączenie z Internetem do instalacji pakietów           |
| **Ansible** | 2.14+ (instalowane automatycznie przez skrypt szybkiego startu) |

## Co otrzymujesz

- **Bezpieczeństwo oparte najpierw na zaporze** — UFW + izolacja Docker (publicznie dostępne tylko SSH + Tailscale)
- **Tailscale VPN** — bezpieczny zdalny dostęp bez publicznego wystawiania usług
- **Docker** — izolowane kontenery sandbox, powiązania tylko z localhost
- **Ochrona warstwowa** — 4-warstwowa architektura bezpieczeństwa
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
3. **Docker CE + Compose V2** — dla domyślnego backendu sandbox agenta
4. **Node.js 24 + pnpm** — zależności środowiska uruchomieniowego (Node 22 LTS, obecnie `22.14+`, nadal jest obsługiwany)
5. **OpenClaw** — hostowane na hoście, nie skonteneryzowane
6. **Usługa Systemd** — automatyczny start z utwardzaniem zabezpieczeń

<Note>
Gateway działa bezpośrednio na hoście (nie w Dockerze). Sandboxing agenta jest
opcjonalny; ten playbook instaluje Docker, ponieważ jest to domyślny backend
sandbox. Szczegóły i inne backendy znajdziesz w [Sandboxing](/pl/gateway/sandboxing).
</Note>

## Konfiguracja po instalacji

<Steps>
  <Step title="Przełącz się na użytkownika openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Uruchom kreator wdrażania">
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
# Sprawdź status usługi
sudo systemctl status openclaw

# Wyświetl logi na żywo
sudo journalctl -u openclaw -f

# Uruchom ponownie Gateway
sudo systemctl restart openclaw

# Logowanie dostawcy (uruchom jako użytkownik openclaw)
sudo -i -u openclaw
openclaw channels login
```

## Architektura bezpieczeństwa

Wdrożenie używa 4-warstwowego modelu ochrony:

1. **Zapora (UFW)** — publicznie wystawione są tylko SSH (22) + Tailscale (41641/udp)
2. **VPN (Tailscale)** — Gateway jest dostępny wyłącznie przez siatkę VPN
3. **Izolacja Docker** — łańcuch iptables DOCKER-USER zapobiega publicznemu wystawianiu portów
4. **Utwardzanie Systemd** — NoNewPrivileges, PrivateTmp, użytkownik nieuprzywilejowany

Aby zweryfikować zewnętrzną powierzchnię ataku:

```bash
nmap -p- YOUR_SERVER_IP
```

Otwarty powinien być tylko port 22 (SSH). Wszystkie pozostałe usługi (Gateway, Docker) są zablokowane.

Docker jest instalowany dla sandboxów agentów (izolowane wykonywanie narzędzi), a nie do uruchamiania samego Gateway. Konfigurację sandbox znajdziesz w [Multi-Agent Sandbox and Tools](/pl/tools/multi-agent-sandbox-tools).

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

Instalator Ansible konfiguruje OpenClaw do ręcznych aktualizacji. Standardowy przepływ aktualizacji znajdziesz w [Updating](/pl/install/updating).

Aby ponownie uruchomić playbook Ansible (na przykład w celu wprowadzenia zmian konfiguracji):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Jest to operacja idempotentna i bezpieczna do wielokrotnego uruchamiania.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Zapora blokuje moje połączenie">
    - Upewnij się najpierw, że masz dostęp przez Tailscale VPN
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
  <Accordion title="Problemy z sandbox Docker">
    ```bash
    # Zweryfikuj, że Docker działa
    sudo systemctl status docker

    # Sprawdź obraz sandbox
    sudo docker images | grep openclaw-sandbox

    # Zbuduj obraz sandbox, jeśli go brakuje
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    ```

  </Accordion>
  <Accordion title="Logowanie dostawcy kończy się błędem">
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

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) — pełny przewodnik wdrożenia
- [Docker](/pl/install/docker) — konfiguracja Gateway w kontenerze
- [Sandboxing](/pl/gateway/sandboxing) — konfiguracja sandbox agenta
- [Multi-Agent Sandbox and Tools](/pl/tools/multi-agent-sandbox-tools) — izolacja per agent
