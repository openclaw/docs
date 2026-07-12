---
read_when:
    - Przenosisz OpenClaw na nowy laptop lub serwer
    - Przechodzisz z innego systemu agentowego i chcesz zachować stan
    - Aktualizujesz Plugin w miejscu
summary: 'Centrum migracji: importy między systemami, przenoszenie między urządzeniami i aktualizacje pluginów'
title: Przewodnik migracji
x-i18n:
    generated_at: "2026-07-12T15:15:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c7961f78bc654d328cb91a6ef982b6e47740fd831aec9249c8ffed3225dd0ccf
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw obsługuje trzy ścieżki migracji: import z innego systemu agentowego, przeniesienie istniejącej instalacji na nową maszynę oraz uaktualnienie pluginu w miejscu.

## Import z innego systemu agentowego

Wbudowani dostawcy migracji przenoszą do OpenClaw instrukcje, serwery MCP, Skills, konfigurację modeli oraz — opcjonalnie — klucze API. Plany są wyświetlane do wglądu przed wprowadzeniem jakichkolwiek zmian, sekrety są utajniane w raportach, a zastosowanie zmian jest zabezpieczone zweryfikowaną kopią zapasową.

<CardGroup cols={2}>
  <Card title="Migracja z Claude" href="/pl/install/migrating-claude" icon="brain">
    Importuj stan Claude Code i Claude Desktop, w tym `CLAUDE.md`, serwery MCP, Skills oraz polecenia projektowe.
  </Card>
  <Card title="Migracja z Hermes" href="/pl/install/migrating-hermes" icon="feather">
    Importuj konfigurację Hermes, dostawców, serwery MCP, pamięć, Skills oraz obsługiwane klucze `.env`.
  </Card>
</CardGroup>

Punktem wejścia CLI jest [`openclaw migrate`](/pl/cli/migrate). Proces wdrażania może również zaproponować migrację po wykryciu znanego źródła (`openclaw onboard --flow import`).

## Przenoszenie OpenClaw na nową maszynę

Skopiuj **katalog stanu** (domyślnie `~/.openclaw/`) oraz swój **obszar roboczy**, aby zachować:

- **Konfigurację** — plik `openclaw.json` i wszystkie ustawienia Gateway.
- **Uwierzytelnianie** — plik `auth-profiles.json` każdego agenta (klucze API i OAuth) oraz wszelkie dane stanu kanałów lub dostawców w katalogu `credentials/`.
- **Sesje** — historię rozmów i stan agentów.
- **Stan kanałów** — dane logowania WhatsApp, sesję Telegram i podobne dane.
- **Pliki obszaru roboczego** — `MEMORY.md`, `USER.md`, Skills oraz prompty.

<Tip>
Uruchom `openclaw status` na starej maszynie, aby potwierdzić ścieżkę katalogu stanu. Profile niestandardowe używają katalogu `~/.openclaw-<profile>/` lub ścieżki ustawionej za pomocą `OPENCLAW_STATE_DIR`.
</Tip>

### Kroki migracji

<Steps>
  <Step title="Zatrzymaj Gateway i utwórz kopię zapasową">
    Na **starej** maszynie zatrzymaj Gateway, aby pliki nie zmieniały się podczas kopiowania, a następnie utwórz archiwum:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Jeśli używasz wielu profili (na przykład `~/.openclaw-work`), zarchiwizuj każdy z nich osobno.

  </Step>

  <Step title="Zainstaluj OpenClaw na nowej maszynie">
    [Zainstaluj](/pl/install) CLI (oraz Node, jeśli jest potrzebny) na nowej maszynie. Nie szkodzi, jeśli proces wdrażania utworzy nowy katalog `~/.openclaw/` — zostanie on zastąpiony w następnym kroku.
  </Step>

  <Step title="Skopiuj katalog stanu i obszar roboczy">
    Przenieś archiwum za pomocą `scp`, `rsync -a` lub dysku zewnętrznego, a następnie je rozpakuj:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Upewnij się, że uwzględniono ukryte katalogi, a właścicielem plików jest użytkownik, który będzie uruchamiać Gateway.

  </Step>

  <Step title="Uruchom narzędzie diagnostyczne i przeprowadź weryfikację">
    Na nowej maszynie uruchom [narzędzie diagnostyczne](/pl/gateway/doctor), aby zastosować migracje konfiguracji i naprawić usługi:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

