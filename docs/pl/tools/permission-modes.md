---
read_when:
    - Wybieranie opcji auto, ask, allowlist, full lub deny dla uprawnień do poleceń
    - Konfigurowanie zatwierdzeń weryfikowanych przez Codex Guardian za pomocą tools.exec.mode
    - Porównanie zatwierdzeń wykonywania poleceń w OpenClaw z uprawnieniami środowiska ACPX
summary: Tryby uprawnień do wykonywania poleceń na hoście, zatwierdzenia Codex Guardian i sesje środowiska ACPX
title: Tryby uprawnień
x-i18n:
    generated_at: "2026-07-12T15:40:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f580e66508c1f69e868ed26a62d88a675f86a4d1ca738650dc5af82e967f3ac3
    source_path: tools/permission-modes.md
    workflow: 16
---

Tryby uprawnień określają zakres uprawnień agenta, zanim uruchomi on polecenia na hoście, zapisze pliki lub poprosi środowisko wykonawcze backendu o dodatkowy dostęp.

<Note>
  Tryb uprawnień jest niezależny od `tools.exec.host=auto`. `tools.exec.host`
  określa, gdzie polecenie jest uruchamiane. `tools.exec.mode` określa sposób
  zatwierdzania wykonywania poleceń na hoście.
</Note>

## Zalecane ustawienie domyślne

Użyj trybu `auto` dla agentów programistycznych, które potrzebują użytecznego dostępu do hosta bez wyświetlania użytkownikowi monitu przy każdym braku dopasowania:

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

Następnie sprawdź obowiązującą politykę:

```bash
openclaw exec-policy show
```

## Tryby wykonywania poleceń na hoście w OpenClaw

`tools.exec.mode` jest ujednoliconym interfejsem polityki dla operacji `exec` na hoście. Każdy tryb odpowiada bazowej parze ustawień `security` (rygor listy dozwolonych poleceń) i `ask` (monit przy braku dopasowania):

| Tryb        | security / ask          | Zachowanie                                                                                                  | Kiedy używać                                               |
| ----------- | ----------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `deny`      | `deny` / `off`          | Całkowicie blokuje wykonywanie poleceń na hoście.                                                           | Żadne polecenia na hoście nie są dozwolone.                |
| `allowlist` | `allowlist` / `off`     | Uruchamia tylko polecenia z listy dozwolonych; po cichu odrzuca niedopasowane polecenia.                     | Masz znany, bezpieczny zestaw poleceń.                      |
| `ask`       | `allowlist` / `on-miss` | Uruchamia polecenia pasujące do listy dozwolonych; przy braku dopasowania pyta człowieka.                    | Człowiek powinien sprawdzać każde nowe polecenie.           |
| `auto`      | `allowlist` / `on-miss` | Uruchamia polecenia pasujące do listy dozwolonych; pozostałe poddaje automatycznej weryfikacji, a następnie, w razie potrzeby, prosi człowieka o zatwierdzenie. | Sesje programistyczne potrzebują praktycznego, kontrolowanego dostępu. |
| `full`      | `full` / `off`          | Wykonuje polecenia na hoście bez monitów.                                                                   | Ten zaufany host lub ta sesja mają pomijać mechanizmy zatwierdzania. |

Tryby `ask` i `auto` korzystają z tych samych ustawień listy dozwolonych poleceń i monitów. Tryb `auto` dodatkowo włącza natywny mechanizm automatycznej weryfikacji, który samodzielnie rozstrzyga przypadki braku dopasowania i przekazuje decyzję skonfigurowanej ścieżce zatwierdzania przez człowieka tylko wtedy, gdy nie może bezpiecznie wydać zgody.

Pełny opis polityki wykonywania poleceń na hoście, lokalnego pliku zatwierdzeń, schematu listy dozwolonych poleceń, bezpiecznych programów i przekazywania żądań znajdziesz w sekcji [Zatwierdzanie operacji Exec](/pl/tools/exec-approvals).

## Mapowanie Codex Guardian

W przypadku natywnych sesji serwera aplikacji Codex ustawienie `tools.exec.mode: "auto"` kieruje Codex do zatwierdzania sprawdzanego przez Guardian, jeśli pozwalają na to lokalne wymagania Codex. Typowe wartości wynikowe:

