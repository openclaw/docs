---
read_when:
    - Chcesz, aby OpenClaw był odizolowany od głównego środowiska macOS
    - Chcesz integracji iMessage (BlueBubbles) w piaskownicy
    - Potrzebujesz resetowalnego środowiska macOS, które możesz sklonować
    - Chcesz porównać opcje lokalnych i hostowanych maszyn wirtualnych macOS
summary: Uruchamiaj OpenClaw w izolowanej maszynie wirtualnej macOS (lokalnej lub hostowanej), gdy potrzebujesz izolacji albo iMessage
title: Maszyny wirtualne macOS
x-i18n:
    generated_at: "2026-05-06T09:18:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2b6841f66e63606346f364bb1b1b9ca4a3d52558e3d8c6f129c5b89387c6968
    source_path: install/macos-vm.md
    workflow: 16
---

## Zalecane ustawienie domyślne (większość użytkowników)

- **Mały VPS z Linuksem** dla zawsze włączonego Gateway i niskich kosztów. Zobacz [hosting VPS](/pl/vps).
- **Dedykowany sprzęt** (Mac mini lub komputer z Linuksem), jeśli chcesz mieć pełną kontrolę i **adres IP z sieci domowej** do automatyzacji przeglądarki. Wiele witryn blokuje adresy IP centrów danych, więc lokalne przeglądanie często działa lepiej.
- **Hybrydowo:** utrzymuj Gateway na tanim VPS, a swojego Maca podłączaj jako **node**, gdy potrzebujesz automatyzacji przeglądarki/UI. Zobacz [Nodes](/pl/nodes) i [zdalny Gateway](/pl/gateway/remote).

Użyj maszyny wirtualnej macOS, gdy konkretnie potrzebujesz funkcji dostępnych tylko w macOS (iMessage/BlueBubbles) lub chcesz ścisłej izolacji od swojego codziennego Maca.

## Opcje maszyny wirtualnej macOS

### Lokalna maszyna wirtualna na Apple Silicon Mac (Lume)