Jeśli Telegram lub Discord korzysta z domyślnego mechanizmu awaryjnego opartego na zmiennych środowiskowych (`TELEGRAM_BOT_TOKEN` lub `DISCORD_BOT_TOKEN`), sprawdź bez wyświetlania wartości sekretów, czy przeniesiony plik `.env` w katalogu stanu zawiera te klucze:

```bash
awk -F= '/^(TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN)=/ { print $1 "=present" }' ~/.openclaw/.env
```

Polecenie `openclaw doctor` ostrzega również, gdy włączone domyślne konto Telegram lub Discord nie ma skonfigurowanego tokenu, a odpowiadająca mu zmienna środowiskowa jest niedostępna dla procesu diagnostycznego.

### Typowe pułapki

<AccordionGroup>
  <Accordion title="Niezgodność profilu lub katalogu stanu">
    Jeśli stary Gateway używał `--profile` lub `OPENCLAW_STATE_DIR`, a nowy ich nie używa, kanały będą wyglądać na wylogowane, a sesje będą puste. Uruchom Gateway z **tym samym** profilem lub katalogiem stanu, który został przeniesiony, a następnie ponownie uruchom `openclaw doctor`.
  </Accordion>

  <Accordion title="Kopiowanie tylko pliku openclaw.json">
    Sam plik konfiguracyjny nie wystarczy. Profile uwierzytelniania modeli znajdują się w `agents/<agentId>/agent/auth-profiles.json`, a stan kanałów i dostawców znajduje się w `credentials/`. Zawsze przenoś **cały** katalog stanu.
  </Accordion>

  <Accordion title="Uprawnienia i własność">
    Jeśli pliki skopiowano jako użytkownik root lub zmieniono użytkownika, Gateway może nie być w stanie odczytać danych uwierzytelniających. Upewnij się, że katalog stanu i obszar roboczy należą do użytkownika uruchamiającego Gateway.
  </Accordion>

  <Accordion title="Tryb zdalny">
    Jeśli interfejs użytkownika wskazuje **zdalny** Gateway, to host zdalny przechowuje sesje i obszar roboczy. Przenieś sam host Gateway, a nie lokalny laptop. Zobacz [często zadawane pytania](/pl/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Sekrety w kopiach zapasowych">
    Katalog stanu zawiera profile uwierzytelniania, dane uwierzytelniające kanałów oraz inne dane stanu dostawców. Przechowuj kopie zapasowe w postaci zaszyfrowanej, unikaj niezabezpieczonych kanałów przesyłania i zmień klucze, jeśli podejrzewasz ich ujawnienie.
  </Accordion>
</AccordionGroup>

### Lista kontrolna weryfikacji

Na nowej maszynie potwierdź, że:

- [ ] `openclaw status` pokazuje, że Gateway działa.
- [ ] Kanały są nadal połączone (ponowne parowanie nie jest potrzebne).
- [ ] Panel otwiera się i wyświetla istniejące sesje.
- [ ] Pliki obszaru roboczego (pamięć, konfiguracje) są dostępne.

## Uaktualnianie pluginu w miejscu

Uaktualnienia pluginu w miejscu zachowują ten sam identyfikator pluginu i klucze konfiguracji, ale mogą przenieść stan zapisany na dysku do bieżącego układu. Instrukcje uaktualniania poszczególnych pluginów znajdują się obok dokumentacji ich kanałów:

- [Migracja Matrix](/pl/channels/matrix-migration): ograniczenia odzyskiwania zaszyfrowanego stanu, automatyczne tworzenie migawek oraz polecenia ręcznego odzyskiwania.

## Powiązane materiały

- [`openclaw migrate`](/pl/cli/migrate): dokumentacja CLI dotycząca importu między systemami.
- [Omówienie instalacji](/pl/install): wszystkie metody instalacji.
- [Narzędzie diagnostyczne](/pl/gateway/doctor): kontrola stanu po migracji.
- [Odinstalowywanie](/pl/install/uninstall): prawidłowe usuwanie OpenClaw.
