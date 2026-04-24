---
read_when:
    - Przenosisz OpenClaw na nowy laptop/serwer
    - Chcesz zachować sesje, auth i logowania kanałów (WhatsApp itd.)
summary: Przenieś (zmigruj) instalację OpenClaw z jednej maszyny na drugą
title: Przewodnik migracji
x-i18n:
    generated_at: "2026-04-24T09:17:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c14be563d1eb052726324678cf2784efffc2341aa17f662587fdabe1d8ec1e2
    source_path: install/migrating.md
    workflow: 15
---

# Migracja OpenClaw na nową maszynę

Ten przewodnik przenosi Gateway OpenClaw na nową maszynę bez ponownego przechodzenia onboardingu.

## Co jest migrowane

Gdy skopiujesz **katalog stanu** (domyślnie `~/.openclaw/`) oraz swój **obszar roboczy**, zachowasz:

- **Konfigurację** — `openclaw.json` i wszystkie ustawienia gateway
- **Auth** — per-agent `auth-profiles.json` (klucze API + OAuth), a także wszelki stan kanałów/providerów w `credentials/`
- **Sesje** — historię rozmów i stan agenta
- **Stan kanałów** — logowanie WhatsApp, sesję Telegram itd.
- **Pliki obszaru roboczego** — `MEMORY.md`, `USER.md`, Skills i prompty

<Tip>
Uruchom `openclaw status` na starej maszynie, aby potwierdzić ścieżkę katalogu stanu.
Niestandardowe profile używają `~/.openclaw-<profile>/` albo ścieżki ustawionej przez `OPENCLAW_STATE_DIR`.
</Tip>

## Kroki migracji

<Steps>
  <Step title="Zatrzymaj gateway i wykonaj kopię zapasową">
    Na **starej** maszynie zatrzymaj gateway, aby pliki nie zmieniały się w trakcie kopiowania, a następnie zarchiwizuj:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Jeśli używasz wielu profili (np. `~/.openclaw-work`), zarchiwizuj każdy osobno.

  </Step>

  <Step title="Zainstaluj OpenClaw na nowej maszynie">
    [Zainstaluj](/pl/install) CLI (i Node, jeśli potrzeba) na nowej maszynie.
    To w porządku, jeśli onboarding utworzy świeże `~/.openclaw/` — za chwilę je nadpiszesz.
  </Step>

  <Step title="Skopiuj katalog stanu i obszar roboczy">
    Przenieś archiwum przez `scp`, `rsync -a` lub zewnętrzny dysk, a następnie rozpakuj:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Upewnij się, że uwzględniono ukryte katalogi i że właściciel plików zgadza się z użytkownikiem, który będzie uruchamiał gateway.

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

## Typowe pułapki

<AccordionGroup>
  <Accordion title="Niedopasowanie profilu lub katalogu stanu">
    Jeśli stary gateway używał `--profile` albo `OPENCLAW_STATE_DIR`, a nowy nie,
    kanały będą wyglądały na wylogowane, a sesje będą puste.
    Uruchom gateway z **tym samym** profilem lub katalogiem stanu, który zmigrowałeś, a następnie ponownie uruchom `openclaw doctor`.
  </Accordion>

  <Accordion title="Kopiowanie tylko openclaw.json">
    Sam plik konfiguracji nie wystarczy. Profile auth modeli znajdują się w
    `agents/<agentId>/agent/auth-profiles.json`, a stan kanałów/providerów nadal
    znajduje się w `credentials/`. Zawsze migruj **cały** katalog stanu.
  </Accordion>

  <Accordion title="Uprawnienia i własność">
    Jeśli kopiowałeś jako root albo zmieniłeś użytkowników, gateway może nie móc odczytać poświadczeń.
    Upewnij się, że katalog stanu i obszar roboczy należą do użytkownika uruchamiającego gateway.
  </Accordion>

  <Accordion title="Tryb zdalny">
    Jeśli Twój interfejs wskazuje na **zdalny** gateway, to zdalny host jest właścicielem sesji i obszaru roboczego.
    Migruj sam host gateway, a nie lokalny laptop. Zobacz [FAQ](/pl/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Sekrety w kopiach zapasowych">
    Katalog stanu zawiera profile auth, poświadczenia kanałów i inny
    stan providerów.
    Przechowuj kopie zapasowe w postaci zaszyfrowanej, unikaj niezabezpieczonych kanałów transferu i obróć klucze, jeśli podejrzewasz ekspozycję.
  </Accordion>
</AccordionGroup>

## Checklista weryfikacyjna

Na nowej maszynie potwierdź:

- [ ] `openclaw status` pokazuje, że gateway działa
- [ ] Kanały nadal są połączone (nie trzeba ponownie parować)
- [ ] Panel kontrolny otwiera się i pokazuje istniejące sesje
- [ ] Pliki obszaru roboczego (pamięć, konfiguracje) są obecne

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Migracja Matrix](/pl/install/migrating-matrix)
- [Odinstalowanie](/pl/install/uninstall)
