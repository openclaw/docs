---
read_when:
    - Chcesz odizolować OpenClaw od głównego środowiska macOS
    - Chcesz integracji z iMessage w środowisku izolowanym
    - Chcesz mieć resetowalne środowisko macOS, które możesz klonować
    - Chcesz porównać opcje lokalnych i hostowanych maszyn wirtualnych macOS
summary: Uruchamiaj OpenClaw w odizolowanej maszynie wirtualnej macOS (lokalnej lub hostowanej), gdy potrzebujesz izolacji lub iMessage
title: Maszyny wirtualne macOS
x-i18n:
    generated_at: "2026-05-10T19:42:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3502ccaee51261573764440f9e782d2512e9da0332bd15eef3a5c4a83b0c2936
    source_path: install/macos-vm.md
    workflow: 16
---

## Zalecana opcja domyślna (większość użytkowników)

- **Mały VPS z Linuksem** dla stale działającego Gateway i niskich kosztów. Zobacz [hosting VPS](/pl/vps).
- **Dedykowany sprzęt** (Mac mini lub komputer z Linuksem), jeśli chcesz mieć pełną kontrolę i **adres IP sieci domowej** do automatyzacji przeglądarki. Wiele witryn blokuje adresy IP centrów danych, więc lokalne przeglądanie często działa lepiej.
- **Hybrydowo:** trzymaj Gateway na tanim VPS, a swojego Maca podłączaj jako **Node**, gdy potrzebujesz automatyzacji przeglądarki/interfejsu użytkownika. Zobacz [Node’y](/pl/nodes) i [zdalny Gateway](/pl/gateway/remote).

Użyj maszyny wirtualnej macOS, gdy konkretnie potrzebujesz funkcji dostępnych tylko w macOS, takich jak iMessage, albo chcesz ścisłej izolacji od swojego codziennego Maca.

## Opcje maszyn wirtualnych macOS

### Lokalna maszyna wirtualna na Macu z Apple Silicon (Lume)

