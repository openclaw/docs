---
read_when:
    - Chcesz odizolować OpenClaw od głównego środowiska macOS
    - Chcesz integracji z iMessage (BlueBubbles) w sandboxie
    - Chcesz resetowalnego środowiska macOS, które można klonować
    - Chcesz porównać lokalne i hostowane opcje maszyn wirtualnych macOS
summary: Uruchamianie OpenClaw w sandboxowanej maszynie wirtualnej macOS (lokalnej lub hostowanej), gdy potrzebujesz izolacji lub iMessage
title: macOS VMs
x-i18n:
    generated_at: "2026-04-05T13:58:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: b1f7c5691fd2686418ee25f2c38b1f9badd511daeef2906d21ad30fb523b013f
    source_path: install/macos-vm.md
    workflow: 15
---

# OpenClaw na maszynach wirtualnych macOS (Sandboxing)

## Zalecany wybór domyślny (dla większości użytkowników)

- **Mały Linux VPS** dla stale działającego Gateway i niskiego kosztu. Zobacz [Hosting VPS](/vps).
- **Dedykowany sprzęt** (Mac mini lub komputer z Linux), jeśli chcesz pełnej kontroli i **domowego adresu IP** do automatyzacji przeglądarki. Wiele witryn blokuje adresy IP centrów danych, więc lokalne przeglądanie często działa lepiej.
- **Hybryda:** trzymaj Gateway na tanim VPS i podłącz swojego Mac jako **węzeł**, gdy potrzebujesz automatyzacji przeglądarki/UI. Zobacz [Nodes](/nodes) i [Gateway remote](/gateway/remote).

Użyj maszyny wirtualnej macOS, gdy potrzebujesz konkretnie funkcji dostępnych tylko w macOS (iMessage/BlueBubbles) albo chcesz ścisłej izolacji od swojego codziennego Maca.

## Opcje maszyn wirtualnych macOS

### Lokalna maszyna wirtualna na Apple Silicon Mac (Lume)

Uruchom OpenClaw w sandboxowanej maszynie wirtualnej macOS na istniejącym Apple Silicon Mac przy użyciu [Lume](https://cua.ai/docs/lume).

Daje to:

- Pełne środowisko macOS w izolacji (host pozostaje czysty)
- Obsługę iMessage przez BlueBubbles (niemożliwe na Linux/Windows)
- Natychmiastowy reset przez klonowanie maszyn wirtualnych
- Brak dodatkowego sprzętu lub kosztów chmurowych

### Hostowani dostawcy Maców (chmura)

Jeśli chcesz macOS w chmurze, hostowani dostawcy Maców też się sprawdzą:

- [MacStadium](https://www.macstadium.com/) (hostowane Maki)
- Inni hostowani dostawcy Maców również działają; postępuj zgodnie z ich dokumentacją VM + SSH

Gdy masz już dostęp SSH do maszyny wirtualnej macOS, przejdź do kroku 6 poniżej.

---

## Szybka ścieżka (Lume, doświadczeni użytkownicy)

1. Zainstaluj Lume
2. `lume create openclaw --os macos --ipsw latest`
3. Ukończ Setup Assistant, włącz Remote Login (SSH)
4. `lume run openclaw --no-display`
5. Połącz się przez SSH, zainstaluj OpenClaw, skonfiguruj kanały
6. Gotowe

---

## Czego potrzebujesz (Lume)

- Apple Silicon Mac (M1/M2/M3/M4)
- macOS Sequoia lub nowszy na hoście
- Około 60 GB wolnego miejsca na dysku na każdą maszynę wirtualną
- Około 20 minut

---

## 1) Zainstaluj Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Jeśli `~/.local/bin` nie znajduje się w Twoim PATH:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Weryfikacja:

```bash
lume --version
```

Dokumentacja: [Lume Installation](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) Utwórz maszynę wirtualną macOS

```bash
lume create openclaw --os macos --ipsw latest
```

To pobiera macOS i tworzy maszynę wirtualną. Okno VNC otwiera się automatycznie.

Uwaga: pobieranie może zająć trochę czasu w zależności od połączenia.

---

## 3) Ukończ Setup Assistant

W oknie VNC:

1. Wybierz język i region
2. Pomiń Apple ID (lub zaloguj się, jeśli później chcesz iMessage)
3. Utwórz konto użytkownika (zapamiętaj nazwę użytkownika i hasło)
4. Pomiń wszystkie funkcje opcjonalne

Po zakończeniu konfiguracji włącz SSH:

1. Otwórz System Settings → General → Sharing
2. Włącz „Remote Login”

---

## 4) Pobierz adres IP maszyny wirtualnej

```bash
lume get openclaw
```

Szukaj adresu IP (zwykle `192.168.64.x`).

---

## 5) Połącz się z maszyną wirtualną przez SSH

```bash
ssh youruser@192.168.64.X
```

Zastąp `youruser` utworzonym kontem, a adres IP adresem swojej maszyny wirtualnej.

---

## 6) Zainstaluj OpenClaw

Wewnątrz maszyny wirtualnej:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Postępuj zgodnie z monitami onboardingu, aby skonfigurować dostawcę modelu (Anthropic, OpenAI itp.).

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

Maszyna wirtualna działa w tle. Demon OpenClaw utrzymuje działający gateway.

Aby sprawdzić stan:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Bonus: integracja z iMessage

To kluczowa funkcja uruchamiania na macOS. Użyj [BlueBubbles](https://bluebubbles.app), aby dodać iMessage do OpenClaw.

Wewnątrz maszyny wirtualnej:

1. Pobierz BlueBubbles z bluebubbles.app
2. Zaloguj się przy użyciu Apple ID
3. Włącz Web API i ustaw hasło
4. Skieruj webhooki BlueBubbles do swojego gateway (przykład: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

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

Uruchom ponownie gateway. Teraz agent może wysyłać i odbierać wiadomości iMessage.

Pełne szczegóły konfiguracji: [Kanał BlueBubbles](/pl/channels/bluebubbles)

---

## Zapisz złoty obraz

Zanim przejdziesz do dalszej personalizacji, zrób migawkę czystego stanu:

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

- trzymanie Maca podłączonego do zasilania
- wyłączenie usypiania w System Settings → Energy Saver
- użycie `caffeinate`, jeśli to potrzebne

Aby uzyskać prawdziwe działanie zawsze włączone, rozważ dedykowany Mac mini albo mały VPS. Zobacz [Hosting VPS](/vps).

---

## Rozwiązywanie problemów

| Problem                  | Rozwiązanie                                                                        |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Nie można połączyć się przez SSH z maszyną wirtualną | Sprawdź, czy „Remote Login” jest włączone w System Settings maszyny wirtualnej |
| Adres IP maszyny wirtualnej się nie pokazuje | Poczekaj, aż maszyna wirtualna w pełni się uruchomi, i ponownie uruchom `lume get openclaw` |
| Polecenie `lume` nie zostało znalezione | Dodaj `~/.local/bin` do swojego PATH                                              |
| Kod QR WhatsApp się nie skanuje | Upewnij się, że przy uruchamianiu `openclaw channels login` jesteś zalogowany do maszyny wirtualnej (a nie hosta) |

---

## Powiązane dokumenty

- [Hosting VPS](/vps)
- [Nodes](/nodes)
- [Gateway remote](/gateway/remote)
- [Kanał BlueBubbles](/pl/channels/bluebubbles)
- [Lume Quickstart](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI Reference](https://cua.ai/docs/lume/reference/cli-reference)
- [Unattended VM Setup](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (zaawansowane)
- [Docker Sandboxing](/install/docker) (alternatywne podejście do izolacji)
