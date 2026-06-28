---
read_when:
    - Przenosisz OpenClaw na nowy laptop lub serwer
    - Przechodzisz z innego systemu agentów i chcesz zachować stan
    - Aktualizujesz Plugin w miejscu
summary: 'Centrum migracji: importy między systemami, przenoszenie między maszynami i aktualizacje Plugin'
title: Przewodnik migracji
x-i18n:
    generated_at: "2026-05-02T09:55:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: e447e38cf0086603a7b30ee5204e63cc8227ebc7a56add26d06ac2798a23e26f
    source_path: install/migrating.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw obsługuje trzy ścieżki migracji: import z innego systemu agentów, przeniesienie istniejącej instalacji na nową maszynę oraz uaktualnienie Plugin na miejscu.

## Import z innego systemu agentów

Użyj dołączonych dostawców migracji, aby przenieść instrukcje, serwery MCP, umiejętności, konfigurację modelu oraz (opcjonalnie) klucze API do OpenClaw. Plany są wyświetlane do podglądu przed jakąkolwiek zmianą, sekrety są redagowane w raportach, a zastosowanie zmian jest zabezpieczone zweryfikowaną kopią zapasową.

<CardGroup cols={2}>
  <Card title="Migracja z Claude" href="/pl/install/migrating-claude" icon="brain">
    Importuj stan Claude Code i Claude Desktop, w tym `CLAUDE.md`, serwery MCP, umiejętności oraz polecenia projektowe.
  </Card>
  <Card title="Migracja z Hermes" href="/pl/install/migrating-hermes" icon="feather">
    Importuj konfigurację Hermes, dostawców, serwery MCP, pamięć, umiejętności oraz obsługiwane klucze `.env`.
  </Card>
</CardGroup>

Punkt wejścia CLI to [`openclaw migrate`](/pl/cli/migrate). Onboarding może również zaproponować migrację, gdy wykryje znane źródło (`openclaw onboard --flow import`).

## Przenieś OpenClaw na nową maszynę

Skopiuj **katalog stanu** (domyślnie `~/.openclaw/`) oraz swój **obszar roboczy**, aby zachować:

- **Konfigurację** — `openclaw.json` i wszystkie ustawienia Gateway.
- **Uwierzytelnianie** — profile `auth-profiles.json` dla poszczególnych agentów (klucze API oraz OAuth), a także każdy stan kanału lub dostawcy w `credentials/`.
- **Sesje** — historię rozmów i stan agenta.
- **Stan kanałów** — logowanie WhatsApp, sesję Telegram i podobne.
- **Pliki obszaru roboczego** — `MEMORY.md`, `USER.md`, umiejętności i prompty.

<Tip>
Uruchom `openclaw status` na starej maszynie, aby potwierdzić ścieżkę katalogu stanu. Profile niestandardowe używają `~/.openclaw-<profile>/` albo ścieżki ustawionej przez `OPENCLAW_STATE_DIR`.
</Tip>

### Kroki migracji

<Steps>
  <Step title="Zatrzymaj gateway i wykonaj kopię zapasową">
    Na **starej** maszynie zatrzymaj gateway, aby pliki nie zmieniały się w trakcie kopiowania, a następnie utwórz archiwum:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Jeśli używasz wielu profili (na przykład `~/.openclaw-work`), zarchiwizuj każdy osobno.

  </Step>

  <Step title="Zainstaluj OpenClaw na nowej maszynie">
    [Zainstaluj](/pl/install) CLI (i Node, jeśli jest potrzebny) na nowej maszynie. Nie szkodzi, jeśli onboarding utworzy świeży katalog `~/.openclaw/`. Nadpiszesz go w następnym kroku.
  </Step>

  <Step title="Skopiuj katalog stanu i obszar roboczy">
    Przenieś archiwum przez `scp`, `rsync -a` albo dysk zewnętrzny, a następnie je rozpakuj:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Upewnij się, że katalogi ukryte zostały uwzględnione, a właściciel plików odpowiada użytkownikowi, który będzie uruchamiał gateway.

  </Step>

  <Step title="Uruchom doctor i zweryfikuj">
    Na nowej maszynie uruchom [Doctor](/pl/gateway/doctor), aby zastosować migracje konfiguracji i naprawić usługi:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

