---
read_when:
    - Chcesz odizolować OpenClaw od głównego środowiska macOS
    - Chcesz integracji z iMessage (BlueBubbles) w piaskownicy
    - Potrzebujesz resetowalnego środowiska macOS, które możesz klonować
    - Chcesz porównać lokalne i hostowane opcje maszyn wirtualnych macOS
summary: Uruchom OpenClaw w izolowanej maszynie wirtualnej macOS (lokalnej lub hostowanej), gdy potrzebujesz izolacji albo iMessage
title: Maszyny wirtualne macOS
x-i18n:
    generated_at: "2026-04-30T10:01:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49cd3d420db02bcdb80378c3a91a1c1243e7be2012525c31de1dd49db397d560
    source_path: install/macos-vm.md
    workflow: 16
---

# OpenClaw na maszynach wirtualnych macOS (piaskownica)

## Zalecana opcja domyślna (większość użytkowników)

- **Mały VPS z Linuksem** dla stale działającego Gateway i niskich kosztów. Zobacz [hosting VPS](/pl/vps).
- **Dedykowany sprzęt** (Mac mini albo komputer z Linuksem), jeśli chcesz mieć pełną kontrolę i **mieszkaniowy adres IP** do automatyzacji przeglądarki. Wiele witryn blokuje adresy IP centrów danych, więc lokalne przeglądanie często działa lepiej.
- **Hybryda:** utrzymuj Gateway na tanim VPS, a Maca podłączaj jako **Node**, gdy potrzebujesz automatyzacji przeglądarki/interfejsu użytkownika. Zobacz [Nodes](/pl/nodes) i [zdalny Gateway](/pl/gateway/remote).

Użyj maszyny wirtualnej macOS, gdy konkretnie potrzebujesz funkcji dostępnych tylko w macOS (iMessage/BlueBubbles) albo chcesz ścisłej izolacji od codziennego Maca.

## Opcje maszyn wirtualnych macOS

### Lokalna maszyna wirtualna na Macu z Apple Silicon (Lume)

