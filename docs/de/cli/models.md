---
read_when:
    - Sie möchten die Standardmodelle ändern oder den Authentifizierungsstatus des Providers anzeigen.
    - Sie möchten verfügbare Modelle/Provider prüfen und Authentifizierungsprofile debuggen
summary: CLI-Referenz für `openclaw models` (Status/Auflisten/Festlegen/Scannen, Aliasse, Fallbacks, Authentifizierung)
title: Modelle
x-i18n:
    generated_at: "2026-07-24T04:57:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f7405c25694f04afe9c3029a8af64ae3ae7e1bdcf4c4ac31b8b84ff512d6a90e
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Modellerkennung, Scannen und Konfiguration (Standardmodell, Fallbacks, Authentifizierungsprofile).

Verwandte Themen:

- Provider und Modelle: [Modelle](/de/providers/models)
- Konzepte zur Modellauswahl und Slash-Befehl `/models`: [Modellkonzept](/de/concepts/models)
- Einrichtung der Provider-Authentifizierung: [Erste Schritte](/de/start/getting-started)

## Häufig verwendete Befehle

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
openclaw models scan
```

Die Unterbefehle `status` und `auth` akzeptieren `--agent <id>`, um einen konfigurierten Agenten anzugeben; `list`, `scan`, `aliases` und `fallbacks`/`image-fallbacks` verwenden immer den konfigurierten Standardagenten, und `set`/`set-image` lehnen `--agent` grundsätzlich ab. Wenn die Angabe fehlt, verwenden `--agent`-fähige Befehle `OPENCLAW_AGENT_DIR`, sofern festgelegt, andernfalls den konfigurierten Standardagenten.

### Status

`openclaw models status` zeigt den aufgelösten Standardwert und die Fallbacks sowie eine Übersicht der Authentifizierung. Bei Plugin-eigenen Agenten-Runtimes wie Codex wird außerdem geprüft, ob das zuständige Plugin aktiviert ist und die Überprüfung der Startnutzlast bestanden hat. Eine Route mit gültigen Anmeldedaten, aber nicht verfügbarer Runtime meldet `status: unavailable` statt `usable`; die JSON-Ausgabe enthält separate Angaben zu `authStatus` und `runtimeStatus` sowie begrenzte Runtime-Diagnosedaten. Wenn Momentaufnahmen der Provider-Nutzung verfügbar sind, enthält der OAuth/API-Schlüssel-Statusabschnitt Nutzungszeiträume und Kontingentmomentaufnahmen des Providers. Derzeit unterstützte Provider für Nutzungszeiträume: Anthropic, GitHub Copilot, Gemini CLI, OpenAI, MiniMax, Xiaomi und z.ai. Die Nutzungsauthentifizierung stammt aus Provider-spezifischen Hooks, sofern verfügbar; andernfalls greift OpenClaw auf passende OAuth/API-Schlüssel-Anmeldedaten aus Authentifizierungsprofilen, Umgebungsvariablen oder der Konfiguration zurück.

In der Ausgabe von `--json` ist `auth.providers` die Umgebungs-, Konfigurations- und Speicher berücksichtigende Provider-Übersicht, während `auth.oauth` ausschließlich den Zustand der Profile im Authentifizierungsspeicher darstellt.

Optionen:

| Flag                      | Wirkung                                                                                                                                   |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `--json`                  | JSON-Ausgabe; Diagnosedaten zu Authentifizierungsprofilen, Providern und Startvorgängen werden an stderr gesendet, damit stdout an `jq` weitergeleitet werden kann.                            |
| `--plain`                 | Nur-Text-Ausgabe.                                                                                                                       |
| `--check`                 | Beendet den Prozess mit einem Fehlercode ungleich null, wenn die Authentifizierung bald abläuft/abgelaufen oder eine ausgewählte Agenten-Runtime nicht verfügbar ist: `1` = nicht verfügbar/abgelaufen/fehlend, `2` = läuft bald ab. |
| `--probe`                 | Live-Prüfung konfigurierter Authentifizierungsprofile. Echte Anfragen; kann Token verbrauchen und Ratenbegrenzungen auslösen.                                       |
| `--probe-provider <name>` | Prüft nur einen Provider.                                                                                                                 |
| `--probe-profile <id>`    | Prüft bestimmte Authentifizierungsprofil-IDs (wiederholbar oder durch Kommas getrennt).                                                                             |
| `--probe-timeout <ms>`    | Zeitüberschreitung pro Prüfung.                                                                                                                       |
| `--probe-concurrency <n>` | Gleichzeitige Prüfungen.                                                                                                                       |
| `--probe-max-tokens <n>`  | Maximale Token-Anzahl für die Prüfung (Best Effort).                                                                                                          |
| `--agent <id>`            | ID des konfigurierten Agenten; überschreibt `OPENCLAW_AGENT_DIR`.                                                                                     |

Prüfzeilen können aus Authentifizierungsprofilen, Umgebungsanmeldedaten oder `models.json` stammen. Statuskategorien der Prüfung: `ok`, `auth`, `rate_limit`, `billing`, `timeout`, `format`, `unknown`, `no_model`.

Zu erwartende Detail-/Ursachencodes, wenn eine Prüfung nie einen Modellaufruf erreicht:

- `excluded_by_auth_order`: Ein gespeichertes Profil ist vorhanden, aber durch das explizite `auth.order.<provider>` ausgeschlossen. Daher meldet die Prüfung den Ausschluss, statt das Profil zu verwenden.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`: Das Profil ist vorhanden, kann aber nicht verwendet oder aufgelöst werden.
- `ineligible_profile`: Das Profil ist aus einem anderen Grund nicht mit der Provider-Konfiguration kompatibel.
- `no_model`: Eine Provider-Authentifizierung ist vorhanden, OpenClaw konnte jedoch keinen prüfbaren Modellkandidaten für diesen Provider auflösen.