Uruchom OpenClaw w izolowanej maszynie wirtualnej macOS na swoim obecnym Macu z Apple Silicon, używając [Lume](https://cua.ai/docs/lume).

Daje to:

- Pełne środowisko macOS w izolacji (host pozostaje czysty)
- Obsługę iMessage przez `imsg` (domyślna lokalna ścieżka jest niemożliwa w Linuksie/Windows)
- Natychmiastowy reset przez klonowanie maszyn wirtualnych
- Brak dodatkowego sprzętu lub kosztów chmury

### Dostawcy hostowanych Maców (chmura)

Jeśli chcesz macOS w chmurze, dostawcy hostowanych Maców też się sprawdzą:

- [MacStadium](https://www.macstadium.com/) (hostowane Maki)
- Inni dostawcy hostowanych Maców również działają; postępuj zgodnie z ich dokumentacją VM + SSH

Gdy masz dostęp SSH do maszyny wirtualnej macOS, przejdź do kroku 6 poniżej.

---

## Szybka ścieżka (Lume, doświadczeni użytkownicy)

1. Zainstaluj Lume
2. `lume create openclaw --os macos --ipsw latest`
3. Ukończ Asystenta konfiguracji, włącz Zdalne logowanie (SSH)
4. `lume run openclaw --no-display`
5. Zaloguj się przez SSH, zainstaluj OpenClaw, skonfiguruj kanały
6. Gotowe

---

## Czego potrzebujesz (Lume)

- Mac z Apple Silicon (M1/M2/M3/M4)
- macOS Sequoia lub nowszy na hoście
- ~60 GB wolnego miejsca na dysku na każdą maszynę wirtualną
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
Pobieranie może chwilę potrwać, zależnie od Twojego połączenia.
</Note>

---

## 3) Ukończ Asystenta konfiguracji

W oknie VNC:

1. Wybierz język i region
2. Pomiń Apple ID (lub zaloguj się, jeśli później chcesz używać iMessage)
3. Utwórz konto użytkownika (zapamiętaj nazwę użytkownika i hasło)
4. Pomiń wszystkie funkcje opcjonalne

Po zakończeniu konfiguracji włącz SSH:

1. Otwórz Ustawienia systemowe → Ogólne → Udostępnianie
2. Włącz „Zdalne logowanie”

---

## 4) Uzyskaj adres IP maszyny wirtualnej

```bash
lume get openclaw
```

Poszukaj adresu IP (zwykle `192.168.64.x`).

---

## 5) Połącz się z maszyną wirtualną przez SSH

```bash
ssh youruser@192.168.64.X
```

Zastąp `youruser` utworzonym kontem, a adres IP adresem IP swojej maszyny wirtualnej.

---

## 6) Zainstaluj OpenClaw

Wewnątrz maszyny wirtualnej:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Postępuj zgodnie z monitami wdrażania, aby skonfigurować swojego dostawcę modelu (Anthropic, OpenAI itd.).

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

Następnie zaloguj się do WhatsApp (zeskanuj QR):

```bash
openclaw channels login
```

---

## 8) Uruchom maszynę wirtualną bez interfejsu graficznego

Zatrzymaj maszynę wirtualną i uruchom ponownie bez wyświetlacza:

```bash
lume stop openclaw
lume run openclaw --no-display
```

Maszyna wirtualna działa w tle. Demon OpenClaw utrzymuje działanie gateway.

Aby sprawdzić status:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Bonus: integracja z iMessage

To najważniejsza zaleta działania na macOS. Użyj [iMessage](/pl/channels/imessage) z `imsg`, aby dodać Wiadomości do OpenClaw.

Wewnątrz maszyny wirtualnej:

1. Zaloguj się do Wiadomości.
2. Zainstaluj `imsg`.
3. Przyznaj uprawnienia Pełny dostęp do dysku i Automatyzacja dla procesu uruchamiającego OpenClaw/`imsg`.
4. Zweryfikuj obsługę RPC za pomocą `imsg rpc --help`.

Dodaj do konfiguracji OpenClaw:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
    },
  },
}
```

Uruchom ponownie gateway. Teraz Twój agent może wysyłać i odbierać wiadomości iMessage.

Pełne szczegóły konfiguracji: [kanał iMessage](/pl/channels/imessage)

---

## Zapisz złoty obraz

Przed dalszym dostosowywaniem utwórz migawkę czystego stanu:

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

Utrzymuj maszynę wirtualną uruchomioną przez:

- Pozostawienie Maca podłączonego do zasilania
- Wyłączenie uśpienia w Ustawieniach systemowych → Oszczędzanie energii
- Użycie `caffeinate`, jeśli potrzeba

Aby uzyskać prawdziwe działanie ciągłe, rozważ dedykowanego Maca mini lub mały VPS. Zobacz [hosting VPS](/pl/vps).

---

## Rozwiązywanie problemów

| Problem                              | Rozwiązanie                                                                                              |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Nie można połączyć się z VM przez SSH | Sprawdź, czy „Zdalne logowanie” jest włączone w Ustawieniach systemowych maszyny wirtualnej              |
| Adres IP VM się nie wyświetla         | Poczekaj, aż VM w pełni się uruchomi, uruchom ponownie `lume get openclaw`                               |
| Nie znaleziono polecenia Lume         | Dodaj `~/.local/bin` do swojego PATH                                                                     |
| QR WhatsApp się nie skanuje           | Upewnij się, że jesteś zalogowany do VM (nie hosta), gdy uruchamiasz `openclaw channels login`           |

---

## Powiązana dokumentacja

- [hosting VPS](/pl/vps)
- [Node’y](/pl/nodes)
- [zdalny Gateway](/pl/gateway/remote)
- [kanał iMessage](/pl/channels/imessage)
- [Szybki start Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Dokumentacja CLI Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Nienadzorowana konfiguracja VM](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (zaawansowane)
- [Izolacja w Dockerze](/pl/install/docker) (alternatywne podejście do izolacji)
