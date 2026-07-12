---
read_when:
    - Sie möchten Standardmodelle ändern oder den Authentifizierungsstatus des Providers anzeigen
    - Sie möchten verfügbare Modelle/Provider durchsuchen und Authentifizierungsprofile debuggen
summary: CLI-Referenz für `openclaw models` (Status/Auflisten/Festlegen/Scannen, Aliasse, Fallbacks, Authentifizierung)
title: Modelle
x-i18n:
    generated_at: "2026-07-12T15:13:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 330598225664ff961ab41bf6358226ad64eb43e941be7f422cfde0fe9d93cea8
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Modellerkennung, Scans und Konfiguration (Standardmodell, Fallbacks, Authentifizierungsprofile).

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

Die Unterbefehle `status` und `auth` akzeptieren `--agent <id>`, um einen konfigurierten Agenten auszuwählen; `list`, `scan`, `aliases` und `fallbacks`/`image-fallbacks` verwenden stets den konfigurierten Standardagenten, und `set`/`set-image` lehnen `--agent` grundsätzlich ab. Wenn die Option weggelassen wird, verwenden Befehle mit Unterstützung für `--agent` den Wert von `OPENCLAW_AGENT_DIR`, sofern dieser gesetzt ist, andernfalls den konfigurierten Standardagenten.

### Status

`openclaw models status` zeigt das aufgelöste Standardmodell und die Fallbacks sowie eine Übersicht über die Authentifizierung. Wenn Momentaufnahmen zur Provider-Nutzung verfügbar sind, enthält der Abschnitt zum OAuth-/API-Schlüsselstatus Nutzungszeiträume und Kontingentmomentaufnahmen der Provider. Derzeit unterstützte Provider für Nutzungszeiträume: Anthropic, GitHub Copilot, Gemini CLI, OpenAI, MiniMax, Xiaomi und z.ai. Nutzungsbezogene Authentifizierungsdaten stammen, sofern verfügbar, aus Provider-spezifischen Hooks; andernfalls greift OpenClaw auf passende OAuth-/API-Schlüssel-Anmeldedaten aus Authentifizierungsprofilen, Umgebungsvariablen oder der Konfiguration zurück.

In der `--json`-Ausgabe ist `auth.providers` die Umgebungsvariablen, Konfiguration und Speicher berücksichtigende Provider-Übersicht, während `auth.oauth` ausschließlich den Zustand der Profile im Authentifizierungsspeicher darstellt.

Optionen:

| Flag                      | Auswirkung                                                                                                                          |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `--json`                  | JSON-Ausgabe; Diagnosen zu Authentifizierungsprofilen, Providern und Startvorgang werden an stderr gesendet, damit stdout an `jq` weitergeleitet werden kann. |
| `--plain`                 | Nur-Text-Ausgabe.                                                                                                                   |
| `--check`                 | Beendet den Prozess mit einem von null verschiedenen Status, wenn die Authentifizierung bald abläuft oder abgelaufen ist: `1` = abgelaufen/fehlt, `2` = läuft bald ab. |
| `--probe`                 | Live-Prüfung der konfigurierten Authentifizierungsprofile. Echte Anfragen; kann Token verbrauchen und Ratenbegrenzungen auslösen.     |
| `--probe-provider <name>` | Prüft nur einen Provider.                                                                                                           |
| `--probe-profile <id>`    | Prüft bestimmte Authentifizierungsprofil-IDs (wiederholbar oder durch Kommas getrennt).                                              |
| `--probe-timeout <ms>`    | Zeitüberschreitung pro Prüfung.                                                                                                     |
| `--probe-concurrency <n>` | Gleichzeitig ausgeführte Prüfungen.                                                                                                 |
| `--probe-max-tokens <n>`  | Maximale Token-Anzahl der Prüfung (Best Effort).                                                                                    |
| `--agent <id>`            | ID des konfigurierten Agenten; überschreibt `OPENCLAW_AGENT_DIR`.                                                                   |

Prüfzeilen können aus Authentifizierungsprofilen, Umgebungs-Anmeldedaten oder `models.json` stammen. Statuskategorien der Prüfung: `ok`, `auth`, `rate_limit`, `billing`, `timeout`, `format`, `unknown`, `no_model`.

Zu erwartende Detail-/Ursachencodes, wenn eine Prüfung nie einen Modellaufruf erreicht:

