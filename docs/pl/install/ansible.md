---
read_when:
    - Potrzebujesz zautomatyzowanego wdrażania serwera z utwardzeniem zabezpieczeń
    - Potrzebujesz konfiguracji izolowanej zaporą sieciową z dostępem przez VPN
    - Wdrażasz na zdalne serwery Debian/Ubuntu
summary: Zautomatyzowana, wzmocniona instalacja OpenClaw z Ansible, Tailscale VPN i izolacją zapory sieciowej
title: Ansible
x-i18n:
    generated_at: "2026-05-07T13:20:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f7a2a0c575529fd45804e160299239339100ec37979a17162cee9537ddb4653
    source_path: install/ansible.md
    workflow: 16
---

Wdróż OpenClaw na serwerach produkcyjnych za pomocą **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- zautomatyzowanego instalatora z architekturą stawiającą bezpieczeństwo na pierwszym miejscu.

<Info>
Repozytorium [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) jest źródłem prawdy dla wdrożeń Ansible. Ta strona to szybki przegląd.
</Info>

## Wymagania wstępne

| Wymaganie | Szczegóły                                                 |
| --------- | --------------------------------------------------------- |
| **OS**    | Debian 11+ lub Ubuntu 20.04+                              |
| **Dostęp** | Uprawnienia root lub sudo                                |
| **Sieć**  | Połączenie z internetem do instalacji pakietów            |
| **Ansible** | 2.14+ (instalowany automatycznie przez skrypt szybkiego startu) |

## Co otrzymujesz

- **Bezpieczeństwo od zapory sieciowej** -- izolacja UFW + Docker (dostępne tylko SSH + Tailscale)
- **Tailscale VPN** -- bezpieczny dostęp zdalny bez publicznego wystawiania usług
- **Docker** -- izolowane kontenery piaskownicy, powiązania tylko z localhost
- **Obrona w głąb** -- 4-warstwowa architektura bezpieczeństwa
- **Integracja z systemd** -- automatyczne uruchamianie przy starcie z utwardzeniem
- **Konfiguracja jednym poleceniem** -- pełne wdrożenie w kilka minut

## Szybki start

Instalacja jednym poleceniem:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Co zostanie zainstalowane

Playbook Ansible instaluje i konfiguruje:

1. **Tailscale** -- mesh VPN do bezpiecznego dostępu zdalnego
2. **Zapora UFW** -- tylko porty SSH + Tailscale
3. **Docker CE + Compose V2** -- dla domyślnego backendu piaskownicy agenta
4. **Node.js 24 + pnpm** -- zależności środowiska uruchomieniowego (Node 22 LTS, obecnie `22.16+`, pozostaje obsługiwany)
5. **OpenClaw** -- uruchamiany na hoście, nie w kontenerze
6. **Usługa systemd** -- automatyczny start z utwardzeniem bezpieczeństwa

<Note>
Gateway działa bezpośrednio na hoście (nie w Dockerze). Piaskownica agenta jest
opcjonalna; ten playbook instaluje Docker, ponieważ jest on domyślnym backendem
piaskownicy. Szczegóły i inne backendy znajdziesz w [Piaskownica](/pl/gateway/sandboxing).
</Note>

## Konfiguracja po instalacji

<Steps>
  <Step title="Przełącz się na użytkownika openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Uruchom kreatora wdrażania">
    Skrypt poinstalacyjny przeprowadzi Cię przez konfigurację ustawień OpenClaw.
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
  <Step title="Połącz się z Tailscale">
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

1. **Zapora sieciowa (UFW)** -- publicznie wystawione są tylko SSH (22) + Tailscale (41641/udp)
2. **VPN (Tailscale)** -- Gateway dostępny tylko przez siatkę VPN
3. **Izolacja Docker** -- łańcuch iptables DOCKER-USER zapobiega zewnętrznemu wystawianiu portów
4. **Utwardzenie systemd** -- NoNewPrivileges, PrivateTmp, użytkownik nieuprzywilejowany

Aby zweryfikować zewnętrzną powierzchnię ataku:

```bash
nmap -p- YOUR_SERVER_IP
```

Otwarty powinien być tylko port 22 (SSH). Wszystkie pozostałe usługi (Gateway, Docker) są zablokowane.

Docker jest instalowany dla piaskownic agentów (izolowane wykonywanie narzędzi), a nie do uruchamiania samego Gateway. Konfigurację piaskownicy znajdziesz w [Piaskownica i narzędzia wielu agentów](/pl/tools/multi-agent-sandbox-tools).

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

Instalator Ansible konfiguruje OpenClaw do ręcznych aktualizacji. Standardowy przepływ aktualizacji znajdziesz w [Aktualizowanie](/pl/install/updating).

Aby ponownie uruchomić playbook Ansible (na przykład w celu zmian konfiguracji):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Jest to idempotentne i można bezpiecznie uruchamiać wielokrotnie.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Zapora sieciowa blokuje moje połączenie">
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
  <Accordion title="Problemy z piaskownicą Docker">
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
  <Accordion title="Logowanie dostawcy nie działa">
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
- [Piaskownica](/pl/gateway/sandboxing) -- konfiguracja piaskownicy agenta
- [Piaskownica i narzędzia wielu agentów](/pl/tools/multi-agent-sandbox-tools) -- izolacja per agent
