---
read_when:
    - Chcesz odizolować OpenClaw od głównego środowiska macOS
    - Chcesz zintegrować iMessage w piaskownicy
    - Potrzebujesz środowiska macOS, które można zresetować i sklonować
    - Chcesz porównać lokalne i hostowane opcje maszyn wirtualnych z macOS
summary: Uruchamiaj OpenClaw w odizolowanej maszynie wirtualnej z macOS (lokalnej lub hostowanej), gdy potrzebujesz izolacji lub iMessage
title: Maszyny wirtualne macOS
x-i18n:
    generated_at: "2026-07-12T15:15:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e6b963faaf40f65adce1081715bc295059b8bed278a8c71a05a86e04ad7a7a5
    source_path: install/macos-vm.md
    workflow: 16
---

## Zalecana konfiguracja domyślna (dla większości użytkowników)

- **Mały VPS z systemem Linux** zapewniający stale działający Gateway przy niskich kosztach. Zobacz [Hosting na VPS](/pl/vps).
- **Dedykowany sprzęt** (Mac mini lub komputer z systemem Linux), jeśli potrzebujesz pełnej kontroli i **domowego adresu IP** do automatyzacji przeglądarki. Wiele witryn blokuje adresy IP centrów danych, dlatego lokalne przeglądanie często działa lepiej.
- **Konfiguracja hybrydowa**: utrzymuj Gateway na tanim VPS-ie, a w razie potrzeby automatyzacji przeglądarki lub interfejsu użytkownika podłączaj komputer Mac jako **Node**. Zobacz [Node’y](/pl/nodes) i [Zdalny Gateway](/pl/gateway/remote).

Używaj maszyny wirtualnej z macOS tylko wtedy, gdy potrzebujesz funkcji dostępnych wyłącznie w macOS, takich jak iMessage, albo chcesz ściśle odizolować środowisko od komputera Mac używanego na co dzień.

## Opcje maszyny wirtualnej z macOS

### Lokalna maszyna wirtualna na komputerze Mac z Apple Silicon (Lume)