Uruchom OpenClaw w odizolowanej maszynie wirtualnej macOS na swoim istniejącym Apple Silicon Mac, używając [Lume](https://cua.ai/docs/lume).

Daje to:

- Pełne środowisko macOS w izolacji (host pozostaje czysty)
- Obsługę iMessage przez BlueBubbles (niemożliwe na Linuksie/Windows)
- Natychmiastowy reset przez klonowanie maszyn wirtualnych
- Brak dodatkowego sprzętu lub kosztów chmury

### Dostawcy hostowanych Maców (chmura)

Jeśli chcesz macOS w chmurze, dostawcy hostowanych Maców też działają:

- [MacStadium](https://www.macstadium.com/) (hostowane Maki)
- Inni dostawcy hostowanych Maców też działają; postępuj zgodnie z ich dokumentacją VM + SSH

Gdy masz dostęp SSH do maszyny wirtualnej macOS, przejdź do kroku 6 poniżej.

---

## Szybka ścieżka (Lume, doświadczeni użytkownicy)

1. Zainstaluj Lume
2. `lume create openclaw --os macos --ipsw latest`
3. Ukończ Asystenta konfiguracji, włącz Remote Login (SSH)
4. `lume run openclaw --no-display`
5. Zaloguj się przez SSH, zainstaluj OpenClaw, skonfiguruj kanały
6. Gotowe

---

## Czego potrzebujesz (Lume)

- Apple Silicon Mac (M1/M2/M3/M4)
- macOS Sequoia lub nowszy na hoście
- ~60 GB wolnego miejsca na dysku na maszynę wirtualną
- ~20 minut

---

## 1) Zainstaluj Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Jeśli `~/.local/bin` nie znajduje się w Twoim PATH:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Sprawdź:

```bash
lume --version
```

Dokumentacja: [Instalacja Lume](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) Utwórz maszynę wirtualną macOS

```bash
lume create openclaw --os macos --ipsw latest
```

To pobiera macOS i tworzy maszynę wirtualną. Okno VNC otworzy się automatycznie.

<Note>
Pobieranie może potrwać, zależnie od Twojego połączenia.
</Note>

---

## 3) Ukończ Asystenta konfiguracji

W oknie VNC:

1. Wybierz język i region
2. Pomiń Apple ID (lub zaloguj się, jeśli później chcesz używać iMessage)
3. Utwórz konto użytkownika (zapamiętaj nazwę użytkownika i hasło)
4. Pomiń wszystkie opcjonalne funkcje

Po ukończeniu konfiguracji włącz SSH:

1. Otwórz Ustawienia systemowe → Ogólne → Udostępnianie
2. Włącz „Remote Login”

---

## 4) Uzyskaj adres IP maszyny wirtualnej

```bash
lume get openclaw
```

Znajdź adres IP (zwykle `192.168.64.x`).

---

## 5) Połącz się z maszyną wirtualną przez SSH

```bash
ssh youruser@192.168.64.X
```

Zastąp `youruser` kontem, które utworzyłeś, a adres IP adresem IP swojej maszyny wirtualnej.

---

## 6) Zainstaluj OpenClaw

Wewnątrz maszyny wirtualnej:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Postępuj zgodnie z monitami wdrażania, aby skonfigurować dostawcę modelu (Anthropic, OpenAI itd.).

---

## 7) Skonfiguruj kanały

Edytuj plik konfiguracji:

```bash
nano ~/.openclaw/openclaw.json
```

Dodaj swoje kanały:

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
  },
}
```

Następnie zaloguj się do WhatsApp (zeskanuj QR):

```bash
openclaw channels login
```

---

## 8) Uruchom maszynę wirtualną bez interfejsu graficznego

Zatrzymaj maszynę wirtualną i uruchom ponownie bez ekranu:

```bash
lume stop openclaw
lume run openclaw --no-display
```

Maszyna wirtualna działa w tle. Daemon OpenClaw utrzymuje działanie gateway.

Aby sprawdzić status:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Bonus: integracja iMessage

To najważniejsza zaleta uruchamiania na macOS. Użyj [BlueBubbles](https://bluebubbles.app), aby dodać iMessage do OpenClaw.

Wewnątrz maszyny wirtualnej:

1. Pobierz BlueBubbles z bluebubbles.app
2. Zaloguj się swoim Apple ID
3. Włącz Web API i ustaw hasło
4. Skieruj webhooks BlueBubbles do swojego gateway (przykład: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

Dodaj do konfiguracji OpenClaw:

```json5
{
  channels: {
    bluebubbles: {
      serverUrl: "http://localhost:1234",
      password: "your-api-password",
      webhookPath: "/bluebubbles-webhook",
    },
  },
}
```

Uruchom ponownie gateway. Teraz Twój agent może wysyłać i odbierać wiadomości iMessage.

Pełne szczegóły konfiguracji: [kanał BlueBubbles](/pl/channels/bluebubbles)

---

## Zapisz złoty obraz

Przed dalszą personalizacją wykonaj migawkę czystego stanu:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

Reset w dowolnym momencie:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## Działanie 24/7

Utrzymuj działanie maszyny wirtualnej przez:

- Pozostawienie Maca podłączonego do zasilania
- Wyłączenie uśpienia w Ustawieniach systemowych → Oszczędzanie energii
- Użycie `caffeinate`, jeśli to potrzebne

Aby uzyskać prawdziwie zawsze włączoną konfigurację, rozważ dedykowanego Maca mini lub mały VPS. Zobacz [hosting VPS](/pl/vps).

---

## Rozwiązywanie problemów

| Problem                          | Rozwiązanie                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------- |
| Nie można połączyć się z VM przez SSH | Sprawdź, czy „Remote Login” jest włączone w Ustawieniach systemowych VM                         |
| IP VM nie jest widoczne          | Poczekaj, aż VM w pełni się uruchomi, uruchom ponownie `lume get openclaw`                      |
| Nie znaleziono polecenia Lume    | Dodaj `~/.local/bin` do swojego PATH                                                            |
| QR WhatsApp się nie skanuje      | Upewnij się, że jesteś zalogowany do VM (nie hosta), gdy uruchamiasz `openclaw channels login`  |

---

## Powiązana dokumentacja

- [hosting VPS](/pl/vps)
- [Nodes](/pl/nodes)
- [zdalny Gateway](/pl/gateway/remote)
- [kanał BlueBubbles](/pl/channels/bluebubbles)
- [Szybki start Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Dokumentacja CLI Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Nienadzorowana konfiguracja VM](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (zaawansowane)
- [Izolacja Docker](/pl/install/docker) (alternatywne podejście do izolacji)