Jeśli Telegram lub Discord używa domyślnego fallbacku env (`TELEGRAM_BOT_TOKEN` albo `DISCORD_BOT_TOKEN`), sprawdź, czy przeniesiony plik `.env` w katalogu stanu zawiera te klucze, bez wypisywania wartości sekretów:

```bash
awk -F= '/^(TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN)=/ { print $1 "=present" }' ~/.openclaw/.env
```

`openclaw doctor` ostrzega również wtedy, gdy włączone domyślne konto Telegram lub Discord nie ma skonfigurowanego tokenu, a pasująca zmienna env jest niedostępna dla procesu doctor.

### Typowe problemy

<AccordionGroup>
  <Accordion title="Niezgodność profilu lub katalogu stanu">
    Jeśli stary gateway używał `--profile` albo `OPENCLAW_STATE_DIR`, a nowy ich nie używa, kanały będą wyglądać na wylogowane, a sesje będą puste. Uruchom gateway z **tym samym** profilem lub katalogiem stanu, który został przeniesiony, a następnie ponownie uruchom `openclaw doctor`.
  </Accordion>

  <Accordion title="Kopiowanie tylko openclaw.json">
    Sam plik konfiguracyjny nie wystarczy. Profile uwierzytelniania modeli znajdują się w `agents/<agentId>/agent/auth-profiles.json`, a stan kanałów i dostawców znajduje się w `credentials/`. Zawsze migruj **cały** katalog stanu.
  </Accordion>

  <Accordion title="Uprawnienia i właściciel">
    Jeśli pliki zostały skopiowane jako root albo zmienił się użytkownik, gateway może nie być w stanie odczytać poświadczeń. Upewnij się, że katalog stanu i obszar roboczy należą do użytkownika uruchamiającego gateway.
  </Accordion>

  <Accordion title="Tryb zdalny">
    Jeśli Twój UI wskazuje na **zdalny** gateway, to zdalny host jest właścicielem sesji i obszaru roboczego. Migruj sam host gateway, a nie lokalny laptop. Zobacz [FAQ](/pl/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Sekrety w kopiach zapasowych">
    Katalog stanu zawiera profile uwierzytelniania, poświadczenia kanałów oraz inny stan dostawców. Przechowuj kopie zapasowe w postaci zaszyfrowanej, unikaj niezabezpieczonych kanałów przesyłania i rotuj klucze, jeśli podejrzewasz ujawnienie.
  </Accordion>
</AccordionGroup>

### Lista kontrolna weryfikacji

Na nowej maszynie potwierdź:

- [ ] `openclaw status` pokazuje, że gateway działa.
- [ ] Kanały są nadal połączone (ponowne parowanie nie jest potrzebne).
- [ ] Dashboard otwiera się i pokazuje istniejące sesje.
- [ ] Pliki obszaru roboczego (pamięć, konfiguracje) są obecne.

## Uaktualnij Plugin na miejscu

Uaktualnienia Plugin na miejscu zachowują ten sam identyfikator Plugin i klucze konfiguracji, ale mogą przenieść stan na dysku do bieżącego układu. Przewodniki uaktualniania właściwe dla Plugin znajdują się obok ich kanałów:

- [Migracja Matrix](/pl/channels/matrix-migration): limity odzyskiwania stanu szyfrowanego, automatyczne zachowanie migawek oraz ręczne polecenia odzyskiwania.

## Powiązane

- [`openclaw migrate`](/pl/cli/migrate): dokumentacja CLI dotycząca importów między systemami.
- [Omówienie instalacji](/pl/install): wszystkie metody instalacji.
- [Doctor](/pl/gateway/doctor): kontrola stanu po migracji.
- [Odinstalowanie](/pl/install/uninstall): czyste usuwanie OpenClaw.
