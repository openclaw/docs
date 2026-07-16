---
read_when:
    - Chcesz zautomatyzowanego wdrażania serwera ze wzmocnionymi zabezpieczeniami
    - Potrzebna jest konfiguracja odizolowana zaporą sieciową z dostępem przez VPN
    - Wdrażanie na zdalnych serwerach Debian/Ubuntu
summary: Zautomatyzowana, wzmocniona instalacja OpenClaw z użyciem Ansible, Tailscale VPN i izolacji zapory sieciowej
title: Ansible
x-i18n:
    generated_at: "2026-07-16T18:33:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2f6b473cd5a8b80389b5ed746c4e2f2729d95bb15a2daaaa183fbdfbe144e647
    source_path: install/ansible.md
    workflow: 16
---

Wdróż OpenClaw na serwerach produkcyjnych za pomocą **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** — automatycznego instalatora o architekturze stawiającej bezpieczeństwo na pierwszym miejscu.

<Info>
Repozytorium [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) jest źródłem prawdy dla wdrażania za pomocą Ansible. Ta strona zawiera krótki przegląd.
</Info>

## Wymagania wstępne

| Wymaganie | Szczegóły                                                 |
| ----------- | --------------------------------------------------------- |
| System operacyjny | Debian 11+ lub Ubuntu 20.04+                         |
| Dostęp      | Uprawnienia użytkownika root lub sudo                     |
| Sieć        | Połączenie z Internetem do instalacji pakietów             |
| Ansible     | 2.14+ (instalowany automatycznie przez skrypt szybkiego startu) |

## Co otrzymujesz

- Bezpieczeństwo oparte przede wszystkim na zaporze sieciowej: UFW + izolacja Dockera (dostępne tylko SSH + Tailscale)
- VPN Tailscale do zdalnego dostępu bez publicznego udostępniania usług
- Docker dla izolowanych kontenerów piaskownicy z powiązaniami wyłącznie z hostem lokalnym
- Integracja z systemd ze wzmocnionymi zabezpieczeniami i automatycznym uruchamianiem podczas rozruchu
- Konfiguracja jednym poleceniem

## Szybki start

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Instalowane składniki

1. Tailscale (siatkowa sieć VPN zapewniająca bezpieczny dostęp zdalny)
2. Zapora sieciowa UFW (tylko porty SSH + Tailscale)
3. Docker CE + Compose V2 (domyślne zaplecze piaskownicy agenta)
4. Node.js i pnpm (OpenClaw wymaga Node 22.22.3+, 24.15+ lub 25.9+; zalecany jest Node 24)
5. OpenClaw zainstalowany bezpośrednio na hoście, bez konteneryzacji
6. Usługa systemd ze wzmocnionymi zabezpieczeniami

<Note>
Gateway działa bezpośrednio na hoście, a nie w Dockerze. Piaskownica agentów jest
opcjonalna; ten podręcznik playbook instaluje Dockera, ponieważ jest on domyślnym
zapleczem piaskownicy. Inne zaplecza opisano w sekcji [Piaskownica](/pl/gateway/sandboxing).
</Note>

## Konfiguracja po instalacji

<Steps>
  <Step title="Przełącz się na użytkownika openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Uruchom kreatora wdrożenia">
    Skrypt poinstalacyjny przeprowadzi przez konfigurację OpenClaw.
  </Step>
  <Step title="Połącz kanały komunikacyjne">
    Zaloguj się do WhatsApp, Telegram, Discord lub Signal:
    ```bash
    openclaw channels login --channel <name>
    ```
  </Step>
  <Step title="Zweryfikuj instalację">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Połącz się z Tailscale">
    Dołącz do siatki VPN, aby uzyskać bezpieczny dostęp zdalny.
  </Step>
</Steps>

### Szybkie polecenia

