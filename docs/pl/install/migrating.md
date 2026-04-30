---
read_when:
    - Przenosisz OpenClaw na nowy laptop lub serwer
    - Przechodzisz z innego systemu agentowego i chcesz zachować stan
    - Uaktualniasz Plugin w miejscu
summary: 'Centrum migracji: importy między systemami, przenoszenie między maszynami i aktualizacje Plugin'
title: Przewodnik po migracji
x-i18n:
    generated_at: "2026-04-30T10:02:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2a1dc86ed367a0b92cdc0d5189123bb045d327be944516f564dac723f324c97
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw obsługuje trzy ścieżki migracji: import z innego systemu agentów, przeniesienie istniejącej instalacji na nową maszynę oraz aktualizację Pluginu w miejscu.

## Import z innego systemu agentów

Użyj dołączonych dostawców migracji, aby przenieść do OpenClaw instrukcje, serwery MCP, Skills, konfigurację modeli oraz (opcjonalnie) klucze API. Plany są pokazywane w podglądzie przed jakąkolwiek zmianą, sekrety są redagowane w raportach, a zastosowanie zmian jest zabezpieczone zweryfikowaną kopią zapasową.

<CardGroup cols={2}>
  <Card title="Migrating from Claude" href="/pl/install/migrating-claude" icon="brain">
    Zaimportuj stan Claude Code i Claude Desktop, w tym `CLAUDE.md`, serwery MCP, Skills oraz polecenia projektu.
  </Card>
  <Card title="Migrating from Hermes" href="/pl/install/migrating-hermes" icon="feather">
    Zaimportuj konfigurację Hermes, dostawców, serwery MCP, pamięć, Skills oraz obsługiwane klucze `.env`.
  </Card>
</CardGroup>

Punktem wejścia CLI jest [`openclaw migrate`](/pl/cli/migrate). Onboarding może również zaproponować migrację, gdy wykryje znane źródło (`openclaw onboard --flow import`).

## Przenoszenie OpenClaw na nową maszynę

Skopiuj **katalog stanu** (domyślnie `~/.openclaw/`) oraz swój **obszar roboczy**, aby zachować:

- **Konfigurację** — `openclaw.json` i wszystkie ustawienia Gateway.
- **Uwierzytelnianie** — plik `auth-profiles.json` dla każdego agenta (klucze API oraz OAuth), a także dowolny stan kanału lub dostawcy w `credentials/`.
- **Sesje** — historię konwersacji i stan agenta.
- **Stan kanałów** — logowanie WhatsApp, sesję Telegram i podobne dane.
- **Pliki obszaru roboczego** — `MEMORY.md`, `USER.md`, Skills i prompty.

<Tip>
Uruchom `openclaw status` na starej maszynie, aby potwierdzić ścieżkę katalogu stanu. Profile niestandardowe używają `~/.openclaw-<profile>/` albo ścieżki ustawionej przez `OPENCLAW_STATE_DIR`.
</Tip>

### Kroki migracji

<Steps>
  <Step title="Stop the gateway and back up">
    Na **starej** maszynie zatrzymaj Gateway, aby pliki nie zmieniały się w trakcie kopiowania, a następnie utwórz archiwum:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Jeśli używasz wielu profili (na przykład `~/.openclaw-work`), zarchiwizuj każdy z nich osobno.

  </Step>

  <Step title="Install OpenClaw on the new machine">
    [Zainstaluj](/pl/install) CLI (oraz Node, jeśli jest potrzebny) na nowej maszynie. Nie ma problemu, jeśli onboarding utworzy świeży katalog `~/.openclaw/`. Nadpiszesz go w następnym kroku.
  </Step>

  <Step title="Copy state directory and workspace">
    Przenieś archiwum przez `scp`, `rsync -a` albo dysk zewnętrzny, a następnie je rozpakuj:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Upewnij się, że katalogi ukryte zostały uwzględnione, a właściciel plików odpowiada użytkownikowi, który będzie uruchamiać Gateway.

  </Step>

  <Step title="Run doctor and verify">
    Na nowej maszynie uruchom [Doctor](/pl/gateway/doctor), aby zastosować migracje konfiguracji i naprawić usługi:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

### Typowe pułapki

<AccordionGroup>
  <Accordion title="Profile or state-dir mismatch">
    Jeśli stary Gateway używał `--profile` albo `OPENCLAW_STATE_DIR`, a nowy ich nie używa, kanały będą wyglądać na wylogowane, a sesje będą puste. Uruchom Gateway z **tym samym** profilem lub katalogiem stanu, który został zmigrowany, a następnie ponownie uruchom `openclaw doctor`.
  </Accordion>

  <Accordion title="Copying only openclaw.json">
    Sam plik konfiguracyjny nie wystarczy. Profile uwierzytelniania modeli znajdują się w `agents/<agentId>/agent/auth-profiles.json`, a stan kanałów i dostawców znajduje się w `credentials/`. Zawsze migruj **cały** katalog stanu.
  </Accordion>

  <Accordion title="Permissions and ownership">
    Jeśli pliki zostały skopiowane jako root albo po zmianie użytkownika, Gateway może nie odczytać poświadczeń. Upewnij się, że katalog stanu i obszar roboczy należą do użytkownika uruchamiającego Gateway.
  </Accordion>

  <Accordion title="Remote mode">
    Jeśli Twój interfejs użytkownika wskazuje na **zdalny** Gateway, sesje i obszar roboczy należą do zdalnego hosta. Zmigruj sam host Gateway, a nie lokalny laptop. Zobacz [FAQ](/pl/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Secrets in backups">
    Katalog stanu zawiera profile uwierzytelniania, poświadczenia kanałów i inny stan dostawców. Przechowuj kopie zapasowe w postaci zaszyfrowanej, unikaj niezabezpieczonych kanałów transferu i rotuj klucze, jeśli podejrzewasz ujawnienie.
  </Accordion>
</AccordionGroup>

### Lista kontrolna weryfikacji

Na nowej maszynie potwierdź:

- [ ] `openclaw status` pokazuje, że Gateway działa.
- [ ] Kanały są nadal połączone (ponowne parowanie nie jest potrzebne).
- [ ] Pulpit otwiera się i pokazuje istniejące sesje.
- [ ] Pliki obszaru roboczego (pamięć, konfiguracje) są obecne.

## Aktualizacja Pluginu w miejscu

Aktualizacje Pluginów w miejscu zachowują ten sam identyfikator Pluginu i klucze konfiguracji, ale mogą przenieść stan na dysku do bieżącego układu. Przewodniki aktualizacji właściwe dla Pluginów znajdują się obok ich kanałów:

- [Migracja Matrix](/pl/channels/matrix-migration): limity odzyskiwania zaszyfrowanego stanu, automatyczne zachowanie migawek oraz ręczne polecenia odzyskiwania.

## Powiązane

- [`openclaw migrate`](/pl/cli/migrate): dokumentacja CLI dotycząca importów między systemami.
- [Przegląd instalacji](/pl/install): wszystkie metody instalacji.
- [Doctor](/pl/gateway/doctor): kontrola stanu po migracji.
- [Odinstalowanie](/pl/install/uninstall): czyste usuwanie OpenClaw.
