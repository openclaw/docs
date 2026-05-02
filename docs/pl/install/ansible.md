---
read_when:
    - Chcesz zautomatyzowanego wdrażania serwera z utwardzeniem zabezpieczeń
    - Potrzebujesz konfiguracji odizolowanej zaporą sieciową z dostępem przez VPN
    - Wdrażasz na zdalnych serwerach Debian/Ubuntu
summary: Zautomatyzowana, utwardzona instalacja OpenClaw z Ansible, Tailscale VPN i izolacją zapory sieciowej
title: Ansible
x-i18n:
    generated_at: "2026-05-02T09:54:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 789763c82483f4eec0963f4dccb06f2daa22d470a5e69e275f38c70a00a10ba4
    source_path: install/ansible.md
    workflow: 16
---

# Instalacja Ansible

Wdróż OpenClaw na serwerach produkcyjnych za pomocą **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- zautomatyzowanego instalatora o architekturze stawiającej bezpieczeństwo na pierwszym miejscu.

<Info>
Repozytorium [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) jest źródłem prawdy dla wdrożeń Ansible. Ta strona jest krótkim omówieniem.
</Info>

## Wymagania wstępne

| Wymaganie | Szczegóły                                                 |
| --------- | --------------------------------------------------------- |
| **OS**    | Debian 11+ lub Ubuntu 20.04+                              |
| **Dostęp** | Uprawnienia root lub sudo                                 |
| **Sieć**  | Połączenie internetowe do instalacji pakietów             |
| **Ansible** | 2.14+ (instalowany automatycznie przez skrypt szybkiego startu) |

## Co otrzymujesz

- **Bezpieczeństwo od zapory** -- izolacja UFW + Docker (dostępne tylko SSH + Tailscale)
- **VPN Tailscale** -- bezpieczny zdalny dostęp bez publicznego wystawiania usług
- **Docker** -- izolowane kontenery piaskownicy, powiązania tylko z localhost
- **Obrona w głąb** -- 4-warstwowa architektura bezpieczeństwa
- **Integracja z systemd** -- automatyczny start przy uruchomieniu systemu z utwardzeniem
- **Konfiguracja jedną komendą** -- kompletne wdrożenie w kilka minut

## Szybki start

Instalacja jedną komendą:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Co zostaje zainstalowane

Playbook Ansible instaluje i konfiguruje:

1. **Tailscale** -- mesh VPN do bezpiecznego zdalnego dostępu
2. **Zapora UFW** -- tylko porty SSH + Tailscale
3. **Docker CE + Compose V2** -- dla domyślnego backendu piaskownicy agenta
4. **Node.js 24 + pnpm** -- zależności środowiska uruchomieniowego (Node 22 LTS, obecnie `22.14+`, pozostaje obsługiwany)
5. **OpenClaw** -- uruchamiany na hoście, nie w kontenerze
6. **Usługa systemd** -- automatyczny start z utwardzeniem bezpieczeństwa

<Note>
Gateway działa bezpośrednio na hoście (nie w Dockerze). Piaskownica agenta jest
opcjonalna; ten playbook instaluje Docker, ponieważ jest on domyślnym backendem
piaskownicy. Szczegóły i inne backendy znajdziesz w [Piaskownicy](/pl/gateway/sandboxing).
</Note>

## Konfiguracja po instalacji

<Steps>
  <Step title="Przełącz się na użytkownika openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Uruchom kreator wdrożeniowy">
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

Wdrożenie używa 4-warstwowego modelu obrony:

1. **Zapora (UFW)** -- publicznie wystawione tylko SSH (22) + Tailscale (41641/udp)
2. **VPN (Tailscale)** -- gateway dostępny tylko przez siatkę VPN
3. **Izolacja Docker** -- łańcuch iptables DOCKER-USER zapobiega zewnętrznemu wystawianiu portów
4. **Utwardzenie systemd** -- NoNewPrivileges, PrivateTmp, nieuprzywilejowany użytkownik

Aby zweryfikować zewnętrzną powierzchnię ataku:

```bash
nmap -p- YOUR_SERVER_IP
```

Otwarty powinien być tylko port 22 (SSH). Wszystkie pozostałe usługi (gateway, Docker) są zablokowane.

Docker jest instalowany dla piaskownic agentów (izolowane wykonywanie narzędzi), a nie do uruchamiania samego gateway. Konfigurację piaskownicy znajdziesz w [Piaskownica i narzędzia Multi-Agent](/pl/tools/multi-agent-sandbox-tools).

## Instalacja ręczna

Jeśli wolisz ręczną kontrolę nad automatyzacją:

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

    Alternatywnie uruchom bezpośrednio, a następnie ręcznie wykonaj skrypt konfiguracyjny:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Aktualizowanie

Instalator Ansible konfiguruje OpenClaw do ręcznych aktualizacji. Standardowy proces aktualizacji znajdziesz w [Aktualizowaniu](/pl/install/updating).

Aby ponownie uruchomić playbook Ansible (na przykład w celu zmiany konfiguracji):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Jest to idempotentne i można bezpiecznie uruchamiać wiele razy.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Zapora blokuje moje połączenie">
    - Najpierw upewnij się, że masz dostęp przez VPN Tailscale
    - Dostęp SSH (port 22) jest zawsze dozwolony
    - Gateway jest z założenia dostępny tylko przez Tailscale

  </Accordion>
  <Accordion title="Usługa nie chce się uruchomić">
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
  <Accordion title="Logowanie do dostawcy nie powiodło się">
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
- [Docker](/pl/install/docker) -- konfiguracja skonteneryzowanego gateway
- [Piaskownica](/pl/gateway/sandboxing) -- konfiguracja piaskownicy agenta
- [Piaskownica i narzędzia Multi-Agent](/pl/tools/multi-agent-sandbox-tools) -- izolacja per agent
