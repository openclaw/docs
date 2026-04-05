---
read_when:
    - Przenosisz OpenClaw na nowy laptop/serwer
    - Chcesz zachować sesje, uwierzytelnianie i logowania kanałów (WhatsApp itd.)
summary: Przenieś (zmigruj) instalację OpenClaw z jednego komputera na drugi
title: Przewodnik migracji
x-i18n:
    generated_at: "2026-04-05T13:57:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 403f0b9677ce723c84abdbabfad20e0f70fd48392ebf23eabb7f8a111fd6a26d
    source_path: install/migrating.md
    workflow: 15
---

# Migracja OpenClaw na nowy komputer

Ten przewodnik przenosi gateway OpenClaw na nowy komputer bez ponownego przechodzenia onboardingu.

## Co zostaje zmigrowane

Gdy skopiujesz **katalog stanu** (domyślnie `~/.openclaw/`) oraz swój **workspace**, zachowasz:

- **Konfigurację** -- `openclaw.json` i wszystkie ustawienia gateway
- **Uwierzytelnianie** -- per-agent `auth-profiles.json` (klucze API + OAuth), a także wszelki stan kanałów/dostawców w `credentials/`
- **Sesje** -- historię rozmów i stan agentów
- **Stan kanałów** -- logowanie WhatsApp, sesję Telegram itd.
- **Pliki workspace** -- `MEMORY.md`, `USER.md`, Skills i prompty

<Tip>
Uruchom `openclaw status` na starym komputerze, aby potwierdzić ścieżkę katalogu stanu.
Profile niestandardowe używają `~/.openclaw-<profile>/` lub ścieżki ustawionej przez `OPENCLAW_STATE_DIR`.
</Tip>

## Kroki migracji

<Steps>
  <Step title="Zatrzymaj gateway i wykonaj kopię zapasową">
    Na **starym** komputerze zatrzymaj gateway, aby pliki nie zmieniały się w trakcie kopiowania, a następnie utwórz archiwum:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Jeśli używasz wielu profili (np. `~/.openclaw-work`), zarchiwizuj każdy osobno.

  </Step>

  <Step title="Zainstaluj OpenClaw na nowym komputerze">
    [Zainstaluj](/install) CLI (oraz Node, jeśli potrzeba) na nowym komputerze.
    Nie ma problemu, jeśli onboarding utworzy świeże `~/.openclaw/` — zaraz je nadpiszesz.
  </Step>

  <Step title="Skopiuj katalog stanu i workspace">
    Przenieś archiwum przez `scp`, `rsync -a` lub dysk zewnętrzny, a następnie je rozpakuj:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Upewnij się, że uwzględniono ukryte katalogi i że właściciel plików odpowiada użytkownikowi, który będzie uruchamiał gateway.

  </Step>

  <Step title="Uruchom doctor i zweryfikuj">
    Na nowym komputerze uruchom [Doctor](/gateway/doctor), aby zastosować migracje konfiguracji i naprawić usługi:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

## Typowe pułapki

<AccordionGroup>
  <Accordion title="Niezgodność profilu lub katalogu stanu">
    Jeśli stary gateway używał `--profile` lub `OPENCLAW_STATE_DIR`, a nowy nie,
    kanały będą wyglądały na wylogowane, a sesje będą puste.
    Uruchom gateway z **tym samym** profilem lub katalogiem stanu, który został zmigrowany, a następnie ponownie uruchom `openclaw doctor`.
  </Accordion>

  <Accordion title="Kopiowanie tylko openclaw.json">
    Sam plik konfiguracyjny nie wystarczy. Profile uwierzytelniania modeli znajdują się w
    `agents/<agentId>/agent/auth-profiles.json`, a stan kanałów/dostawców nadal
    znajduje się w `credentials/`. Zawsze migruj **cały** katalog stanu.
  </Accordion>

  <Accordion title="Uprawnienia i własność">
    Jeśli kopiowałeś jako root lub zmieniłeś użytkownika, gateway może nie odczytać poświadczeń.
    Upewnij się, że katalog stanu i workspace należą do użytkownika uruchamiającego gateway.
  </Accordion>

  <Accordion title="Tryb zdalny">
    Jeśli twój interfejs wskazuje na **zdalny** gateway, zdalny host przechowuje sesje i workspace.
    Migruj sam host gateway, a nie lokalny laptop. Zobacz [FAQ](/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Sekrety w kopiach zapasowych">
    Katalog stanu zawiera profile uwierzytelniania, poświadczenia kanałów i inny
    stan dostawców.
    Przechowuj kopie zapasowe w postaci zaszyfrowanej, unikaj niezabezpieczonych kanałów transferu i rotuj klucze, jeśli podejrzewasz ujawnienie.
  </Accordion>
</AccordionGroup>

## Lista kontrolna weryfikacji

Na nowym komputerze potwierdź:

- [ ] `openclaw status` pokazuje, że gateway działa
- [ ] Kanały są nadal połączone (ponowne parowanie nie jest potrzebne)
- [ ] Dashboard otwiera się i pokazuje istniejące sesje
- [ ] Pliki workspace (memory, konfiguracje) są obecne
