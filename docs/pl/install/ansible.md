---
read_when:
    - Chcesz zautomatyzowanego wdrażania serwera ze wzmocnionymi zabezpieczeniami
    - Potrzebujesz konfiguracji odizolowanej zaporą sieciową z dostępem przez VPN
    - Wdrażasz na zdalnych serwerach Debian/Ubuntu
summary: Zautomatyzowana, wzmocniona instalacja OpenClaw z użyciem Ansible, VPN Tailscale i izolacji zapory sieciowej
title: Ansible
x-i18n:
    generated_at: "2026-07-12T15:12:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d3626ab364169609f92f636cb6b86cb980dca2b235500e748296128765444ae
    source_path: install/ansible.md
    workflow: 16
---

Wdrażaj OpenClaw na serwerach produkcyjnych za pomocą **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** — automatycznego instalatora o architekturze stawiającej bezpieczeństwo na pierwszym miejscu.

<Info>
Repozytorium [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) jest źródłem prawdy dla wdrożeń Ansible. Ta strona zawiera krótkie omówienie.
</Info>

## Wymagania wstępne

| Wymaganie | Szczegóły                                                        |
| --------- | ---------------------------------------------------------------- |
| System operacyjny | Debian 11+ lub Ubuntu 20.04+                              |
| Dostęp    | Uprawnienia użytkownika root lub sudo                            |
| Sieć      | Połączenie z Internetem potrzebne do instalowania pakietów       |
| Ansible   | 2.14+ (instalowany automatycznie przez skrypt szybkiego startu)  |

## Co otrzymujesz

- Zabezpieczenia oparte przede wszystkim na zaporze: UFW + izolacja Docker (dostępne są tylko SSH + Tailscale)
- VPN Tailscale do zdalnego dostępu bez publicznego udostępniania usług
- Docker do izolowanych kontenerów piaskownicy z powiązaniami wyłącznie z hostem lokalnym
- Integracja z systemd obejmująca wzmocnienie zabezpieczeń i automatyczne uruchamianie podczas rozruchu
- Konfiguracja jednym poleceniem

## Szybki start

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Co zostanie zainstalowane

1. Tailscale (VPN typu mesh do bezpiecznego dostępu zdalnego)
2. Zapora UFW (wyłącznie porty SSH + Tailscale)
3. Docker CE + Compose V2 (domyślny mechanizm piaskownicy agentów)
4. Node.js i pnpm (OpenClaw wymaga Node 22.19+ lub 23.11+; zalecany jest Node 24)
5. OpenClaw zainstalowany bezpośrednio na hoście, bez konteneryzacji
6. Usługa systemd ze wzmocnionymi zabezpieczeniami

<Note>
Gateway działa bezpośrednio na hoście, a nie w Dockerze. Piaskownica agentów jest
opcjonalna; ten playbook instaluje Docker, ponieważ jest on domyślnym mechanizmem
piaskownicy. Inne mechanizmy opisano w sekcji [Piaskownica](/pl/gateway/sandboxing).
</Note>

## Konfiguracja po instalacji

<Steps>
  <Step title="Przełącz się na użytkownika openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Uruchom kreator wdrożenia">
    Skrypt poinstalacyjny przeprowadzi Cię przez konfigurację OpenClaw.
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
    Dołącz do swojej sieci VPN typu mesh, aby uzyskać bezpieczny dostęp zdalny.
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

## Architektura bezpieczeństwa

Czterowarstwowy model ochrony:

1. Zapora (UFW): publicznie udostępnione są tylko SSH (22) i Tailscale (41641/udp)
2. VPN (Tailscale): Gateway jest dostępny tylko przez sieć VPN typu mesh
3. Izolacja Docker: łańcuch iptables `DOCKER-USER` zapobiega zewnętrznemu udostępnianiu portów
4. Wzmocnienie systemd: `NoNewPrivileges`, `PrivateTmp`, użytkownik bez uprawnień uprzywilejowanych

Zweryfikuj powierzchnię zewnętrznego ataku:

```bash
nmap -p- YOUR_SERVER_IP
```

Otwarty powinien być tylko port 22 (SSH). Gateway i Docker pozostają zabezpieczone przed dostępem.

Docker jest instalowany na potrzeby piaskownic agentów (izolowanego wykonywania narzędzi), a nie do uruchamiania Gateway. Konfigurację piaskownicy opisano w sekcji [Piaskownica i narzędzia dla wielu agentów](/pl/tools/multi-agent-sandbox-tools).

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
  <Step title="Uruchom playbook">
    ```bash
    ./run-playbook.sh
    ```

    Możesz też uruchomić playbook bezpośrednio, a następnie ręcznie uruchomić skrypt konfiguracyjny:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Następnie uruchom: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Aktualizowanie

Instalator Ansible konfiguruje OpenClaw do ręcznych aktualizacji; standardowy proces opisano w sekcji [Aktualizowanie](/pl/install/updating).

Aby ponownie uruchomić playbook (na przykład po zmianach konfiguracji):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Operacja jest idempotentna i można ją bezpiecznie wykonywać wielokrotnie.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Zapora blokuje moje połączenie">
    - Najpierw połącz się przez VPN Tailscale; zgodnie z założeniami Gateway jest dostępny tylko w ten sposób.
    - Dostęp przez SSH (port 22) jest zawsze dozwolony.

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
  <Accordion title="Problemy z piaskownicą Docker">
    ```bash
    # Sprawdź, czy Docker działa
    sudo systemctl status docker

    # Sprawdź obraz piaskownicy
    sudo docker images | grep openclaw-sandbox

    # Zbuduj obraz piaskownicy, jeśli go brakuje (wymaga kopii roboczej kodu źródłowego)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # Informacje o instalacjach npm bez kopii roboczej kodu źródłowego:
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="Logowanie do kanału nie powiodło się">
    Upewnij się, że polecenie jest uruchamiane jako użytkownik `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login --channel <name>
    ```
  </Accordion>
</AccordionGroup>

## Konfiguracja zaawansowana

Szczegółowe informacje o architekturze bezpieczeństwa i rozwiązywaniu problemów znajdują się w repozytorium openclaw-ansible:

- [Architektura bezpieczeństwa](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Szczegóły techniczne](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Przewodnik rozwiązywania problemów](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Powiązane materiały

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible): kompletny przewodnik wdrażania
- [Docker](/pl/install/docker): konfiguracja konteneryzowanego Gateway
- [Piaskownica](/pl/gateway/sandboxing): konfiguracja piaskownicy agentów
- [Piaskownica i narzędzia dla wielu agentów](/pl/tools/multi-agent-sandbox-tools): izolacja poszczególnych agentów