Zur Fehlerbehebung bei OpenAI ChatGPT/Codex OAuth lässt sich mit `openclaw models status`, `openclaw models auth list --provider openai` und `openclaw config get agents.defaults.model --json` am schnellsten feststellen, ob ein Agent über ein verwendbares `openai`-OAuth-Profil für `openai/*` über die native Codex-Runtime verfügt. Siehe [Einrichtung des OpenAI-Providers](/de/providers/openai#check-and-recover-codex-oauth-routing).

### Auflisten

`openclaw models list` ist schreibgeschützt: Der Befehl liest die Konfiguration, Authentifizierungsprofile, den vorhandenen Katalogzustand und Provider-eigene Katalogzeilen, schreibt `models.json` jedoch nie neu.

Optionen: `--all` (vollständiger Katalog), `--local` (auf lokale Modelle beschränken), `--provider <id>`, `--json`, `--plain`.

Hinweise:

- Die Spalte `Auth` ist schreibgeschützt. Bei Provider-eigenen Modellrouten wie OpenAI gleicht sie die API-/Basis-URL-Route jeder Zeile mit geeigneten Profilen im wirksamen `auth.order`, mit Umgebungs-/Konfigurationsanmeldedaten und mit aufgelösten befehlsbezogenen SecretRefs ab. Eine konkrete OpenAI-Zeile bleibt unbekannt, wenn ihre Routenrichtlinie nicht verfügbar ist, statt eine Authentifizierung auf Provider-Ebene zu übernehmen; ältere Prüfungen ausschließlich auf Provider-Ebene und andere Provider behalten das Verhalten auf Provider-Ebene bei. Metadaten zur synthetischen Authentifizierung eines Plugins sind lediglich ein Hinweis auf eine Runtime-Fähigkeit und kein Nachweis nativer Kontoauthentifizierung. Daher bleiben kontoabhängige Routen ohne positiven Registry-Nachweis unbekannt. Der Befehl lädt weder die Provider-Runtime noch liest er Schlüsselbundgeheimnisse, ruft Provider-APIs auf oder weist die genaue Ausführungsbereitschaft nach.
- `models list --all --provider <id>` kann Provider-eigene statische Katalogzeilen aus Plugin-Manifesten oder gebündelten Provider-Katalogmetadaten enthalten, selbst wenn Sie sich noch nicht bei diesem Provider authentifiziert haben. Diese Zeilen werden weiterhin als nicht verfügbar angezeigt, bis eine passende Authentifizierung konfiguriert ist.
- `models list` sorgt dafür, dass die Steuerungsebene reaktionsfähig bleibt, während die Provider-Katalogerkennung langsam ist. Die Standardansicht und die konfigurierten Ansichten greifen nach kurzer Wartezeit auf konfigurierte oder synthetische Modellzeilen zurück und lassen die Erkennung im Hintergrund abschließen. Verwenden Sie `--all`, wenn Sie den exakten, vollständig erkannten Katalog benötigen und bereit sind, auf die Provider-Erkennung zu warten.
- Das allgemeine `models list --all` führt Manifest-Katalogzeilen über Registry-Zeilen zusammen, ohne Ergänzungs-Hooks der Provider-Runtime zu laden. Provider-gefilterte Manifest-Schnellpfade verwenden nur Provider mit der Kennzeichnung `static`; Provider mit der Kennzeichnung `refreshable` bleiben Registry-/Cache-basiert und hängen Manifestzeilen als Ergänzungen an, während Provider mit der Kennzeichnung `runtime` weiterhin die Registry-/Runtime-Erkennung verwenden.
- `models list` hält native Modellmetadaten und Runtime-Begrenzungen getrennt. In der Tabellenausgabe zeigt `Ctx` den Wert `contextTokens/contextWindow`, wenn sich eine wirksame Runtime-Begrenzung vom nativen Kontextfenster unterscheidet; JSON-Zeilen enthalten `contextTokens`, wenn ein Provider diese Begrenzung bereitstellt.
- Bei Provider-eigenen Routen projiziert `models list` eine logische Provider-/Modellzeile auf die ausgewählte Route. `Input` und `Ctx` stammen ausschließlich aus einer Katalogzeile der exakt passenden physischen Route, wobei explizit konfigurierte logische Überschreibungen zuletzt angewendet werden; bei einer nicht aufgelösten Routenauswahl werden unbekannte Fähigkeitsfelder angezeigt, statt Metadaten einer benachbarten Route zu übernehmen.
- `models list --provider <id>` filtert nach Provider-ID, beispielsweise `moonshot` oder `openai`. Anzeigenamen aus interaktiven Provider-Auswahlmenüs wie `Moonshot AI` werden nicht akzeptiert.
- Modellreferenzen werden am **ersten** `/` getrennt. Wenn die Modell-ID `/` enthält (OpenRouter-Stil), geben Sie das Provider-Präfix an (Beispiel: `openrouter/moonshotai/kimi-k2`).
- Wenn Sie den Provider weglassen, löst OpenClaw die Eingabe zuerst als Alias auf, dann als eindeutige Übereinstimmung eines konfigurierten Providers für genau diese Modell-ID und greift erst danach mit einer Veraltungswarnung auf den konfigurierten Standard-Provider zurück. Wenn dieser Provider das konfigurierte Standardmodell nicht mehr bereitstellt, greift OpenClaw auf das erste konfigurierte Provider-/Modellpaar zurück, statt einen veralteten Standardwert eines entfernten Providers auszugeben.
- `models status` kann in der Authentifizierungsausgabe für nicht geheime Platzhalter (beispielsweise `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) `marker(<value>)` anzeigen, statt sie wie Geheimnisse zu maskieren.

### Standard-/Bildmodell festlegen

```bash
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
```

`set` schreibt `agents.defaults.model.primary`; `set-image` schreibt `agents.defaults.imageModel.primary`. Beide akzeptieren `provider/model` oder einen konfigurierten Alias. `set` repariert außerdem Installationen von Codex-/Copilot-Runtime-Plugins, wenn das neu ausgewählte Modell ein solches benötigt; `set-image` tut dies nicht. Keiner der beiden Befehle akzeptiert `--agent`; sie schreiben immer die Agenten-Standardwerte.

### Scannen

`models scan` liest den öffentlichen `:free`-Katalog von OpenRouter und ordnet Kandidaten nach ihrer Eignung als Fallback. Der Katalog selbst ist öffentlich, daher benötigen reine Metadatenscans keinen OpenRouter-Schlüssel.

Standardmäßig versucht OpenClaw, die Unterstützung für Tools und Bilder durch Live-Modellaufrufe zu prüfen. Wenn kein OpenRouter-Schlüssel konfiguriert ist, greift der Befehl auf eine reine Metadatenausgabe zurück und weist darauf hin, dass `:free`-Modelle weiterhin `OPENROUTER_API_KEY` für Prüfungen und Inferenz benötigen.

Optionen:

- `--no-probe` (nur Metadaten; kein Zugriff auf Konfiguration/Geheimnisse)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (Zeitüberschreitung für Kataloganfragen und einzelne Prüfungen)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` und `--set-image` erfordern Live-Prüfungen; Ergebnisse reiner Metadatenscans dienen nur zur Information und werden nicht auf die Konfiguration angewendet.

## Aliasse

```bash
openclaw models aliases list [--json] [--plain]
openclaw models aliases add <alias> <model-or-alias>
openclaw models aliases remove <alias>
```

Aliasse werden für jeden Modelleintrag als `agents.defaults.models.<key>.alias` gespeichert. `add` löst `<model-or-alias>` zuerst in einen kanonischen Provider-/Modellschlüssel auf. Wenn einem Alias daher ein weiterer Alias zugewiesen wird, wird er neu ausgerichtet, statt eine Kette zu bilden.
Das Hinzufügen eines Alias ändert `agents.defaults.modelPolicy.allow` nicht und schränkt Modellüberschreibungen nicht ein.

## Fallbacks

```bash
openclaw models fallbacks list [--json] [--plain]
openclaw models fallbacks add <model-or-alias>
openclaw models fallbacks remove <model-or-alias>
openclaw models fallbacks clear
```

Verwaltet `agents.defaults.model.fallbacks`. `openclaw models image-fallbacks list|add|remove|clear` verwaltet die parallele Liste `agents.defaults.imageModel.fallbacks` mit derselben Unterbefehlsstruktur.

## Authentifizierungsprofile

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth login-github-copilot
openclaw models auth paste-api-key --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token --provider <id>
openclaw models auth order get --provider <id>
openclaw models auth order set --provider <id> <profileIds...>
openclaw models auth order clear --provider <id>
```

`models auth add` ist die interaktive Authentifizierungshilfe. Je nach ausgewähltem Provider kann sie einen Authentifizierungsablauf des Providers (OAuth/API-Schlüssel) starten oder Sie durch das manuelle Einfügen eines Tokens führen.

`models auth list` listet gespeicherte Authentifizierungsprofile für den ausgewählten Agenten auf, ohne Token, API-Schlüssel oder geheimes OAuth-Material auszugeben. Verwenden Sie `--provider <id>`, um nach einem einzelnen Provider wie `openai` zu filtern, und `--json` für Skripte.

`models auth login` führt den Authentifizierungsablauf eines Provider-Plugins (OAuth/API-Schlüssel) aus. Mit `openclaw plugins list` können Sie anzeigen, welche Provider installiert sind. `login` akzeptiert `--profile-id <id>` für Provider, die bei der Anmeldung benannte Profile unterstützen (verwenden Sie dies, um mehrere Anmeldungen beim selben Provider getrennt zu halten), `--method <id>` zur Auswahl einer bestimmten Authentifizierungsmethode, `--device-code` als Kurzform für `--method device-code`, `--set-default` zum Anwenden des vom Provider empfohlenen Standardmodells und `--force`, um vorhandene Profile für diesen Provider zuerst zu entfernen (verwenden Sie dies, wenn ein zwischengespeichertes OAuth-Profil festhängt oder Sie das Konto wechseln möchten).

`models auth login-github-copilot` ist eine Kurzform für `models auth login --provider github-copilot --method device` (GitHub-Geräteablauf); der Befehl akzeptiert `--yes`, um ein vorhandenes Profil ohne Rückfrage zu überschreiben.

Verwenden Sie `openclaw models auth --agent <id> <subcommand>`, um Authentifizierungsergebnisse in den Speicher eines bestimmten konfigurierten Agenten zu schreiben. Das übergeordnete Flag `--agent` wird von `add`, `list`, `login`, `paste-api-key`, `setup-token`, `paste-token`, `login-github-copilot` und `order get`/`set`/`clear` berücksichtigt.

Für OpenAI-Modelle verwendet `--provider openai` standardmäßig die Anmeldung mit einem ChatGPT-/Codex-Konto. Verwenden Sie `--method api-key` nur, wenn Sie ein OpenAI-API-Schlüsselprofil hinzufügen möchten, üblicherweise als Absicherung gegen Limits des Codex-Abonnements. Führen Sie `openclaw doctor --fix` aus, um ältere Authentifizierungs-/Profilzustände mit dem veralteten OpenAI-Codex-Präfix zu `openai` zu migrieren.

Beispiele:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

Hinweise:

- `paste-api-key` akzeptiert andernorts erzeugte API-Schlüssel, fordert zur Eingabe des Schlüsselwerts auf und schreibt ihn in die Standardprofil-ID `<provider>:manual`, sofern Sie nicht `--profile-id` übergeben. Leiten Sie bei der Automatisierung den Schlüssel über die Standardeingabe weiter, beispielsweise mit `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`.
- `setup-token` und `paste-token` bleiben allgemeine Token-Befehle für Provider, die Token-Authentifizierungsmethoden bereitstellen.
- `setup-token` erfordert ein interaktives TTY und führt die Token-Authentifizierungsmethode des Providers aus (standardmäßig die Methode `setup-token` dieses Providers, wenn er eine solche bereitstellt).
- `paste-token` erfordert `--provider`, fordert standardmäßig zur Eingabe des Token-Werts auf und schreibt ihn in die Standardprofil-ID `<provider>:manual`, sofern Sie nicht `--profile-id` übergeben. Leiten Sie bei der Automatisierung das Token über die Standardeingabe weiter, anstatt es als Argument zu übergeben, damit die Zugangsdaten des Providers nicht im Shell-Verlauf oder in Prozesslisten erscheinen.
- `paste-token --expires-in <duration>` speichert den absoluten Ablaufzeitpunkt eines Tokens anhand einer relativen Dauer wie `365d` oder `12h`.
- Bei `openai` haben OpenAI-API-Schlüssel und ChatGPT-/OAuth-Token-Material unterschiedliche Authentifizierungsformate. Verwenden Sie `paste-api-key` für OpenAI-API-Schlüssel des Typs `sk-...` und `paste-token` ausschließlich für Token-Authentifizierungsmaterial.
- Anthropic: `setup-token`/`paste-token` sind unterstützte OpenClaw-Authentifizierungswege für `anthropic`, OpenClaw verwendet jedoch bevorzugt die Claude CLI (`claude -p`) auf dem Host, wenn sie verfügbar ist.
- `auth order get/set/clear` verwaltet für einen Provider eine agentenspezifische Überschreibung der Reihenfolge von Authentifizierungsprofilen, die in `auth-state.json` gespeichert wird (getrennt vom Konfigurationsschlüssel `auth.order.<provider>`). `set` akzeptiert eine oder mehrere Profil-IDs in Prioritätsreihenfolge; `clear` greift wieder auf die Konfigurations-/Round-Robin-Reihenfolge zurück.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Modellauswahl](/de/concepts/model-providers)
- [Modell-Failover](/de/concepts/model-failover)
