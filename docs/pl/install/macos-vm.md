---
read_when:
    - Chcesz odizolować OpenClaw od głównego środowiska macOS
    - Chcesz integracji z iMessage w piaskownicy
    - Chcesz resetowalnego środowiska macOS, które można klonować
    - Chcesz porównać lokalne i hostowane opcje maszyn wirtualnych macOS
summary: Uruchom OpenClaw w izolowanej maszynie wirtualnej macOS (lokalnej lub hostowanej), gdy potrzebujesz izolacji albo iMessage
title: Maszyny wirtualne macOS
x-i18n:
    generated_at: "2026-06-27T17:43:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aee2fa0651b711f29d7d092da931bd924bc8ce8a5ca389cf8f189725fa586f3f
    source_path: install/macos-vm.md
    workflow: 16
---

## Zalecane ustawienie domyślne (większość użytkowników)

- **Mały VPS z Linuksem** dla zawsze włączonego Gateway i niskich kosztów. Zobacz [hosting VPS](/pl/vps).
- **Dedykowany sprzęt** (Mac mini lub komputer z Linuksem), jeśli chcesz mieć pełną kontrolę i **domowy adres IP** do automatyzacji przeglądarki. Wiele witryn blokuje adresy IP centrów danych, więc lokalne przeglądanie często działa lepiej.
- **Hybryda:** utrzymuj Gateway na tanim VPS, a Maca podłączaj jako **node**, gdy potrzebujesz automatyzacji przeglądarki/interfejsu. Zobacz [Nodes](/pl/nodes) i [zdalny Gateway](/pl/gateway/remote).

Użyj maszyny wirtualnej macOS, gdy konkretnie potrzebujesz funkcji dostępnych tylko w macOS, takich jak iMessage, albo chcesz ścisłej izolacji od swojego codziennego Maca.

## Opcje maszyn wirtualnych macOS

### Lokalna maszyna wirtualna na Macu z Apple Silicon (Lume)

Uruchom OpenClaw w odizolowanej maszynie wirtualnej macOS na swoim obecnym Macu z Apple Silicon za pomocą [Lume](https://cua.ai/docs/lume).

Daje to:

- Pełne środowisko macOS w izolacji (host pozostaje czysty)
- Obsługę iMessage przez `imsg` (domyślna ścieżka lokalna jest niemożliwa w Linuksie/Windows)
- Natychmiastowe resetowanie przez klonowanie maszyn wirtualnych
- Brak dodatkowego sprzętu lub kosztów chmury

### Hostowani dostawcy Maców (chmura)

Jeśli chcesz macOS w chmurze, hostowani dostawcy Maców też działają:

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

Jeśli `~/.local/bin` nie znajduje się w PATH:

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
Pobieranie może trochę potrwać w zależności od połączenia.
</Note>

---

## 3) Ukończ Asystenta konfiguracji

W oknie VNC:

1. Wybierz język i region
2. Pomiń Apple ID (albo zaloguj się, jeśli później chcesz używać iMessage)
3. Utwórz konto użytkownika (zapamiętaj nazwę użytkownika i hasło)
4. Pomiń wszystkie funkcje opcjonalne

Po zakończeniu konfiguracji:

1. Włącz SSH: otwórz Ustawienia systemowe -> Ogólne -> Udostępnianie i włącz „Zdalne logowanie”.
2. Do używania maszyny wirtualnej bez interfejsu włącz automatyczne logowanie: otwórz Ustawienia systemowe -> Użytkownicy i grupy, wybierz „Automatycznie loguj jako:” i wybierz użytkownika maszyny wirtualnej.

---

## 4) Pobierz adres IP maszyny wirtualnej

```bash
lume get openclaw
```

Znajdź adres IP (zwykle `192.168.64.x`).

---

## 5) Zaloguj się do maszyny wirtualnej przez SSH

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

Postępuj zgodnie z monitami onboardingu, aby skonfigurować dostawcę modelu (Anthropic, OpenAI itd.).

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

## 8) Uruchom maszynę wirtualną bez interfejsu

Zatrzymaj maszynę wirtualną i uruchom ponownie bez ekranu:

```bash
lume stop openclaw
lume run openclaw --no-display
```

Maszyna wirtualna działa w tle. Daemon OpenClaw utrzymuje działanie Gateway.

Aby sprawdzić status:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Bonus: integracja iMessage

To najważniejsza zaleta uruchamiania na macOS. Użyj [iMessage](/pl/channels/imessage) z `imsg`, aby dodać Wiadomości do OpenClaw.

Wewnątrz maszyny wirtualnej:

1. Zaloguj się do Wiadomości.
2. Zainstaluj `imsg`.
3. Przyznaj Pełny dostęp do dysku oraz uprawnienie Automatyzacja dla procesu uruchamiającego OpenClaw/`imsg`.
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

Uruchom ponownie Gateway. Teraz agent może wysyłać i odbierać wiadomości iMessage.

Pełne szczegóły konfiguracji: [kanał iMessage](/pl/channels/imessage)

---

## Zapisz złoty obraz

Przed dalszym dostosowywaniem zrób migawkę czystego stanu:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

Zresetuj w dowolnym momencie:

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

Do prawdziwej pracy zawsze włączonej rozważ dedykowanego Maca mini lub mały VPS. Zobacz [hosting VPS](/pl/vps).

---

## Rozwiązywanie problemów

| Problem                       | Rozwiązanie                                                                                     |
| ----------------------------- | ----------------------------------------------------------------------------------------------- |
| Nie można połączyć się z VM przez SSH | Sprawdź, czy „Zdalne logowanie” jest włączone w Ustawieniach systemowych VM                     |
| Adres IP VM się nie wyświetla | Poczekaj, aż VM w pełni się uruchomi, i ponownie uruchom `lume get openclaw`                    |
| Nie znaleziono polecenia Lume | Dodaj `~/.local/bin` do PATH                                                                    |
| QR WhatsApp się nie skanuje   | Upewnij się, że jesteś zalogowany w VM (nie na hoście), gdy uruchamiasz `openclaw channels login` |

---

## Powiązana dokumentacja

- [hosting VPS](/pl/vps)
- [Nodes](/pl/nodes)
- [zdalny Gateway](/pl/gateway/remote)
- [kanał iMessage](/pl/channels/imessage)
- [Szybki start Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Dokumentacja referencyjna CLI Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Konfiguracja VM bez nadzoru](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (zaawansowane)
- [Izolacja w Dockerze](/pl/install/docker) (alternatywne podejście do izolacji)
