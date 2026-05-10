---
read_when:
    - Sie möchten Zugangsdaten, Geräte oder Agent-Standardeinstellungen interaktiv anpassen
summary: CLI-Referenz für `openclaw configure` (interaktive Konfigurationsabfragen)
title: Konfigurieren
x-i18n:
    generated_at: "2026-05-10T19:27:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: aba5320fefb856c208405511619fc1a4314e3f5e3990f221e987a03d692189fb
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Interaktive Eingabeaufforderung für gezielte Änderungen an einer bestehenden Einrichtung: Zugangsdaten, Geräte, Agent-Standardwerte, Gateway, Kanäle, Plugins, Skills und Zustandsprüfungen.

Verwenden Sie `openclaw onboard` für den vollständigen geführten ersten Durchlauf, `openclaw setup` nur für die Basiskonfiguration/den Arbeitsbereich und `openclaw channels add`, wenn Sie nur die Einrichtung eines Kanalkontos benötigen.

<Note>
Der Abschnitt **Modell** enthält eine Mehrfachauswahl für die Positivliste `agents.defaults.models` (was in `/model` und in der Modellauswahl angezeigt wird). Provider-spezifische Einrichtungsoptionen führen die ausgewählten Modelle mit der vorhandenen Positivliste zusammen, statt nicht verwandte Provider, die bereits in der Konfiguration vorhanden sind, zu ersetzen.

Wenn Sie die Provider-Authentifizierung über configure erneut ausführen, bleibt ein vorhandenes `agents.defaults.model.primary` erhalten, selbst wenn der Authentifizierungsschritt des Providers einen Konfigurationspatch mit einem eigenen empfohlenen Standardmodell zurückgibt. Das bedeutet, dass das Hinzufügen oder erneute Authentifizieren von xAI, OpenRouter oder einem anderen Provider das neue Modell verfügbar machen sollte, ohne Ihr aktuelles primäres Modell zu übernehmen. Verwenden Sie `openclaw models auth login --provider <id> --set-default` oder `openclaw models set <model>`, wenn Sie das Standardmodell absichtlich ändern möchten.
</Note>

Wenn configure über eine Provider-Authentifizierungsoption gestartet wird, bevorzugen die Auswahl für Standardmodell und Positivliste automatisch diesen Provider. Bei gekoppelten Providern wie Volcengine und BytePlus gilt dieselbe Präferenz auch für deren Coding-Plan-Varianten (`volcengine-plan/*`, `byteplus-plan/*`). Wenn der Filter für den bevorzugten Provider eine leere Liste ergeben würde, fällt configure stattdessen auf den ungefilterten Katalog zurück, anstatt eine leere Auswahl anzuzeigen.

<Tip>
`openclaw config` ohne Unterbefehl öffnet denselben Assistenten. Verwenden Sie `openclaw config get|set|unset` für nicht interaktive Änderungen.
</Tip>

Für die Websuche können Sie mit `openclaw configure --section web` einen Provider auswählen
und dessen Zugangsdaten konfigurieren. Einige Provider zeigen außerdem Provider-spezifische
Folgeeingaben an:

- **Grok** kann eine optionale `x_search`-Einrichtung mit demselben `XAI_API_KEY` anbieten und
  Sie ein `x_search`-Modell auswählen lassen.
- **Kimi** kann nach der Moonshot-API-Region (`api.moonshot.ai` vs
  `api.moonshot.cn`) und dem standardmäßigen Kimi-Websuchmodell fragen.

Verwandt:

- Referenz zur Gateway-Konfiguration: [Konfiguration](/de/gateway/configuration)
- Konfigurations-CLI: [Konfiguration](/de/cli/config)

## Optionen

- `--section <section>`: wiederholbarer Abschnittsfilter

Verfügbare Abschnitte:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

Hinweise:

- Die Auswahl, wo das Gateway ausgeführt wird, aktualisiert immer `gateway.mode`. Sie können „Fortfahren“ auswählen, ohne weitere Abschnitte zu verwenden, wenn das alles ist, was Sie benötigen.
- Nach lokalen Konfigurationsschreibvorgängen installiert configure ausgewählte herunterladbare Plugins, wenn der gewählte Einrichtungspfad sie erfordert. Die Remote-Gateway-Konfiguration installiert keine lokalen Plugin-Pakete.
- Kanalorientierte Dienste (Slack/Discord/Matrix/Microsoft Teams) fragen während der Einrichtung nach Positivlisten für Kanäle/Räume. Sie können Namen oder IDs eingeben; der Assistent löst Namen nach Möglichkeit in IDs auf.
- Wenn Sie den Daemon-Installationsschritt ausführen, die Token-Authentifizierung ein Token erfordert und `gateway.auth.token` von SecretRef verwaltet wird, validiert configure die SecretRef, speichert aber keine aufgelösten Klartext-Tokenwerte in den Umgebungsmetadaten des Supervisor-Dienstes.
- Wenn die Token-Authentifizierung ein Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst ist, blockiert configure die Daemon-Installation mit umsetzbaren Hinweisen zur Behebung.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert configure die Daemon-Installation, bis der Modus explizit gesetzt wird.

## Beispiele

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## Verwandt

- [CLI-Referenz](/de/cli)
- [Konfiguration](/de/gateway/configuration)