```bash
# Sprawdź stan usługi
sudo systemctl status openclaw

# Wyświetl dzienniki na żywo
sudo journalctl -u openclaw -f

# Uruchom ponownie Gateway
sudo systemctl restart openclaw

# Logowanie do kanału (uruchom jako użytkownik openclaw)
sudo -i -u openclaw
openclaw channels login --channel <name>
```

## Architektura zabezpieczeń

Czterowarstwowy model ochrony:

1. Zapora sieciowa (UFW): publicznie dostępne są tylko SSH (22) i Tailscale (41641/udp)
2. VPN (Tailscale): Gateway jest dostępny wyłącznie przez siatkę VPN
3. Izolacja Dockera: łańcuch iptables `DOCKER-USER` zapobiega zewnętrznemu udostępnianiu portów
4. Wzmocnienie zabezpieczeń systemd: `NoNewPrivileges`, `PrivateTmp`, użytkownik bez uprawnień uprzywilejowanych

Zweryfikuj zewnętrzną powierzchnię ataku:

```bash
nmap -p- YOUR_SERVER_IP
```

Otwarty powinien być tylko port 22 (SSH). Gateway i Docker pozostają zabezpieczone przed dostępem.

Docker jest instalowany na potrzeby piaskownic agentów (izolowanego wykonywania narzędzi), a nie do uruchamiania Gateway. Konfigurację piaskownicy opisano w sekcji [Piaskownica i narzędzia wielu agentów](/pl/tools/multi-agent-sandbox-tools).

## Instalacja ręczna

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
  <Step title="Uruchom podręcznik playbook">
    ```bash
    ./run-playbook.sh
    ```

    Można też uruchomić podręcznik playbook bezpośrednio, a następnie ręcznie uruchomić skrypt konfiguracyjny:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Następnie uruchom: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Aktualizowanie

Instalator Ansible konfiguruje OpenClaw do ręcznych aktualizacji; standardową procedurę opisano w sekcji [Aktualizowanie](/pl/install/updating).

Aby ponownie uruchomić podręcznik playbook (na przykład po zmianach konfiguracji):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Operacja jest idempotentna i można ją bezpiecznie wykonywać wielokrotnie.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Zapora sieciowa blokuje połączenie">
    - Najpierw połącz się przez VPN Tailscale; zgodnie z projektem Gateway jest dostępny wyłącznie w ten sposób.
    - Protokół SSH (port 22) jest zawsze dozwolony.

  </Accordion>
  <Accordion title="Usługa nie uruchamia się">
    ```bash
    # Sprawdź dzienniki
    sudo journalctl -u openclaw -n 100

    # Zweryfikuj uprawnienia
    sudo ls -la /opt/openclaw

    # Przetestuj ręczne uruchomienie
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Problemy z piaskownicą Dockera">
    ```bash
    # Sprawdź, czy Docker działa
    sudo systemctl status docker

    # Sprawdź obraz piaskownicy
    sudo docker images | grep openclaw-sandbox

    # Zbuduj brakujący obraz piaskownicy (wymaga pobranej kopii kodu źródłowego)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # Informacje o instalacji przez npm bez pobranej kopii kodu źródłowego:
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="Logowanie do kanału kończy się niepowodzeniem">
    Upewnij się, że polecenie jest uruchamiane jako użytkownik `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login --channel <name>
    ```
  </Accordion>
</AccordionGroup>

## Konfiguracja zaawansowana

Szczegółowe informacje o architekturze zabezpieczeń i rozwiązywaniu problemów znajdują się w repozytorium openclaw-ansible:

- [Architektura zabezpieczeń](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Szczegóły techniczne](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Przewodnik rozwiązywania problemów](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Powiązane materiały

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible): pełny przewodnik wdrażania
- [Docker](/pl/install/docker): konfiguracja konteneryzowanego Gateway
- [Piaskownica](/pl/gateway/sandboxing): konfiguracja piaskownicy agenta
- [Piaskownica i narzędzia wielu agentów](/pl/tools/multi-agent-sandbox-tools): izolacja poszczególnych agentów