- `excluded_by_auth_order`: Ein gespeichertes Profil ist vorhanden, wurde jedoch in der expliziten Einstellung `auth.order.<provider>` ausgelassen. Daher meldet die Prüfung den Ausschluss, statt das Profil zu verwenden.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`: Das Profil ist vorhanden, aber nicht verwendbar oder kann nicht aufgelöst werden.
- `ineligible_profile`: Das Profil ist aus einem anderen Grund nicht mit der Provider-Konfiguration kompatibel.
- `no_model`: Eine Provider-Authentifizierung ist vorhanden, aber OpenClaw konnte für diesen Provider keinen prüfbaren Modellkandidaten auflösen.

Zur Fehlerbehebung bei OpenAI ChatGPT/Codex OAuth können Sie mit `openclaw models status`, `openclaw models auth list --provider openai` und `openclaw config get agents.defaults.model --json` am schnellsten prüfen, ob ein Agent über ein verwendbares OAuth-Profil für `openai` verfügt, um `openai/*` über die native Codex-Laufzeit zu verwenden. Siehe [Einrichtung des OpenAI-Providers](/de/providers/openai#check-and-recover-codex-oauth-routing).

### Auflisten

`openclaw models list` ist schreibgeschützt: Der Befehl liest die Konfiguration, Authentifizierungsprofile, den vorhandenen Katalogzustand und Provider-eigene Katalogzeilen, schreibt `models.json` jedoch niemals neu.

Optionen: `--all` (vollständiger Katalog), `--local` (auf lokale Modelle beschränken), `--provider <id>`, `--json`, `--plain`.

Hinweise:

- Die Spalte `Auth` ist schreibgeschützt. Bei Provider-eigenen Modellrouten wie OpenAI gleicht sie die API-/Basis-URL-Route jeder Zeile mit geeigneten Profilen gemäß der effektiven Reihenfolge in `auth.order`, Anmeldedaten aus Umgebungsvariablen oder der Konfiguration und aufgelösten befehlsbezogenen SecretRefs ab. Eine konkrete OpenAI-Zeile bleibt unbekannt, wenn ihre Routenrichtlinie nicht verfügbar ist, statt die Authentifizierung auf Provider-Ebene zu übernehmen; ältere Prüfungen ausschließlich auf Provider-Ebene und andere Provider behalten das Verhalten auf Provider-Ebene bei. Synthetische Authentifizierungsmetadaten eines Plugins sind lediglich ein Hinweis auf Laufzeitfähigkeiten und kein Nachweis einer nativen Kontoauthentifizierung. Daher bleiben kontoabhängige Routen ohne positive Registerdaten unbekannt. Der Befehl lädt weder die Provider-Laufzeit noch liest er Schlüsselbundgeheimnisse, ruft Provider-APIs auf oder weist die exakte Ausführungsbereitschaft nach.
- `models list --all --provider <id>` kann Provider-eigene statische Katalogzeilen aus Plugin-Manifesten oder gebündelten Provider-Katalogmetadaten enthalten, auch wenn Sie sich noch nicht bei diesem Provider authentifiziert haben. Diese Zeilen werden weiterhin als nicht verfügbar angezeigt, bis eine passende Authentifizierung konfiguriert ist.
- `models list` hält die Steuerungsebene reaktionsfähig, während die Erkennung des Provider-Katalogs langsam abläuft. Die Standardansicht und die konfigurierten Ansichten greifen nach einer kurzen Wartezeit auf konfigurierte oder synthetische Modellzeilen zurück und lassen die Erkennung im Hintergrund abschließen. Verwenden Sie `--all`, wenn Sie den exakten, vollständig erkannten Katalog benötigen und bereit sind, auf die Provider-Erkennung zu warten.
- Ein umfassender Aufruf von `models list --all` führt Manifest-Katalogzeilen mit Vorrang vor Registerzeilen zusammen, ohne ergänzende Hooks der Provider-Laufzeit zu laden. Nach Providern gefilterte Manifest-Schnellpfade verwenden nur Provider, die als `static` gekennzeichnet sind; als `refreshable` gekennzeichnete Provider bleiben register-/cachegestützt und hängen Manifestzeilen als Ergänzungen an, während als `runtime` gekennzeichnete Provider weiterhin die Register-/Laufzeiterkennung verwenden.
- `models list` hält native Modellmetadaten und Laufzeitbegrenzungen getrennt. In der Tabellenausgabe zeigt `Ctx` `contextTokens/contextWindow`, wenn sich eine effektive Laufzeitbegrenzung vom nativen Kontextfenster unterscheidet; JSON-Zeilen enthalten `contextTokens`, wenn ein Provider diese Begrenzung bereitstellt.
- Bei Provider-eigenen Routen projiziert `models list` eine logische Provider-/Modellzeile auf die ausgewählte Route. `Input` und `Ctx` stammen ausschließlich aus einer exakt passenden Katalogzeile der physischen Route, wobei explizit konfigurierte logische Überschreibungen zuletzt angewendet werden; bei einer nicht aufgelösten Routenauswahl werden unbekannte Fähigkeitsfelder angezeigt, statt Metadaten einer verwandten Route zu übernehmen.
- `models list --provider <id>` filtert nach Provider-ID, etwa `moonshot` oder `openai`. Anzeigenamen aus interaktiven Provider-Auswahllisten wie `Moonshot AI` werden nicht akzeptiert.
- Modellreferenzen werden am **ersten** `/` getrennt. Wenn die Modell-ID ein `/` enthält (im OpenRouter-Stil), geben Sie das Provider-Präfix an (Beispiel: `openrouter/moonshotai/kimi-k2`).
- Wenn Sie den Provider weglassen, löst OpenClaw die Eingabe zunächst als Alias auf, danach als eindeutige Übereinstimmung eines konfigurierten Providers mit genau dieser Modell-ID und greift erst dann unter Ausgabe einer Veraltungswarnung auf den konfigurierten Standard-Provider zurück. Wenn dieser Provider das konfigurierte Standardmodell nicht mehr bereitstellt, greift OpenClaw auf das erste konfigurierte Provider-/Modellpaar zurück, statt einen veralteten Standardwert eines entfernten Providers anzuzeigen.
- `models status` kann in der Authentifizierungsausgabe `marker(<value>)` für nicht geheime Platzhalter anzeigen (beispielsweise `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`), statt sie wie Geheimnisse zu maskieren.

### Standard-/Bildmodell festlegen

```bash
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
```

`set` schreibt `agents.defaults.model.primary`; `set-image` schreibt `agents.defaults.imageModel.primary`. Beide akzeptieren `provider/model` oder einen konfigurierten Alias. `set` repariert außerdem Installationen von Codex-/Copilot-Laufzeit-Plugins, wenn das neu ausgewählte Modell eines benötigt; `set-image` tut dies nicht. Keiner der beiden Befehle akzeptiert `--agent`; sie schreiben stets die Standardeinstellungen für Agenten.

### Scannen

`models scan` liest den öffentlichen `:free`-Katalog von OpenRouter und bewertet Kandidaten für die Verwendung als Fallback. Der Katalog selbst ist öffentlich, daher benötigen reine Metadaten-Scans keinen OpenRouter-Schlüssel.

Standardmäßig versucht OpenClaw, die Unterstützung für Tools und Bilder mit Live-Modellaufrufen zu prüfen. Wenn kein OpenRouter-Schlüssel konfiguriert ist, greift der Befehl auf eine reine Metadatenausgabe zurück und weist darauf hin, dass `:free`-Modelle für Prüfungen und Inferenz weiterhin `OPENROUTER_API_KEY` benötigen.

Optionen:

- `--no-probe` (nur Metadaten; kein Nachschlagen von Konfiguration/Geheimnissen)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (Zeitüberschreitung für Kataloganfrage und einzelne Prüfungen)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` und `--set-image` erfordern Live-Prüfungen; Ergebnisse reiner Metadaten-Scans dienen nur zur Information und werden nicht auf die Konfiguration angewendet.

## Aliasse

```bash
openclaw models aliases list [--json] [--plain]
openclaw models aliases add <alias> <model-or-alias>
openclaw models aliases remove <alias>
```

Aliasse werden pro Modelleintrag unter `agents.defaults.models.<key>.alias` gespeichert. `add` löst `<model-or-alias>` zunächst in einen kanonischen Provider-/Modellschlüssel auf. Wenn Sie daher einem Alias einen Alias zuweisen, wird er neu zugeordnet, statt eine Kette zu bilden.

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

`models auth add` ist der interaktive Assistent für die Authentifizierung. Je nach ausgewähltem Provider kann er einen Authentifizierungsablauf des Providers (OAuth/API-Schlüssel) starten oder Sie durch das manuelle Einfügen eines Tokens führen.

`models auth list` listet gespeicherte Authentifizierungsprofile für den ausgewählten Agenten auf, ohne Token, API-Schlüssel oder geheimes OAuth-Material auszugeben. Verwenden Sie `--provider <id>`, um nach einem einzelnen Provider wie `openai` zu filtern, und `--json` für Skripte.

`models auth login` führt den Authentifizierungsablauf eines Provider-Plugins (OAuth/API-Schlüssel) aus. Verwenden Sie `openclaw plugins list`, um zu sehen, welche Provider installiert sind. `login` akzeptiert `--profile-id <id>` für Provider, die benannte Profile während der Anmeldung unterstützen (verwenden Sie dies, um mehrere Anmeldungen beim selben Provider getrennt zu halten), `--method <id>` zur Auswahl einer bestimmten Authentifizierungsmethode, `--device-code` als Kurzform für `--method device-code`, `--set-default`, um das vom Provider empfohlene Standardmodell anzuwenden, und `--force`, um zunächst vorhandene Profile dieses Providers zu entfernen (verwenden Sie dies, wenn ein zwischengespeichertes OAuth-Profil nicht mehr funktioniert oder Sie das Konto wechseln möchten).

`models auth login-github-copilot` ist eine Kurzform für `models auth login --provider github-copilot --method device` (GitHub-Gerätefluss); der Befehl akzeptiert `--yes`, um ein vorhandenes Profil ohne Rückfrage zu überschreiben.

Verwenden Sie `openclaw models auth --agent <id> <subcommand>`, um Authentifizierungsergebnisse in den Speicher eines bestimmten konfigurierten Agenten zu schreiben. Das übergeordnete Flag `--agent` wird von `add`, `list`, `login`, `paste-api-key`, `setup-token`, `paste-token`, `login-github-copilot` sowie `order get`/`set`/`clear` berücksichtigt.

Für OpenAI-Modelle verwendet `--provider openai` standardmäßig die Anmeldung mit einem ChatGPT-/Codex-Konto. Verwenden Sie `--method api-key` nur, wenn Sie ein OpenAI-API-Schlüsselprofil hinzufügen möchten, üblicherweise als Absicherung bei Einschränkungen des Codex-Abonnements. Führen Sie `openclaw doctor --fix` aus, um ältere Authentifizierungs-/Profilzustände mit dem veralteten OpenAI-Codex-Präfix zu `openai` zu migrieren.

Beispiele:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

Hinweise:

- `paste-api-key` akzeptiert andernorts generierte API-Schlüssel, fordert zur Eingabe des Schlüsselwerts auf und schreibt ihn unter der standardmäßigen Profil-ID `<provider>:manual`, sofern Sie nicht `--profile-id` angeben. Leiten Sie bei der Automatisierung den Schlüssel über stdin weiter, beispielsweise mit `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`.
- `setup-token` und `paste-token` bleiben generische Token-Befehle für Provider, die Token-Authentifizierungsmethoden bereitstellen.
- `setup-token` erfordert ein interaktives TTY und führt die Token-Authentifizierungsmethode des Providers aus (standardmäßig die Methode `setup-token` dieses Providers, sofern er eine solche bereitstellt).
- `paste-token` erfordert `--provider`, fordert standardmäßig zur Eingabe des Token-Werts auf und schreibt ihn unter der standardmäßigen Profil-ID `<provider>:manual`, sofern Sie nicht `--profile-id` angeben. Leiten Sie bei der Automatisierung das Token über stdin weiter, anstatt es als Argument zu übergeben, damit Provider-Anmeldedaten nicht im Shell-Verlauf oder in Prozesslisten erscheinen.
- `paste-token --expires-in <duration>` speichert anhand einer relativen Dauer wie `365d` oder `12h` einen absoluten Token-Ablaufzeitpunkt.
- Für `openai` weisen OpenAI-API-Schlüssel und ChatGPT-/OAuth-Token-Material unterschiedliche Authentifizierungsformen auf. Verwenden Sie `paste-api-key` für OpenAI-API-Schlüssel im Format `sk-...` und `paste-token` ausschließlich für Token-Authentifizierungsmaterial.
- Anthropic: `setup-token`/`paste-token` sind von OpenClaw unterstützte Authentifizierungswege für `anthropic`, OpenClaw bevorzugt jedoch die Wiederverwendung der Claude CLI (`claude -p`) auf dem Host, sofern sie verfügbar ist.
- `auth order get/set/clear` verwaltet für einen Provider eine agentenspezifische Überschreibung der Reihenfolge von Authentifizierungsprofilen, die in `auth-state.json` gespeichert wird (getrennt vom Konfigurationsschlüssel `auth.order.<provider>`). `set` akzeptiert eine oder mehrere Profil-IDs in Prioritätsreihenfolge; `clear` greift wieder auf die Konfigurations-/Round-Robin-Reihenfolge zurück.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Modellauswahl](/de/concepts/model-providers)
- [Modell-Failover](/de/concepts/model-failover)