| Pole Codex          | Typowa wartość     |
| ------------------- | ------------------ |
| `approvalPolicy`    | `on-request`       |
| `approvalsReviewer` | `auto_review`      |
| `sandbox`           | `workspace-write`  |

Tryb `auto` wymusza tę politykę niezależnie od skonfigurowanych nadpisań piaskownicy i zatwierdzania Codex, dlatego nie zachowuje starszych, niebezpiecznych kombinacji, takich jak `approvalPolicy: "never"` z `sandbox: "danger-full-access"`. Ustawienia `tools.exec.mode: "deny"` i `"allowlist"` całkowicie blokują lokalne wykonywanie poleceń przez serwer aplikacji Codex. Używaj `tools.exec.mode: "full"` tylko wtedy, gdy świadomie chcesz działać bez zatwierdzania.

Informacje o konfiguracji serwera aplikacji, kolejności uwierzytelniania i szczegółach natywnego środowiska wykonawczego Codex znajdziesz w sekcji [Środowisko wykonawcze Codex](/pl/plugins/codex-harness).

## Uprawnienia środowiska wykonawczego ACPX

Sesje ACPX są nieinteraktywne, dlatego nie mogą obsługiwać monitu o uprawnienia w TTY. ACPX używa oddzielnych ustawień na poziomie środowiska wykonawczego w `plugins.entries.acpx.config`:

| Ustawienie                  | Wartości        | Znaczenie                                                   |
| --------------------------- | --------------- | ----------------------------------------------------------- |
| `permissionMode`            | `approve-reads` | Automatycznie zatwierdza tylko operacje odczytu.             |
| `permissionMode`            | `approve-all`   | Automatycznie zatwierdza operacje zapisu i polecenia powłoki. |
| `permissionMode`            | `deny-all`      | Odrzuca wszystkie monity o uprawnienia.                      |
| `nonInteractivePermissions` | `fail`          | Przerywa działanie, gdy wymagany byłby monit.                 |
| `nonInteractivePermissions` | `deny`          | Odrzuca monit i kontynuuje działanie, gdy jest to możliwe.    |

Skonfiguruj uprawnienia ACPX niezależnie od zatwierdzania operacji Exec w OpenClaw:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

Używaj `approve-all` jako awaryjnego odpowiednika sesji środowiska wykonawczego ACPX bez monitów. Szczegóły konfiguracji i tryby awarii znajdziesz w sekcji [Konfiguracja agentów ACP](/pl/tools/acp-agents-setup#permission-configuration).

## Wybór trybu

| Cel                                                       | Konfiguracja                                                |
| --------------------------------------------------------- | ----------------------------------------------------------- |
| Całkowite zablokowanie poleceń na hoście                  | `tools.exec.mode: "deny"`                                   |
| Zezwolenie wyłącznie na znane, bezpieczne polecenia       | `tools.exec.mode: "allowlist"`                              |
| Pytanie człowieka o każdy nowy rodzaj polecenia            | `tools.exec.mode: "ask"`                                    |
| Automatyczna weryfikacja Codex/OpenClaw przed człowiekiem | `tools.exec.mode: "auto"`                                   |
| Całkowite pominięcie zatwierdzania operacji na hoście     | `tools.exec.mode: "full"` oraz zgodny plik zatwierdzeń hosta |
| Zezwolenie nieinteraktywnym sesjom ACPX na zapis i wykonywanie poleceń | `plugins.entries.acpx.config.permissionMode: "approve-all"` |

Jeśli po zmianie trybu polecenie nadal wyświetla monit lub kończy się niepowodzeniem, sprawdź obie warstwy:

```bash
openclaw approvals get
openclaw exec-policy show
```

Wykonywanie poleceń na hoście podlega bardziej rygorystycznemu wynikowi konfiguracji OpenClaw i lokalnego pliku zatwierdzeń hosta. Uprawnienia środowiska wykonawczego ACPX nie łagodzą zatwierdzania operacji na hoście, a zatwierdzanie operacji na hoście nie łagodzi monitów środowiska wykonawczego ACPX.

## Powiązane materiały

- [Zatwierdzanie operacji Exec](/pl/tools/exec-approvals)
- [Zatwierdzanie operacji Exec — zagadnienia zaawansowane](/pl/tools/exec-approvals-advanced)
- [Środowisko wykonawcze Codex](/pl/plugins/codex-harness)
- [Konfiguracja agentów ACP](/pl/tools/acp-agents-setup#permission-configuration)