Uruchom OpenClaw w odizolowanej maszynie wirtualnej macOS na swoim obecnym Macu z Apple Silicon, używając [Lume](https://cua.ai/docs/lume).

Daje to:

- Pełne środowisko macOS w izolacji (system gospodarza pozostaje czysty)
- Obsługę iMessage przez BlueBubbles (niemożliwą w Linuksie/Windowsie)
- Natychmiastowy reset przez klonowanie maszyn wirtualnych
- Brak dodatkowego sprzętu lub kosztów chmury

### Hostowani dostawcy Maców (chmura)

Jeśli chcesz używać macOS w chmurze, hostowani dostawcy Maców też działają:

- [MacStadium](https://www.macstadium.com/) (hostowane Maki)
- Inni dostawcy hostowanych Maców również działają; postępuj zgodnie z ich dokumentacją dotyczącą VM + SSH

Gdy masz już dostęp SSH do maszyny wirtualnej macOS, przejdź do kroku 6 poniżej.

---

## Szybka ścieżka (Lume, doświadczeni użytkownicy)

1. Zainstaluj Lume
2. `lume create openclaw --os macos --ipsw latest`
3. Dokończ Asystenta konfiguracji, włącz zdalne logowanie (SSH)
4. `lume run openclaw --no-display`
5. Zaloguj się przez SSH, zainstaluj OpenClaw, skonfiguruj kanały
6. Gotowe

---

## Czego potrzebujesz (Lume)

- Mac z Apple Silicon (M1/M2/M3/M4)
- macOS Sequoia lub nowszy na systemie gospodarza
- ~60 GB wolnego miejsca na dysku na każdą maszynę wirtualną
- ~20 minut

---

## 1) Zainstaluj Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Jeśli `~/.local/bin` nie jest w Twojej zmiennej PATH:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Zweryfikuj:

```bash
lume --version
```

Dokumentacja: [Instalacja Lume](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) Utwórz maszynę wirtualną macOS

```bash
lume create openclaw --os macos --ipsw latest
```

To pobiera macOS i tworzy maszynę wirtualną. Okno VNC otwiera się automatycznie.

<Note>
Pobieranie może trochę potrwać, zależnie od połączenia.
</Note>

---

## 3) Dokończ Asystenta konfiguracji

W oknie VNC:

1. Wybierz język i region
2. Pomiń Apple ID (albo zaloguj się, jeśli później chcesz używać iMessage)
3. Utwórz konto użytkownika (zapamiętaj nazwę użytkownika i hasło)
4. Pomiń wszystkie opcjonalne funkcje

Po zakończeniu konfiguracji włącz SSH:

1. Otwórz Ustawienia systemowe → Ogólne → Udostępnianie
2. Włącz „Zdalne logowanie”

---

## 4) Pobierz adres IP maszyny wirtualnej

```bash
lume get openclaw
```

Poszukaj adresu IP (zwykle `192.168.64.x`).

---

## 5) Połącz się z maszyną wirtualną przez SSH

```bash
ssh youruser@192.168.64.X
```

Zastąp `youruser` nazwą utworzonego konta, a adres IP adresem IP swojej maszyny wirtualnej.

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

Edytuj plik konfiguracyjny:

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

Następnie zaloguj się do WhatsApp (zeskanuj kod QR):

```bash
openclaw channels login
```

---

## 8) Uruchom maszynę wirtualną bez interfejsu graficznego

Zatrzymaj maszynę wirtualną i uruchom ją ponownie bez wyświetlania:

```bash
lume stop openclaw
lume run openclaw --no-display
```

Maszyna wirtualna działa w tle. Demon OpenClaw utrzymuje działanie Gateway.

Aby sprawdzić status:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Bonus: integracja z iMessage

To największa zaleta uruchamiania na macOS. Użyj [BlueBubbles](https://bluebubbles.app), aby dodać iMessage do OpenClaw.

Wewnątrz maszyny wirtualnej:

1. Pobierz BlueBubbles z bluebubbles.app
2. Zaloguj się swoim Apple ID
3. Włącz Web API i ustaw hasło
4. Skieruj Webhook BlueBubbles na swój Gateway (przykład: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

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

Uruchom ponownie Gateway. Teraz Twój agent może wysyłać i odbierać wiadomości iMessage.

Pełne szczegóły konfiguracji: [kanał BlueBubbles](/pl/channels/bluebubbles)

---

## Zapisz wzorcowy obraz

Przed dalszą personalizacją zrób migawkę czystego stanu:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

Resetuj w dowolnym momencie:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## Działanie 24/7

Utrzymuj działanie maszyny wirtualnej przez:

- Pozostawienie Maca podłączonego do zasilania
- Wyłączenie usypiania w Ustawieniach systemowych → Oszczędzanie energii
- Użycie `caffeinate`, jeśli potrzeba

Aby uzyskać prawdziwie stale działające środowisko, rozważ dedykowanego Maca mini albo mały VPS. Zobacz [hosting VPS](/pl/vps).

---

## Rozwiązywanie problemów

| Problem                         | Rozwiązanie                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| Nie można połączyć się z VM przez SSH | Sprawdź, czy „Zdalne logowanie” jest włączone w Ustawieniach systemowych VM              |
| Adres IP VM się nie wyświetla   | Poczekaj, aż VM w pełni się uruchomi, i ponownie uruchom `lume get openclaw`              |
| Nie znaleziono polecenia Lume   | Dodaj `~/.local/bin` do swojej zmiennej PATH                                              |
| Kod QR WhatsApp się nie skanuje | Upewnij się, że jesteś zalogowany w VM (nie w systemie gospodarza), gdy uruchamiasz `openclaw channels login` |

---

## Powiązana dokumentacja

- [hosting VPS](/pl/vps)
- [Nodes](/pl/nodes)
- [zdalny Gateway](/pl/gateway/remote)
- [kanał BlueBubbles](/pl/channels/bluebubbles)
- [Szybki start Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Dokumentacja CLI Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Nienadzorowana konfiguracja VM](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (zaawansowane)
- [Piaskownica Dockera](/pl/install/docker) (alternatywne podejście do izolacji)