Uruchom OpenClaw w odizolowanej maszynie wirtualnej z macOS na posiadanym komputerze Mac z Apple Silicon za pomocą [Lume](https://cua.ai/docs/lume). Zapewnia to:

- Pełne, odizolowane środowisko macOS (system hosta pozostaje niezmieniony)
- Obsługę iMessage za pomocą `imsg`; domyślna ścieżka lokalna jest niedostępna w systemach Linux i Windows
- Natychmiastowe przywracanie stanu przez klonowanie maszyn wirtualnych
- Brak kosztów dodatkowego sprzętu lub usług chmurowych

### Dostawcy hostowanych komputerów Mac (chmura)

Jeśli chcesz używać macOS w chmurze, możesz również skorzystać z dostawców hostowanych komputerów Mac:

- [MacStadium](https://www.macstadium.com/) (hostowane komputery Mac)
- Możesz również skorzystać z usług innych dostawców hostowanych komputerów Mac; postępuj zgodnie z ich dokumentacją dotyczącą maszyn wirtualnych i SSH

Po uzyskaniu dostępu SSH do maszyny wirtualnej z macOS przejdź do sekcji [Instalowanie OpenClaw](#6-install-openclaw) poniżej.

## Szybka konfiguracja (Lume, dla doświadczonych użytkowników)

1. Zainstaluj Lume.
2. `lume create openclaw --os macos --ipsw latest`
3. Ukończ działanie Asystenta konfiguracji i włącz Remote Login (SSH).
4. `lume run openclaw --no-display`
5. Połącz się przez SSH, zainstaluj OpenClaw i skonfiguruj kanały.
6. Gotowe.

## Wymagania (Lume)

- Komputer Mac z Apple Silicon (M1/M2/M3/M4)
- macOS Sequoia lub nowszy na hoście
- Około 60 GB wolnego miejsca na dysku na każdą maszynę wirtualną
- Około 20 minut

## 1) Instalowanie Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Jeśli `~/.local/bin` nie znajduje się w zmiennej PATH:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Sprawdź:

```bash
lume --version
```

Dokumentacja: [Instalowanie Lume](https://cua.ai/docs/lume/guide/getting-started/installation)

## 2) Tworzenie maszyny wirtualnej z macOS

```bash
lume create openclaw --os macos --ipsw latest
```

Polecenie pobiera macOS i tworzy maszynę wirtualną. Okno VNC otworzy się automatycznie.

<Note>
Pobieranie może potrwać, zależnie od szybkości połączenia.
</Note>

## 3) Ukończenie działania Asystenta konfiguracji

W oknie VNC:

1. Wybierz język i region.
2. Pomiń Apple ID (lub zaloguj się, jeśli chcesz później korzystać z iMessage).
3. Utwórz konto użytkownika (zapamiętaj nazwę użytkownika i hasło).
4. Pomiń wszystkie funkcje opcjonalne.

Po ukończeniu konfiguracji:

1. Włącz SSH: System Settings -> General -> Sharing, a następnie włącz "Remote Login".
2. Aby korzystać z maszyny wirtualnej bez interfejsu graficznego, włącz automatyczne logowanie: System Settings -> Users & Groups, wybierz "Automatically log in as:", a następnie użytkownika maszyny wirtualnej.

## 4) Uzyskiwanie adresu IP maszyny wirtualnej

```bash
lume get openclaw
```

Znajdź adres IP (zwykle `192.168.64.x`).

## 5) Łączenie z maszyną wirtualną przez SSH

```bash
ssh youruser@192.168.64.X
```

Zastąp `youruser` nazwą utworzonego konta, a adres IP — adresem IP maszyny wirtualnej.

## 6) Instalowanie OpenClaw

Wewnątrz maszyny wirtualnej:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Postępuj zgodnie z instrukcjami procesu wdrażania, aby skonfigurować dostawcę modelu (Anthropic, OpenAI itp.).

## 7) Konfigurowanie kanałów

Edytuj plik konfiguracyjny:

```bash
nano ~/.openclaw/openclaw.json
```

Dodaj kanały:

```json5
{
  channels: {
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
  },
}
```

Następnie zaloguj się do WhatsApp (zeskanuj kod QR):

```bash
openclaw channels login
```

## 8) Uruchamianie maszyny wirtualnej bez interfejsu graficznego

Zatrzymaj maszynę wirtualną i uruchom ją ponownie bez wyświetlania obrazu:

```bash
lume stop openclaw
lume run openclaw --no-display
```

Maszyna wirtualna działa w tle, a demon OpenClaw utrzymuje działanie Gateway. Aby sprawdzić stan:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

## Dodatkowo: integracja z iMessage

To najważniejsza zaleta uruchamiania systemu w macOS. Użyj [iMessage](/pl/channels/imessage) wraz z `imsg`, aby dodać aplikację Wiadomości do OpenClaw.

Wewnątrz maszyny wirtualnej:

1. Zaloguj się w aplikacji Wiadomości.
2. Zainstaluj `imsg`.
3. Przyznaj pełny dostęp do dysku oraz uprawnienie do automatyzacji procesowi uruchamiającemu OpenClaw/`imsg`.
4. Sprawdź obsługę RPC za pomocą `imsg rpc --help`.

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

Uruchom ponownie Gateway. Agent może teraz wysyłać i odbierać wiadomości iMessage. Pełne informacje o konfiguracji: [Kanał iMessage](/pl/channels/imessage).

## Zapisywanie obrazu bazowego

Przed dalszym dostosowywaniem utwórz migawkę czystego stanu:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

Przywracanie w dowolnym momencie:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

## Działanie przez całą dobę

Aby maszyna wirtualna działała nieprzerwanie:

- Pozostaw komputer Mac podłączony do zasilania
- Wyłącz usypianie w System Settings -> Energy Saver
- W razie potrzeby użyj `caffeinate`

Jeśli potrzebujesz rzeczywiście nieprzerwanego działania, rozważ dedykowanego Maca mini lub mały VPS. Zobacz [Hosting na VPS](/pl/vps).

## Rozwiązywanie problemów

| Problem                              | Rozwiązanie                                                                                                           |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Nie można połączyć się z maszyną wirtualną przez SSH | Sprawdź, czy "Remote Login" jest włączone w System Settings maszyny wirtualnej                         |
| Adres IP maszyny wirtualnej nie jest wyświetlany     | Poczekaj na pełne uruchomienie maszyny wirtualnej, a następnie ponownie uruchom `lume get openclaw`     |
| Nie znaleziono polecenia Lume                          | Dodaj `~/.local/bin` do zmiennej PATH                                                                   |
| Nie można zeskanować kodu QR WhatsApp                  | Podczas uruchamiania `openclaw channels login` upewnij się, że jesteś zalogowany w maszynie wirtualnej, a nie w systemie hosta |

## Powiązana dokumentacja

- [Hosting na VPS](/pl/vps)
- [Node’y](/pl/nodes)
- [Zdalny Gateway](/pl/gateway/remote)
- [Kanał iMessage](/pl/channels/imessage)
- [Szybki start z Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Dokumentacja CLI Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Konfiguracja nienadzorowanej maszyny wirtualnej](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (dla zaawansowanych)
- [Izolacja za pomocą Dockera](/pl/install/docker) (alternatywny sposób izolacji)
